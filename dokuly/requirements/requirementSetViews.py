import re
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.contrib.postgres.search import SearchVector
from rest_framework import status
from datetime import datetime
from datetime import date
from django.db import transaction
from requirements.models import RequirementSet, Requirement
from .models import Requirement, RequirementSet
from .serializers import RequirementSetSerializer, RequirementSerializer, RequirementSetSerializerWithProject
from profiles.models import Profile
from parts.models import Part
from profiles.views import check_permissions_standard
from profiles.serializers import ProfileSerializer

from profiles.views import check_permissions_ownership, check_permissions_standard, check_user_auth_and_app_permission
from projects.models import Project


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def create_requirement_set(request):
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "requirements")
    if not permission:
        return response
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    try:
        data = request.data
        requirementSet = RequirementSet()
        if "display_name" in data:
            requirementSet.display_name = data["display_name"]
        if "description" in data:
            requirementSet.description = data["description"]
        if "project" in data:
            try:
                project = Project.objects.filter(id=data["project"]).filter(project_members=user)
                if not project.exists():
                    return Response("Project not found", status=status.HTTP_404_NOT_FOUND)
                requirementSet.project = project.first()
            except Exception as e:
                return Response(f"Project not found: {e}", status=status.HTTP_404_NOT_FOUND)

        requirementSet.created_by = user
        requirementSet.save()

        serializer = RequirementSetSerializer(requirementSet, many=False)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            f"create_requirement_set failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def edit_requirement_set(request, id):
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "requirements")
    if not permission:
        return response
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    try:
        data = request.data
        requirementSet = RequirementSet.objects.get(
            Q(id=id) & (Q(project__project_members=user) | Q(project__isnull=True))
        )
        if "display_name" in data:
            requirementSet.display_name = data["display_name"]
        if "description" in data:
            requirementSet.description = data["description"]
        if "project" in data:
            try:
                project = Project.objects.filter(id=data["project"]).filter(project_members=user)
                if not project.exists():
                    return Response("Project not found", status=status.HTTP_404_NOT_FOUND)
                requirementSet.project = project.first()
            except Exception as e:
                return Response(f"Project not found: {e}", status=status.HTTP_404_NOT_FOUND)
        if "tags" in data:
            requirementSet.tags = data["tags"]
        requirementSet.created_by = user
        requirementSet.save()

        serializer = RequirementSetSerializer(requirementSet, many=False)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            f"create_requirement_set failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def get_requirement_set(request, id):
    """Returns a requirement set object."""
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "requirements")
    if not permission:
        return response
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    try:
        # Fetch the requirement set with the related project data
        requirementSet = RequirementSet.objects.select_related('project').get(
            Q(id=id) & (Q(project__project_members=user) | Q(project__isnull=True))
        )
        # Count the number of requirements in the requirement set
        # We only need to count the requirements that are the lowest level
        # in the requirement tree
        requirements = Requirement.objects.filter(requirement_set=requirementSet)
        count = 0
        verified_count = 0
        for requirement in requirements:
            if not Requirement.objects.filter(parent_requirement=requirement).exists():
                count += 1
                if requirement.is_verified:
                    verified_count += 1
        # Serialize the requirement set
        serializer = RequirementSetSerializerWithProject(requirementSet, many=False)
        # Add the number of requirements to the serialized data
        data = serializer.data
        data["requirement_count"] = count
        data["verified_count"] = verified_count
        return Response(data, status=status.HTTP_200_OK)
    except RequirementSet.DoesNotExist:
        return Response("Requirement Set not found", status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            f"get_requirement_set failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_all_requirement_sets(request):
    """Returns a requirement set object."""
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "requirements")
    if not permission:
        return response
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    try:
        requirementSet = RequirementSet.objects.filter(
            Q(project__project_members=user) | Q(project__isnull=True)
        )

        serializer = RequirementSetSerializer(requirementSet, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Requirement.DoesNotExist:
        return Response("Requirement set not found", status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            f"get_requirement_set failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(("DELETE",))
@renderer_classes((JSONRenderer,))
@permission_classes((IsAuthenticated,))
def delete_requirement_set(request, id):
    # Delete a requirements set in a transaction
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "requirements")
    if not permission:
        return response
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    try:
        with transaction.atomic():
            requirementSet = RequirementSet.objects.get(
                Q(id=id) & (Q(project__project_members=user) | Q(project__isnull=True))
            )
            requirementSet.delete()
            return Response("Requirement set deleted", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"delete_requirement_set failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
