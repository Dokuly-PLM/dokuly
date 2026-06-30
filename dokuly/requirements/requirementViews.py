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
from documents.models import Document, Document_Reference

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
        if "external_requirement_id" in data:
            external_requirement_id = (data["external_requirement_id"] or "").strip()
            if external_requirement_id:
                duplicate_exists = Requirement.objects.filter(
                    requirement_set=requirement.requirement_set,
                    external_requirement_id__iexact=external_requirement_id,
                ).exclude(id=requirement.id).exists()
                if duplicate_exists:
                    return Response(
                        "External requirement ID already exists in this requirement set.",
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            requirement.external_requirement_id = external_requirement_id
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
        requirement = Requirement.objects.prefetch_related(
            "statement_references__document",
            "verification_references__document",
        ).get(id=id)

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
        requirements = Requirement.objects.filter(requirement_set_id=set_id).prefetch_related(
            "tags", "statement_references__document", "verification_references__document"
        )
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


@api_view(["PUT"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def update_requirement_document_references(request, requirement_id):
    """Replace a requirement's statement or verification references."""
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "requirements")
    if not permission:
        return response

    requirement = get_object_or_404(Requirement, id=requirement_id)
    project = requirement.requirement_set.project
    if project and not project.project_members.filter(id=user.id).exists():
        return Response("Unauthorized", status=status.HTTP_403_FORBIDDEN)

    references_payload = request.data.get("references", [])
    reference_type = (request.data.get("reference_type") or "statement").strip().lower()
    if not isinstance(references_payload, list):
        return Response("references must be a list", status=status.HTTP_400_BAD_REQUEST)

    if reference_type not in ["statement", "verification"]:
        return Response(
            "reference_type must be either 'statement' or 'verification'",
            status=status.HTTP_400_BAD_REQUEST,
        )

    if len(references_payload) > 1:
        return Response(
            "Only one reference is allowed per reference type.",
            status=status.HTTP_400_BAD_REQUEST,
        )

    document_ids = []
    normalized_references = []
    for entry in references_payload:
        if not isinstance(entry, dict):
            return Response("Each reference must be an object", status=status.HTTP_400_BAD_REQUEST)
        document_id = entry.get("document_id")
        if document_id is None:
            return Response("document_id is required for each reference", status=status.HTTP_400_BAD_REQUEST)
        page_number = entry.get("page_number")
        if page_number in ("", None):
            page_number = None
        else:
            try:
                page_number = int(page_number)
            except (TypeError, ValueError):
                return Response("page_number must be an integer or empty", status=status.HTTP_400_BAD_REQUEST)

        document_ids.append(document_id)
        normalized_references.append({
            "document_id": document_id,
            "page_number": page_number,
        })

    documents = list(Document.objects.filter(id__in=document_ids, is_archived=False))
    found_ids = {doc.id for doc in documents}
    missing_ids = [doc_id for doc_id in document_ids if doc_id not in found_ids]
    if missing_ids:
        return Response(
            f"Documents not found: {missing_ids}",
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Validate each selected document by the same project access rule as document views.
    invalid_docs = [
        doc.id
        for doc in documents
        if not (
            doc.project is None
            or doc.project.project_members.filter(id=user.id).exists()
        )
    ]
    if invalid_docs:
        return Response(
            f"Unauthorized documents: {invalid_docs}",
            status=status.HTTP_403_FORBIDDEN,
        )

    references = []
    document_lookup = {doc.id: doc for doc in documents}
    for entry in normalized_references:
        doc = document_lookup[entry["document_id"]]
        reference = Document_Reference.objects.filter(
            document=doc,
            page_number=entry["page_number"],
        ).first()
        if reference is None:
            reference = Document_Reference.objects.create(
                document=doc,
                page_number=entry["page_number"],
            )
        references.append(reference)

    if reference_type == "verification":
        requirement.verification_references.set(references)
    else:
        requirement.statement_references.set(references)

    refreshed = Requirement.objects.prefetch_related(
        "statement_references__document",
        "verification_references__document",
    ).get(id=requirement_id)
    serializer = RequirementSerializer(refreshed, many=False)
    return Response(serializer.data, status=status.HTTP_200_OK)
