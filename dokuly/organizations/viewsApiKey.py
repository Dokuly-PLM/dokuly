from rest_framework.decorators import api_view, permission_classes, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework import status
from organizations.models import OrganizationAPIKey, Project, Organization
from organizations.serializers import OrganizationManagerSerializer
from projects.serializers import ProjectSerializer, ProjectSerializerWithCustomer
from profiles.permissions import IsAdminOrOwner
from django.shortcuts import get_object_or_404
from rest_framework_api_key.models import APIKey
from django.utils import timezone


@api_view(['POST'])
@permission_classes([IsAdminOrOwner])
@renderer_classes([JSONRenderer])
def generate_api_key(request):
    """
    Generate a new API Key and associate it with a specified organization and projects (optional).
    """
    project_ids = request.data.get('project_ids', [])
    organization_id = request.user.profile.organization_id
    expiry_days = int(request.data.get('expiry_days', 14))

    organization = Organization.objects.filter(id=organization_id).first()
    if not organization:
        return Response({'error': 'Invalid organization ID'}, status=status.HTTP_400_BAD_REQUEST)

    # Create an API key instance and generate the key
    api_key, key = OrganizationAPIKey.objects.create_key(
        organization=organization,
        name=organization.name + " API Key"
    )

    api_key.projects.set(Project.objects.filter(id__in=project_ids))
    api_key.encrypted_api_key = key
    # Set expiry date as needed
    api_key.expiry_date = timezone.now() + timezone.timedelta(days=expiry_days)
    api_key.save()
    return Response({'message': 'API Key generated successfully'}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAdminOrOwner])
@renderer_classes([JSONRenderer])
def list_api_keys(request):
    """
    List all API Keys along with their associated organizations and projects,
    utilizing the OrganizationSerializer and ProjectSerializer for consistent
    and maintainable data representation.
    """
    keys = OrganizationAPIKey.objects.all().select_related(
        'organization'
    ).prefetch_related(
        'projects__customer'
    )

    keys_data = []

    # This loop is kinda redundant, as currently each tenant in dokuly only has 1 organization.
    # So its current complexity O(1), but it supports multiple organizations in the future.
    for key in keys:
        if key.organization:
            organization_data = OrganizationManagerSerializer(
                key.organization).data
        else:
            organization_data = "No Organization"

        project_data = ProjectSerializerWithCustomer(
            key.projects.all(), many=True).data
        keys_data.append({
            'key': key.encrypted_api_key,
            "expiry_date": key.expiry_date,
            'organization': organization_data,
            'projects': project_data,
            "prefix": key.prefix
        })

    return Response(keys_data)


@api_view(['DELETE'])
@permission_classes([IsAdminOrOwner])
@renderer_classes([JSONRenderer])
def delete_api_key(request, key_id):
    """
    Delete an API key permanently. This view uses get_object_or_404 to ensure that the API key exists
    before attempting to delete it, thereby preventing deletion errors and ensuring that a 404 response
    is returned if the API key is not found.
    """
    if not key_id:
        return Response({'error': 'API Key ID is required'}, status=status.HTTP_400_BAD_REQUEST)
    try:
        organization_api_key = OrganizationAPIKey.objects.get(prefix=key_id)

        # Proceed with deletion if the API key is found
        organization_api_key.delete()

        # Return a success response indicating that the API key was deleted
        return Response({'message': 'API Key deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
    except OrganizationAPIKey.model.DoesNotExist:
        # Return a 404 response if the API key is not found
        return Response({'error': 'API Key not found'}, status=status.HTTP_404_NOT_FOUND)
