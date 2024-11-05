from django.contrib.auth.decorators import login_required
from django.contrib.postgres.search import SearchVector
from django.db.models import Q
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from django.shortcuts import get_object_or_404
from profiles.utilityFunctions import create_notification
from .models import Project, Tag
from .serializers import TagSerializer
from profiles.views import check_permissions_standard
from django.contrib.auth.models import User
from profiles.models import Profile
from customers.models import Customer
from profiles.views import check_permissions_ownership, check_permissions_standard, check_permissions_admin, check_user_auth_and_app_permission
from organizations.views import get_subscription_type
from django.db.models.query import QuerySet
from rest_framework.permissions import IsAuthenticated
from organizations.permissions import APIAndProjectAccess


@api_view(['GET'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def get_project_tags(request, project_id):
    """Get all tags for a project or unassociated tags if project_id is 0"""
    try:
        # Check if project_id is 0
        if project_id == 0:
            # Fetch tags with no associated project
            tags = Tag.objects.filter(project__isnull=True)
        else:
            # Fetch tags for the specific project
            project = get_object_or_404(Project, pk=project_id)
            tags = Tag.objects.filter(project=project)

        serializer = TagSerializer(tags, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def update_project_tag(request, tag_id):
    """Update a project's tags"""
    try:
        tag = get_object_or_404(Tag, pk=tag_id)
        serializer = TagSerializer(tag, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def delete_project_tag(request, tag_id):
    """Delete a project's tag"""
    try:
        tag = get_object_or_404(Tag, pk=tag_id)
        tag.delete()
        return Response("Tag deleted successfully.", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


def check_for_and_create_new_tags(project: Project, tags_data):
    """
    Adds tags to a project. Creates new tags for those with an id of -1,
    or uses existing tags if a tag with the same name already exists.

    Args:
        project (Project): The project instance to add tags to.
        tags_data (list): A list of tag dictionaries, where new tags have an id of -1.

    Returns:
        tuple: A tuple containing a boolean indicating if there was an error (True/False),
               a message string, and the list of tag IDs.
    """
    # List to store all tag IDs to return
    tag_ids = []

    # Separate existing tags and new tags
    existing_tag_ids = [tag['id'] for tag in tags_data if tag['id'] != -1]
    new_tags_data = [tag for tag in tags_data if tag['id'] == -1]

    # Update existing tags to associate them with the project
    if existing_tag_ids:
        if project:
            Tag.objects.filter(id__in=existing_tag_ids).update(project=project)
        tag_ids.extend(existing_tag_ids)  # Add existing tag IDs to the list

    # Create new tags or use existing tags if they already exist
    for tag_data in new_tags_data:
        tag_name = tag_data.get('name')
        tag_color = tag_data.get('color')

        # Check if a tag with the same name already exists for this project
        if project:
            existing_tag = Tag.objects.filter(name=tag_name, project=project).first()
        else:
            existing_tag = Tag.objects.filter(name=tag_name, project__isnull=True).first()

        if existing_tag:
            # If an existing tag is found, add its ID to tag_ids
            tag_ids.append(existing_tag.id)
        else:
            # Create a new tag and associate it with the project
            new_tag = Tag(name=tag_name, color=tag_color)
            if project:
                new_tag.project = project
            try:
                new_tag.save()
                tag_ids.append(new_tag.id)  # Add the new tag ID to the list
            except Exception as e:
                return True, f"Error creating tag '{tag_name}': {str(e)}", []

    return False, "Tags updated successfully.", tag_ids
