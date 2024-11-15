import re
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.shortcuts import get_object_or_404
from profiles.models import Profile
from rest_framework import status
from projects.viewsTags import check_for_and_create_new_tags

from .models import Requirement, RequirementSet
from .serializers import RequirementSerializer
from profiles.views import check_permissions_standard

from django.contrib.auth.models import User
from profiles.views import check_permissions_standard, check_user_auth_and_app_permission


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def create_requirement(request, set_id):
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "requirements")
    if not permission:
        return response

    try:
        requirement = Requirement()
        requirement.requirement_set_id = set_id
        requirement.created_by = user
        requirement.obligation_level = "Shall"
        requirement.state = "Draft"
        requirement.save()

        serializer = RequirementSerializer(requirement, many=False)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            f"create_requirement_set failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(("DELETE",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def delete_requirement(request, id):
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "requirements")
    if not permission:
        return response

    try:
        requirement = Requirement.objects.get(id=id)
        project = requirement.requirement_set.project
        # Check if the project of the requirement set includes the user or if the project is null
        if project and (
            project.project_members.filter(id=user.id).exists() or project.isnull
        ):
            requirement.delete()
            return Response("Requirement deleted", status=status.HTTP_200_OK)

        return Response("Unauthorized", status=status.HTTP_403_FORBIDDEN)

    except Exception as e:
        return Response(
            f"create_requirement_set failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def create_sub_requirement(request, parent_id):
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "requirements")
    if not permission:
        return response

    try:
        requirement = Requirement()
        requirement.requirement_set_id = request.data["requirement_set"]
        requirement.parent_requirement_id = parent_id
        requirement.created_by = user
        requirement.obligation_level = "Shall"
        requirement.state = "Draft"
        requirement.save()

        serializer = RequirementSerializer(requirement, many=False)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            f"create_requirement_set failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def edit_requirement(request, id):
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "requirements")
    if not permission:
        return response

    try:
        # Retrieve the requirement with the given id
        requirement = get_object_or_404(Requirement, id=id)

        project = requirement.requirement_set.project
        # Check if the project of the requirement set includes the user or if the project is null
        if project and (
            not project.project_members.filter(id=user.id).exists()
            and not project.isnull
        ):
            return Response("Unauthorized", status=status.HTTP_403_FORBIDDEN)

        data = request.data

        if "obligation_level" in data:
            requirement.obligation_level = data["obligation_level"]
        if "rationale" in data:
            requirement.rationale = data["rationale"]
        if "parent_requirement" in data:
            requirement.parent_requirement_id = data["parent_requirement"]
            requirement.derived_from.clear()  # Cant be both derived from and have a parent
        if "derived_from" in data:
            requirement.derived_from.set(data["derived_from"])
            requirement.parent_requirement = None  # Cant be both derived from and have a parent
        if "superseded_by" in data:
            requirement.superseded_by_id = data["superseded_by"]
        if "statement" in data:
            requirement.statement = data["statement"]
        if "verification_class" in data:
            requirement.verification_class = data["verification_class"]
        if "verification_method" in data:
            requirement.verification_method = data["verification_method"]
        if "verification_results" in data:
            requirement.verification_results = data["verification_results"]
        if "type" in data:
            requirement.type = data["type"]
        if "state" in data:
            requirement.state = data["state"]
        if "verified_by" in data:
            try:
                profile = Profile.objects.get(id=data["verified_by"])
                requirement.verified_by = profile
            except Exception as e:
                return Response(
                    f"edit_requirement failed: {str(e)}",
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )
        if "is_verified" in data:
            requirement.is_verified = data["is_verified"]
        if "tags" in data:
            error, message, tag_ids = check_for_and_create_new_tags(requirement.requirement_set.project, data["tags"])
            if error:
                return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)
            requirement.tags.set(tag_ids)

        requirement.save()

        serializer = RequirementSerializer(requirement)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(
            f"edit_requirement failed: {str(e)}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_requirement(request, id: int):
    """Returns a requirement."""
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "requirements")
    if not permission:
        return response

    try:
        requirement = Requirement.objects.get(id=id)

        project = requirement.requirement_set.project
        # Check if the project of the requirement set includes the user or if the project is null
        if project and (
            project.project_members.filter(id=user.id).exists() or project.isnull
        ):
            serializer = RequirementSerializer(requirement, many=False)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response("Unauthorized", status=status.HTTP_403_FORBIDDEN)

    except Exception as e:
        return Response(
            f"get_requirement failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def get_top_requirements(request, set_id):
    """Returns all requirements for a given requirement set."""
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "requirements")
    if not permission:
        return response

    # First, retrieve the requirement set and verify permissions
    requirement_set = get_object_or_404(RequirementSet, id=set_id)

    # Check if the project of the requirement set includes the user or if the project is null
    if requirement_set.project and (
        requirement_set.project.project_members.filter(id=user.id).exists()
        or requirement_set.project.isnull
    ):
        requirements = Requirement.objects.filter(
            requirement_set_id=set_id, parent_requirement__isnull=True
        )

        serializer = RequirementSerializer(requirements, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    return Response("Unauthorized", status=status.HTTP_403_FORBIDDEN)


@api_view(["GET"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def get_requirements_by_set(request, set_id):
    """Returns all requirements for a given requirement set."""
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "requirements")
    if not permission:
        return response

    # First, retrieve the requirement set and verify permissions
    requirement_set = get_object_or_404(RequirementSet, id=set_id)

    # Check if the project of the requirement set includes the user or if the project is null
    if requirement_set.project and (
        requirement_set.project.project_members.filter(id=user.id).exists()
        or requirement_set.project.isnull
    ):
        requirements = Requirement.objects.filter(requirement_set_id=set_id).prefetch_related("tags")
        serializer = RequirementSerializer(requirements, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    return Response("Unauthorized", status=status.HTTP_403_FORBIDDEN)


@api_view(["GET"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def get_requirements_by_parent(request, parent_id):
    """Returns all requirements for a given requirement set."""
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "requirements")
    if not permission:
        return response
    try:

        parent = Requirement.objects.get(id=parent_id)
        project = parent.requirement_set.project

        if project and (
            project.project_members.filter(id=user.id).exists() or project.isnull
        ):
            requirements = Requirement.objects.filter(parent_requirement__id=parent_id)
            serializer = RequirementSerializer(requirements, many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        return Response("Unauthorized", status=status.HTTP_403_FORBIDDEN)
    except Exception as e:
        return Response(
            f"get_requirements_by_parent failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
