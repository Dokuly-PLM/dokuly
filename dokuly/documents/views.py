import uuid
from datetime import datetime
from io import BytesIO

from pdf2image import convert_from_bytes
from PIL import Image as PILImage
import tempfile
import os
import shutil

from organizations.revision_utils import build_full_document_number
from organizations.revision_utils import increment_revision_counters, build_formatted_revision
from part_numbers.methods import get_next_part_number
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from django.db.models import Q
from django.contrib.auth.decorators import login_required
from django.views.decorators.clickjacking import xframe_options_exempt
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.shortcuts import get_object_or_404

import documents.viewUtilities as util
from documents.models import Document, Document_Prefix, Reference_List
from assemblies.models import Assembly
from projects.views import check_project_access
from parts.models import Part
from documents.pdfProcessor import process_pdf, find_referenced_items
from projects.models import Project
from customers.models import Customer


from django.contrib.auth.models import User
from django.db import transaction

from profiles.models import Profile
from profiles.serializers import ProfileSerializer
from .serializers import DocumentSerializer, DocumentTableSerializer
from django.http import FileResponse
from rest_framework_api_key.permissions import HasAPIKey
from rest_framework.permissions import IsAuthenticated
from organizations.permissions import APIAndProjectAccess

from projects.models import Project
from customers.models import Customer
from profiles.views import (
    check_permissions_access,
    check_permissions_ownership,
    check_permissions_standard,
    check_authentication,
    check_user_auth_and_app_permission,
)

import files.views as fileViews
from files.models import Image, File
from files.fileUtilities import delete_image_with_cleanup, delete_file_with_cleanup
from .viewUtilities import (
    assemble_full_document_number,
    assemble_full_document_number_no_prefix_db_call,
)
from django.db.models import F, Case, When, Value, CharField
from projects.viewsIssues import link_issues_on_new_object_revision
from profiles.utilityFunctions import (
    notify_on_new_revision, notify_on_release_approval,
    notify_on_state_change_to_release)
from projects.viewsTags import check_for_and_create_new_tags
from django.core.files.base import ContentFile
from traceability.utilities import (
    log_created_event,
    log_revision_created_event,
    log_field_changes,
    log_traceability_event,
)
from documents.pdfUtils import generate_pdf_thumbnail, process_pdf_and_generate_thumbnail



def get_document_number(document, projects, prefixes):
    """Build document number by stitching fields from necessary tables."""
    full_project_number = ""
    prefix = ""
    
    # Get project number
    if document.get("project"):
        project_obj = next(
            (proj for proj in projects if proj.id == document["project"]), None
        )
        if project_obj and project_obj.full_project_number:
            full_project_number = str(project_obj.full_project_number)
    
    # Get prefix
    if document.get("prefix_id") and document["prefix_id"] != -1:
        prefix_obj = next(
            (pref for pref in prefixes if pref.id == document["prefix_id"]), None
        )
        prefix = prefix_obj.prefix if prefix_obj else ""
    else:
        prefix = document.get("document_type", "")
    
    # Build full document number
    document_number = (
        f"{prefix}{full_project_number}-"
        f"{document['document_number']}{document['formatted_revision']}"
    )
    return document_number


def increment_document_number(project_id):
    """Find the next available document number for a project."""
    documents = Document.objects.filter(project__id=project_id).exclude(
        is_archived=True
    )
    highest_num = 0
    for doc in documents:
        if highest_num < int(doc.document_number):
            highest_num = int(doc.document_number)

    return highest_num + 1


@swagger_auto_schema(
    method='post',
    operation_id='create_new_document',
    operation_description="""
    Create a new document.
    
    **Required fields:**
    - `title`: Title of the document (string)
    - `project`: Project ID (integer, must have access to the project)
    - `prefix_id`: Document prefix ID (integer)
    - `protection_level`: Protection level ID (integer)
    
    **Optional fields:**
    - `description`: Description of the document (string, can be "null" or "undefined")
    - `template_id`: Template document ID to copy from (integer, -1 to not use template)
    - `created_by`: User ID (only for API key requests, integer)
    - `internal`: DEPRECATED - use protection_level instead (boolean)
    
    **Note:** The document number is automatically generated based on the project and prefix.
    """,
    tags=['documents'],
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['title', 'project', 'prefix_id', 'protection_level'],
        properties={
            'title': openapi.Schema(type=openapi.TYPE_STRING, description='Title of the document', example='Product Requirements Document'),
            'project': openapi.Schema(type=openapi.TYPE_INTEGER, description='Project ID (must have access to the project)', example=1),
            'prefix_id': openapi.Schema(type=openapi.TYPE_INTEGER, description='Document prefix ID', example=1),
            'protection_level': openapi.Schema(type=openapi.TYPE_INTEGER, description='Protection level ID (e.g., 1 for Externally Shareable, 2 for Company Protected)', example=1),
            'description': openapi.Schema(type=openapi.TYPE_STRING, description='Description of the document (can be "null" or "undefined")', example='Product requirements and specifications'),
            'template_id': openapi.Schema(type=openapi.TYPE_INTEGER, description='Template document ID to copy from (-1 to not use template)', example=-1),
            'created_by': openapi.Schema(type=openapi.TYPE_INTEGER, description='User ID (only for API key requests)'),
            'internal': openapi.Schema(type=openapi.TYPE_BOOLEAN, description='DEPRECATED - use protection_level instead', example=False),
        }
    ),
    responses={
        201: openapi.Response(description='Document created successfully', schema=DocumentSerializer),
        400: openapi.Response(description='Bad request - missing required fields or invalid data'),
        401: openapi.Response(description='Unauthorized - no project access'),
    },
    security=[{'Token': []}, {'Api-Key': []}]
)
@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@permission_classes([APIAndProjectAccess | IsAuthenticated])
def create_new_document(request, **kwargs):
    data = request.data
    user = request.user
    try:
        # Check for deprecated internal field usage
        if "internal" in data and "protection_level" not in data:
            return Response(
                "The 'internal' field is deprecated. Please use 'protection_level' instead. "
                "Fetch available protection levels from /api/protectionLevels/get/all/",
                status=status.HTTP_400_BAD_REQUEST
            )
        
        document_number = increment_document_number(data["project"])
        document = Document()
        document.title = data["title"]
        if data["description"] != "null" and data["description"] != "undefined":
            document.description = data["description"]

        # Assign unique part number from centralized PartNumber table
        document.part_number = get_next_part_number()

        # Use new protection_level field
        if "protection_level" in data and data["protection_level"] not in ("null", "undefined", "", -1):
            document.protection_level_id = data["protection_level"]

        document.prefix_id = data["prefix_id"]
        
        # Initialize revision counters - both start at 0 for first revision
        document.revision_count_major = 0
        document.revision_count_minor = 0
        
        document.release_state = "Draft"
        document.is_archived = False
        if APIAndProjectAccess.has_validated_key(request):
            project = get_object_or_404(Project, id=data["project"])
            if not APIAndProjectAccess.check_project_access(request, project.id):
                return Response(
                    "Unauthorized", status=status.HTTP_401_UNAUTHORIZED
                )
            document.project = project
        else:
            document.project = get_object_or_404(
                Project, id=data["project"], project_members=user)
        if APIAndProjectAccess.has_validated_key(request):
            if "created_by" in data:
                document.created_by = User.objects.get(id=data["created_by"])
        else:
            document.created_by = request.user
            
        document.document_number = document_number
        document.is_latest_revision = True
        document.summary = ""
        prefix = Document_Prefix.objects.get(pk=data["prefix_id"])
        full_project_number = document.project.full_project_number


        # Get organization_id from user profile or API key for revision system
        organization_id = None
        organization_id = get_org_id(user)

        document.save()

        document.formatted_revision = build_formatted_revision(
            organization_id=organization_id,
            prefix=prefix.prefix,
            part_number=document.part_number,
            revision_count_major=document.revision_count_major,
            revision_count_minor=document.revision_count_minor,
            project_number=document.project.full_project_number if document.project else None,
            created_at=document.created_at
        )
        
        # Use template-based document number generation
        document.full_doc_number = build_full_document_number(
            organization_id=organization_id,
            prefix=prefix.prefix,
            document_number=document_number,
            revision_count_major=document.revision_count_major,
            revision_count_minor=document.revision_count_minor,
            project_number=document.project.full_project_number if document.project else None,
            part_number=document.part_number,
            created_at=document.created_at
        )
        document.save()

        if "template_id" in data and data["template_id"] not in (
            "null",
            "undefined",
            -1,
        ):

            try:
                template = Document.objects.get(id=data["template_id"])
                template_extension = template.document_file.name.split(".")[-1]
                document_file_name = (
                    document.full_doc_number
                    + "_-_"
                    + document.title
                    + "."
                    + template_extension
                )
                with template.document_file.open() as file:
                    document.document_file.save(
                        document_file_name, file, save=True)
            except Document.DoesNotExist:
                return Response(
                    "Template document does not exist", status=status.HTTP_201_CREATED
                )

        # Log creation event
        log_created_event(
            app_type="documents",
            item_id=document.id,
            user=document.created_by,
            revision=document.formatted_revision,
            details=f"Created document {document.full_doc_number}"
        )

        serializer = DocumentSerializer(document)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            f"create_new_document failed: {e}", status=status.HTTP_400_BAD_REQUEST
        )


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def edit_document_info(request, documentId):
    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "documents")
    if not permission:
        return response
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    if request.data == None or documentId == None:
        documents = Document.objects.exclude(is_archived=True)
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    data = request.data
    document = Document.objects.get(id=documentId)
    
    # Track changes for traceability
    changes = []
    
    if "title" in data and document.title != data["title"]:
        changes.append({"field": "title", "old": document.title, "new": data["title"]})
        document.title = data["title"]
    if "document_type" in data and document.document_type != data["document_type"]:
        changes.append({"field": "document_type", "old": document.document_type, "new": data["document_type"]})
        document.document_type = data["document_type"]
    if "description" in data and document.description != data["description"]:
        changes.append({"field": "description", "old": document.description, "new": data["description"]})
        document.description = data["description"]
    if "project" in data:
        try:
            project = Project.objects.get(id=data["project"])
            if document.project != project:
                old_project = document.project.full_project_number if document.project else None
                new_project = project.full_project_number if project else None
                changes.append({"field": "project", "old": old_project, "new": new_project})
                document.project = project
        except Project.DoesNotExist:
            pass

    if "language" in data and document.language != data["language"]:
        changes.append({"field": "language", "old": document.language, "new": data["language"]})
        document.language = data["language"]

    if "last_updated" in data:
        document.last_updated = data["last_updated"]
    if "protection_level" in data and data["protection_level"] not in ("null", "undefined", "", -1):
        new_protection_level = int(data["protection_level"])
        if document.protection_level_id != new_protection_level:
            changes.append({"field": "protection_level", "old": document.protection_level_id, "new": new_protection_level})
            document.protection_level_id = new_protection_level
    if "prefix_id" in data and document.prefix_id != data["prefix_id"]:
        changes.append({"field": "prefix_id", "old": document.prefix_id, "new": data["prefix_id"]})
        document.prefix_id = data["prefix_id"]
    if "summary" in data and document.summary != data["summary"]:
        changes.append({"field": "summary", "old": document.summary, "new": data["summary"]})
        document.summary = data["summary"]
    if "fullDN" in data and document.full_doc_number != data["fullDN"]:
        changes.append({"field": "full_doc_number", "old": document.full_doc_number, "new": data["fullDN"]})
        document.full_doc_number = data["fullDN"]
    if "shared_document_link" in data and document.shared_document_link != data["shared_document_link"]:
        changes.append({"field": "shared_document_link", "old": document.shared_document_link, "new": data["shared_document_link"]})
        document.shared_document_link = data["shared_document_link"]

    if "release_state" in data and data["release_state"] != document.release_state:
        old_state = document.release_state
        new_state = data["release_state"]
        event_type = "released" if new_state == "Released" else "updated"
        changes.append({"field": "release_state", "old": old_state, "new": new_state, "event_type": event_type})
        document.release_state = data["release_state"]
        notify_on_state_change_to_release(user, document, data["release_state"], "documents")

    if "quality_assurance" in data:
        if document.quality_assurance_id != data["quality_assurance"]:
            changes.append({"field": "quality_assurance", "old": document.quality_assurance_id, "new": data["quality_assurance"], "event_type": "approved"})
            document.quality_assurance_id = data["quality_assurance"]
            notify_on_release_approval(document, user, "documents")

    if "tags" in data:
        error, message, tag_ids = check_for_and_create_new_tags(document.project, data["tags"])
        if error:
            return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)
        document.tags.set(tag_ids)

    document.save()
    
    # Log field changes to traceability
    if changes:
        log_field_changes(
            app_type="documents",
            item_id=document.id,
            user=user,
            revision=document.formatted_revision,
            changes=changes
        )

    if "no_data_return" in data and data.get("no_data_return", False) == True:
        return Response("Document updated", status=status.HTTP_200_OK)

    all_documents_queryset = (
        Document.objects.exclude(is_archived=True)
        .select_related("project__customer")
        .order_by("id")
    )
    serialized_documents = DocumentSerializer(
        all_documents_queryset, many=True).data

    # Zip the queryset and serialized data together
    document_data = zip(all_documents_queryset, serialized_documents)

    # Update 'full_doc_number' and 'document_type' in each serialized document
    for document_queryset, entry in document_data:
        project = document_queryset.project if document_queryset.project else None
        customer = project.customer if project else None
        try:
            prefix = Document_Prefix.objects.get(id=entry.get("prefix_id"))
            prefix = prefix.prefix
        except Document_Prefix.DoesNotExist:
            prefix = entry.get("document_type", "??")
        fullNumber = assemble_full_document_number_no_prefix_db_call(
            entry, document, project, customer, None, None, prefix
        )
        entry.update({"full_doc_number": fullNumber})
        entry.update({"document_type": prefix})

    newDocumentInfo = Document.objects.get(id=documentId)
    serializer = DocumentSerializer(newDocumentInfo, many=False)
    if newDocumentInfo.prefix_id != -1 and newDocumentInfo.prefix_id != None:
        prefix = Document_Prefix.objects.get(id=newDocumentInfo.prefix_id)
        serializer.data.update({"document_type": prefix.prefix})
    return Response(
        {"newDocument": serializer.data, "documents": serialized_documents},
        status=status.HTTP_200_OK,
    )


# DEPRECSATED
@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def auto_gen_doc_number(request, documentId):
    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "documents")
    if not permission:
        return response
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    if request.data == None or documentId == None:
        documents = Document.objects.exclude(is_archived=True)
        serializer = DocumentSerializer(documents, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    pre = ""
    document = Document.objects.get(id=documentId)
    data = request.data
    if "prefix_id" in data and data["prefix_id"] != -1:
        prefix = Document_Prefix.objects.get(id=data["prefix_id"])
        pre = prefix.prefix
    else:
        pre = document.document_type
    customer = Customer.objects.get(id=data["customer"])
    project = Project.objects.get(id=data["project"])
    fullNumber = (
        str(pre)
        + str(project.full_project_number)
        + "-"
        + str(document.document_number)
        + str(document.formatted_revision)
    )
    Document.objects.filter(id=documentId).update(full_doc_number=fullNumber)
    newDocument = Document.objects.get(id=documentId)
    serializer = DocumentSerializer(newDocument, many=False)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
def admin_get_documents(request):
    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "documents")
    if not permission:
        return response
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    documents = Document.objects.exclude(is_archived=True)
    serializer = DocumentSerializer(documents, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_documents_enhanced(request):
    """Fetch all revisions of all documents.
    Filters out archived docs.
    """

    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "documents")
    if not permission:
        return response
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    documents = Document.objects.filter(
        Q(project__project_members=user) | Q(project__isnull=True)
    ).exclude(is_archived=True)
    serializer = DocumentSerializer(documents, many=True)

    if documents.count() == 0:
        return Response([], status=status.HTTP_204_NO_CONTENT)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def admin_get_documents_enhanced(request):
    """Fetch all revisions of all documents.
    Filters out archived docs.
    """

    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "documents")
    if not permission:
        return response
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    documents = Document.objects.exclude(is_archived=True)
    serializer = DocumentSerializer(documents, many=True)

    if documents.count() == 0:
        return Response([], status=status.HTTP_204_NO_CONTENT)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([APIAndProjectAccess | IsAuthenticated])
def get_latest_revisions(request, **kwargs):
    try:
        user = request.user
        documents_query = Document.objects.filter(is_latest_revision=True).exclude(is_archived=True).only(
            "id",
            "title",
            "full_doc_number",
            "release_state",
            "released_date",
            "project",
            "last_updated",
            "formatted_revision",
            "is_latest_revision",
            "is_archived",
            "tags",
            "thumbnail"
        ).prefetch_related("tags")
        if APIAndProjectAccess.has_validated_key(request):
            if not APIAndProjectAccess.check_wildcard_access(request):
                documents_query = documents_query.filter(
                    project__in=request.allowed_projects
                )
        else:
            documents_query = documents_query.filter(
                Q(project__project_members=user) | Q(project__isnull=True),
                is_latest_revision=True,
            )

        serializer = DocumentTableSerializer(documents_query, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"get_latest_revisions failed: {e}", status=status.HTTP_400_BAD_REQUEST
        )


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_latest_revisions_first_25(request):

    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "documents")
    if not permission:
        return response
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    documents = (
        Document.objects.filter(
            Q(project__project_members=user) | Q(project__isnull=True),
            is_latest_revision=True,
        )
        .exclude(is_archived=True)
        .order_by("-last_updated")[:50]
        .only(
            "id",
            "title",
            "full_doc_number",
            "release_state",
            "released_date",
            "project",
            "last_updated",
            "formatted_revision",
            "is_latest_revision",
            "is_archived",
        )
    )
    serializer = DocumentTableSerializer(documents, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([APIAndProjectAccess | IsAuthenticated])
def get_document(request, pk, **kwargs):
    """Gets a single document by ID. Excludes archived documents."""
    try:
        user = request.user
        if APIAndProjectAccess.has_validated_key(request):
            document = get_object_or_404(Document, id=pk)
            serializer = DocumentSerializer(document, many=False, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            document = get_object_or_404(
                Document,
                Q(project__project_members=user) | Q(project__isnull=True),
                id=pk,
            )
            if document.is_archived == True:
                return Response("Document is archived.",
                                status=status.HTTP_204_NO_CONTENT)

            serializer = DocumentSerializer(document, many=False, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"get_document failed: {e}", status=status.HTTP_400_BAD_REQUEST
        )


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_documents_by_ids(request, documentIds):
    """Fetch multiple documents by ids."""
    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "documents")
    if not permission:
        return response

    id_list = [int(id) for id in documentIds.split(",")]
    # Filter documents based on the provided ids and the user's membership in the related project
    documents = Document.objects.filter(
        Q(project__project_members=user) | Q(project__isnull=True), id__in=id_list
    )

    serializer = DocumentTableSerializer(documents, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def fetch_document_file(request, documentId):
    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "documents")
    if not permission:
        return response
    data = Document.objects.get(id=documentId)
    file = data.document_file.file.open("rb")
    return FileResponse(file, as_attachment=True, filename="Document File")


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def fetch_document_pdf(request, documentId):
    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "documents")
    if not permission:
        return response
    data = Document.objects.get(id=documentId)
    
    if data.pdf_print:
        file = data.pdf_print.file.open("rb")
    else:
        return Response({"error": "No PDF print file found"}, status=status.HTTP_404_NOT_FOUND)
    
    return FileResponse(file, as_attachment=True, filename="Document PDF")


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def fetch_document_pdf_raw(request, documentId):
    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "documents")
    if not permission:
        return response
    data = Document.objects.get(id=documentId)
    
    if data.pdf_source:
        file = data.pdf_source.file.open("rb")
    else:
        return Response({"error": "No PDF source file found"}, status=status.HTTP_404_NOT_FOUND)
    
    return FileResponse(file, as_attachment=True, filename="Document PDF RAW")


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@permission_classes([APIAndProjectAccess | IsAuthenticated])
def set_doc_to_archived(request, pk, **kwargs):
    """View for archiving documents.
    A lean version of the `archive_document` view.
    """
    try:
        user = request.user
        if user == None:
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

        document = Document.objects.get(id=pk)
        document.is_archived = True
        document.archived_date = datetime.now()
        document.save()

        # Now there is no guarantee that the latest revision is marked correctly.
        batch_process_is_latest_revision_by_doc_number(
            document.project.pk, document.document_number
        )

        return Response("Archived document", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"set_doc_to_archived failed: {e}",
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def archive_document(request, pk):
    """View for archiving (and unarchiving?) documents."""
    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "documents")
    if not permission:
        return response
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    if request.data == None or pk == None:
        return Response("No content sent", status=status.HTTP_204_NO_CONTENT)
    data = request.data
    document = Document.objects.get(id=pk)
    if "archived" in data:
        document.is_archived = eval(data["archived"].title())
    if "archived_date" in data:
        document.archived_date = data["archived_date"]
    document.save()

    # Now there is no guarantee that the latest revision is marked correctly.
    batch_process_is_latest_revision_by_doc_number(
        document.project.pk, document.document_number
    )

    # From here the all code is simply to return a bunch of data.
    # TODO find out if the data below is in use. It shouldn't be necessary.

    documents = []
    archivedDocuments = []
    newDocumentInfo = Document.objects.get(id=pk)
    serializerSingle = DocumentSerializer(newDocumentInfo, many=False)
    if newDocumentInfo.prefix_id != -1 and newDocumentInfo.prefix_id != None:
        prefix = Document_Prefix.objects.get(id=newDocumentInfo.prefix_id)
        serializerSingle.data.update({"document_type": prefix.prefix})
    all = Document.objects.all()
    serializer = DocumentSerializer(all, many=True)
    for entry in serializer.data:
        fullNumber = ""
        document = Document.objects.get(id=entry["id"])
        if entry["full_doc_number"] != None:
            fullNumber = entry["full_doc_number"]
        else:
            pre = ""
            if document.prefix_id != None and document.prefix_id != -1:
                prefix = Document_Prefix.objects.get(
                    id=int(document.prefix_id))
                pre = prefix.prefix
            else:
                pre = document.document_type
            if document.project != None:
                project = Project.objects.get(id=document.project.id)
                fullNumber = (
                    str(pre)
                    + str(project.full_project_number)
                    + "-"
                    + str(document.document_number)
                    + str(document.formatted_revision)
                )
            else:
                fullNumber = (
                    str(pre)
                    + "!!!"
                    + "-"
                    + str(document.document_number)
                    + str(document.formatted_revision)
                )
        if document.prefix_id != -1 and document.prefix_id != None:
            prefix = Document_Prefix.objects.get(id=document.prefix_id)
            entry.update({"document_type": prefix.prefix})
        entry.update({"full_doc_number": fullNumber})
        if document.is_archived != True:
            documents.append(entry)
        else:
            archivedDocuments.append(entry)
    return Response(
        {
            "newDocument": serializerSingle.data,
            "documents": documents,
            "archived": archivedDocuments,
        },
        status=status.HTTP_200_OK,
    )


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def update_revision_notes(request, documentId):
    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "documents")
    if not permission:
        return response
    try:
        data = request.data
        if "revision_notes" not in data:
            return Response(
                "No data sent to server, try again", status=status.HTTP_400_BAD_REQUEST
            )
        document = Document.objects.get(id=documentId)
        
        # Track changes for traceability
        old_revision_notes = document.revision_notes
        new_revision_notes = data["revision_notes"]
        
        if old_revision_notes != new_revision_notes:
            document.revision_notes = new_revision_notes
            document.save()
            
            # Log field change to traceability
            log_field_changes(
                app_type="documents",
                item_id=document.id,
                user=user,
                revision=document.formatted_revision,
                changes=[{
                    "field": "revision_notes",
                    "old": old_revision_notes,
                    "new": new_revision_notes
                }]
            )
        
        serializer = DocumentSerializer(document, many=False)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"update_revision_notes failed: {e}", status=status.HTTP_400_BAD_REQUEST
        )


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def update_errata(request, documentId):
    try:
        user = request.user
        if user == None:
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
        data = request.data

        if not "errata" in data:
            return Response(
                "No data sent to server, try again", status=status.HTTP_400_BAD_REQUEST
            )
        doc = Document.objects.get(id=documentId)
        doc.errata = data["errata"]
        doc.save()

        serializer = DocumentSerializer(doc, many=False)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            f"update_errata failed: {e}", status=status.HTTP_400_BAD_REQUEST
        )


# This opt-out method will lead to bugs when new fields are added.
@swagger_auto_schema(
    method='post',
    operation_id='auto_new_revision_document',
    operation_description="""
    Create a new revision of an existing document.
    
    **Note:** The document must be the latest revision to create a new revision. The new revision will inherit most fields from the previous revision, including tags.
    """,
    tags=['documents'],
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=[],
        properties={}
    ),
    responses={
        201: openapi.Response(description='New revision created successfully', schema=DocumentSerializer),
        401: openapi.Response(description='Unauthorized - not latest revision or no access'),
        404: openapi.Response(description='Document not found'),
    },
    security=[{'Token': []}, {'Api-Key': []}]
)
@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def auto_new_revision(request, pk, **kwargs):
    try:
        user = request.user
        if user == None:
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

        data = request.data

        # Copy over old revision
        old_revision = Document.objects.get(id=pk)
        if old_revision.is_latest_revision == False:
            return Response("Not latest revision!", status=status.HTTP_401_UNAUTHORIZED)

        old_revision.is_latest_revision = False

        new_revision = Document()
        new_revision.title = old_revision.title
        new_revision.project = old_revision.project
        new_revision.description = old_revision.description
        new_revision.summary = old_revision.summary
        new_revision.is_latest_revision = True
        
        # Copy part_number from old revision (same part, different revision)
        new_revision.part_number = old_revision.part_number
        
        # Get organization ID from the user
        organization_id = None
        organization_id = get_org_id(user)

        # Get revision type from request data (default to "major" for backward compatibility)
        revision_type = request.data.get('revision_type', 'major')
        new_revision.revision_count_major, new_revision.revision_count_minor = increment_revision_counters(old_revision.revision_count_major, old_revision.revision_count_minor, revision_type == 'major')
        
        new_revision.created_by = old_revision.created_by
        # new_revision.revision_author = request.user.id # TODO see models.py
        new_revision.previouis_revision_id = pk
        new_revision.release_state = "Draft"
        new_revision.shared_document_link = ""
        new_revision.language = old_revision.language
        new_revision.protection_level = old_revision.protection_level

        new_revision.prefix_id = old_revision.prefix_id
        new_revision.document_type = old_revision.document_type

        new_revision.front_page = old_revision.front_page
        new_revision.apply_ipr = old_revision.apply_ipr
        new_revision.revision_table = old_revision.revision_table
        new_revision.is_archived = False
        new_revision.document_number = old_revision.document_number

        new_revision.save()
        # Ensure the new revision is created before the old is made not latest revision.
        old_revision.save()

        # Copy over tags
        new_revision.tags.set(old_revision.tags.all())

        link_issues_on_new_object_revision('documents', old_revision, new_revision)

        # Get the prefix for building formatted revision
        prefix = Document_Prefix.objects.get(pk=old_revision.prefix_id) if old_revision.prefix_id and old_revision.prefix_id != -1 else None
        prefix_str = prefix.prefix if prefix else ""

        new_revision.formatted_revision = build_formatted_revision(
            organization_id=organization_id,
            prefix=prefix_str,
            part_number=new_revision.part_number,
            revision_count_major=new_revision.revision_count_major,
            revision_count_minor=new_revision.revision_count_minor,
            project_number=new_revision.project.full_project_number if new_revision.project else None,
            created_at=new_revision.created_at
        )

        # Use template-based document number generation
        new_revision.full_doc_number = build_full_document_number(
            organization_id=organization_id,
            prefix=prefix_str,
            document_number=new_revision.document_number,
            revision_count_major=new_revision.revision_count_major,
            revision_count_minor=new_revision.revision_count_minor,
            project_number=new_revision.project.full_project_number if new_revision.project else None,
            part_number=new_revision.part_number,
            created_at=new_revision.created_at
        )
        new_revision.save()

        notify_on_new_revision(new_revision=new_revision, app_name="documents", user=request.user)
        
        # Log revision creation event
        log_revision_created_event(
            app_type="documents",
            item_id=new_revision.id,
            user=request.user,
            revision=new_revision.formatted_revision,
            details=f"Created new revision {new_revision.formatted_revision} from {old_revision.formatted_revision}"
        )

        if new_revision.title != new_revision.title:
            return Response(
                "Non matching documents in return %s vs %s for titles"
                % (new_revision.title, new_revision.title),
                status=status.HTTP_409_CONFLICT,
            )

        serializer = DocumentSerializer(new_revision, many=False)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            f"auto_new_revision failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def admin_get_archived(request):
    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "documents")
    if not permission:
        return response
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    documents = []

    all = Document.objects.filter(is_archived=True)
    serializer = DocumentSerializer(all, many=True)
    for entry in serializer.data:
        fullNumber = ""
        document = Document.objects.get(id=entry["id"])
        if entry["full_doc_number"] != None:
            fullNumber = entry["full_doc_number"]
        else:
            pre = ""
            if document.prefix_id != None and document.prefix_id != -1:
                prefix = Document_Prefix.objects.get(
                    id=int(document.prefix_id))
                pre = prefix.prefix
            else:
                pre = document.document_type
            if document.project != None:
                project = Project.objects.get(id=document.project.id)
                fullNumber = (                          # TODO DEPRECATE THIS
                    str(pre)
                    + str(project.full_project_number)
                    + "-"
                    + str(document.document_number)
                    + str(document.formatted_revision)
                )
            elif document.part != None:
                part = Part.objects.get(id=document.part.id)
                fullNumber = (                          # TODO DEPRECATE THIS
                    str(pre)
                    + str(part.part_number)
                    + "-"
                    + str(document.document_number)
                    + str(document.formatted_revision)
                )
            elif document.assembly != None:
                asm = Assembly.objects.get(id=document.assembly.id)
                fullNumber = (                          # TODO DEPRECATE THIS
                    str(pre)
                    + str(asm.part_number)
                    + "-"
                    + str(document.document_number)
                    + str(document.formatted_revision)
                )
            else:
                fullNumber = (                          # TODO DEPRECATE THIS
                    str(pre)
                    + "!!!"
                    + "-"
                    + str(document.document_number)
                    + str(document.formatted_revision)
                )
        if document.prefix_id != -1 and document.prefix_id != None:
            prefix = Document_Prefix.objects.get(id=document.prefix_id)
            entry.update({"document_type": prefix.prefix})
        entry.update({"full_doc_number": fullNumber})
        documents.append(entry)
    return Response(documents, status=status.HTTP_200_OK)


# NOTE if full_doc_number exists on the model, use it instead of this view.
@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def fetch_document_number(request, documentId):
    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "documents")
    if not permission:
        return response
    document = Document.objects.get(id=documentId)
    if document == None:
        return Response(
            "The sent id does not match any documents",
            status=status.HTTP_400_BAD_REQUEST,
        )
    pre = ""
    document = Document.objects.get(id=documentId)
    if document.prefix_id != None and document.prefix_id != -1:
        prefix = Document_Prefix.objects.get(id=int(document.prefix_id))
        pre = prefix.prefix
    else:
        pre = document.document_type
    project = Project.objects.get(id=document.project.id)
    document_number = (
        str(pre)
        + str(project.full_project_number)
        + "-"
        + str(document.document_number)
        + str(document.formatted_revision)
    )
    return Response(document_number, status=status.HTTP_200_OK)


def get_org_id(user):
    user_profile = Profile.objects.get(user__pk=user.id)
    userSerializer = ProfileSerializer(user_profile, many=False)
    org_id = -1
    if "organization_id" in userSerializer.data:
        if userSerializer.data["organization_id"] != None:
            org_id = userSerializer.data["organization_id"]
    return org_id


@swagger_auto_schema(
    method='put',
    operation_id='update_document',
    operation_description="""
    Update an existing document.
    
    **Note:** Documents cannot be edited when they are in "Released" state.
    
    **Optional fields (all can be updated):**
    - `title`: Title of the document (string)
    - `description`: Description of the document (string)
    - `summary`: Summary of the document (string)
    - `shared_document_link`: Shared document link (string, can be "null")
    - `release_state`: Release state ("Draft", "Released", etc.)
    """,
    tags=['documents'],
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=[],
        properties={
            'title': openapi.Schema(type=openapi.TYPE_STRING, description='Title of the document'),
            'description': openapi.Schema(type=openapi.TYPE_STRING, description='Description of the document'),
            'summary': openapi.Schema(type=openapi.TYPE_STRING, description='Summary of the document'),
            'shared_document_link': openapi.Schema(type=openapi.TYPE_STRING, description='Shared document link (can be "null")'),
            'release_state': openapi.Schema(type=openapi.TYPE_STRING, description='Release state', enum=['Draft', 'Released']),
        }
    ),
    responses={
        200: openapi.Response(description='Document updated successfully', schema=DocumentSerializer),
        400: openapi.Response(description='Bad request - document is released and cannot be edited, or invalid data'),
        401: openapi.Response(description='Unauthorized'),
        404: openapi.Response(description='Document not found'),
    },
    security=[{'Token': []}, {'Api-Key': []}]
)
@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def update_doc(request, pk, **kwargs):
    """Method for updating documents, and triggering regeneration of pdf documents."""
    user = request.user
    data = request.data
    method = request.method
    document_qs = Document.objects.filter(
        Q(project__project_members=user) | Q(project__isnull=True), id=pk)
    if not document_qs.exists():
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    document = document_qs.first()
    if document.release_state == "Released":
        return Response(
            "%s not allowed on released part" % method,
            status=status.HTTP_400_BAD_REQUEST,
        )
    elif method == "PUT":
        # TODO: This entire try should be a transaction.
        # Need to check if transactions are supported by the storage class.
        try:
            document = Document.objects.get(id=pk)
            
            # Track changes for traceability
            changes = []

            org_id = -1
            if APIAndProjectAccess.has_validated_key(request):
                org_id = APIAndProjectAccess.get_organization_id(request)
            else:
                org_id = get_org_id(request.user)

            # Update all fields present in form.
            # Track which fields affect front page content
            front_page_content_changed = False
            
            if "shared_document_link" in data:
                if data["shared_document_link"] != "null":
                    if document.shared_document_link != data["shared_document_link"]:
                        changes.append({"field": "shared_document_link", "old": document.shared_document_link, "new": data["shared_document_link"]})
                        document.shared_document_link = data["shared_document_link"]

            if "title" in data and document.title != data["title"]:
                changes.append({"field": "title", "old": document.title, "new": data["title"]})
                document.title = data["title"]
                front_page_content_changed = True
            if "description" in data and document.description != data["description"]:
                changes.append({"field": "description", "old": document.description, "new": data["description"]})
                document.description = data["description"]
            if "summary" in data and document.summary != data["summary"]:
                changes.append({"field": "summary", "old": document.summary, "new": data["summary"]})
                document.summary = data["summary"]
                front_page_content_changed = True
            
            if "protection_level" in data and data["protection_level"] not in ("null", "undefined", "", -1):
                new_protection_level = int(data["protection_level"])
                if document.protection_level_id != new_protection_level:
                    changes.append({"field": "protection_level", "old": document.protection_level_id, "new": new_protection_level})
                    document.protection_level_id = new_protection_level
                    front_page_content_changed = True

            if (
                "release_state" in data
                and data["release_state"] != document.release_state
            ):
                old_state = document.release_state
                new_state = data["release_state"]
                event_type = "released" if new_state == "Released" else "updated"
                changes.append({"field": "release_state", "old": old_state, "new": new_state, "event_type": event_type})
                document.release_state = data["release_state"]
                front_page_content_changed = True
                notify_on_state_change_to_release(
                    user=user,
                    item=document,
                    new_state=data["release_state"],
                    app_name="documents"
                )

                if data["release_state"] == "Released":
                    if APIAndProjectAccess.has_validated_key(request):
                        if "released_by" in data:
                            document.released_by = User.objects.get(
                                id=data["released_by"])
                    else:
                        document.released_by = User.objects.get(
                            id=request.user.id)
                    document.released_date = datetime.now()

            user = request.user
            if "is_approved_for_release" in data:
                if data["is_approved_for_release"] == "false":
                    document.quality_assurance = None
                # Ensures QA is only set once, not every time the form is updated.
                if (
                    data["is_approved_for_release"] == "true"
                    and document.quality_assurance == None
                ):
                    profile = Profile.objects.get(user__pk=user.id)
                    changes.append({
                        "field": "approved_for_release",
                        "old": "false",
                        "new": "true",
                        "event_type": "approved",
                        "user": user,
                    })
                    document.quality_assurance = profile
                    notify_on_release_approval(
                        item=document,
                        user=user,
                        app_name="documents"
                    )
            # Variables with the newest states from the front end.
            # form-data can't parse boolean.
            # Booleans must therefore be cast to python Bool with Capital letter. eval("true".title())
            front_page_fe = eval(data["front_page"].title())
            # apply_ipr_fe = eval(data['apply_ipr'].title())
            revision_table_fe = eval(data["revision_table"].title())

            # Track if front page or revision table changed (requires thumbnail regeneration)
            front_page_changed = document.front_page != front_page_fe
            revision_table_changed = document.revision_table != revision_table_fe
            
            document.front_page = front_page_fe
            # document.update(apply_ipr=apply_ipr_fe)
            document.revision_table = revision_table_fe

            document.save()

            pdf_updated = False  # Track if we need to regenerate thumbnail
            
            # No upload in this form anymore.
            # if "pdf_raw" in data:
            #     file = request.FILES["pdf_raw"]
                
            #     # Delete old pdf_source file if it exists
            #     if document.pdf_source:
            #         try:
            #             document.pdf_source.file.delete()
            #             document.pdf_source.delete()
            #         except Exception as e:
            #             pass

            #     # Create new File object
            #     cleaned_file_name = file.name.replace(" ", "_").replace("/", "_")
            #     formatted_file_name = f"{uuid.uuid4().hex}/{cleaned_file_name[:220]}"
                
            #     new_file = File()
            #     new_file.display_name = f"{document.title or 'Document'} PDF Source"
            #     new_file.project = document.project
            #     new_file.file.save(formatted_file_name, file)
            #     new_file.save()
                
            #     document.pdf_source = new_file
            #     document.save()
            #     pdf_updated = True
                    
            #     # Log file upload
            #     changes.append({"field": "pdf_raw", "old": None, "new": cleaned_file_name})

            # DEPRECATED Field
            # if "document_file" in data:
            #     file = request.FILES["document_file"]
            #     if not fileViews.check_file_sizes_vs_limit(
            #         fileViews.get_organization_by_user_id(request), file.size, request
            #     ):
            #         return Response("Storage full!", status=status.HTTP_409_CONFLICT)

            #     try:
            #         # Delete the old document_file before saving the new one
            #         if document.document_file:
            #             document.document_file.delete()
            #     except Exception as e:
            #         pass

            #     cleaned_file_name = file.name.replace(" ", "_").replace("/", "_")
            #     formatted_file_name = f"{uuid.uuid4().hex}/{cleaned_file_name[:220]}"
            #     document.document_file.save(f"{uuid.uuid4().hex}/{formatted_file_name[:220]}", file)
            #     pdf_updated = True
                
            #     # Log file upload
            #     changes.append({"field": "document_file", "old": None, "new": cleaned_file_name})

            # Process PDF (adds front page, revision table, etc.)
            # and regenerate thumbnail if needed
            regenerate_thumbnail = pdf_updated or front_page_changed or revision_table_changed or front_page_content_changed
            process_pdf_and_generate_thumbnail(
                document_id=pk,
                org_id=org_id,
                user=user,
                regenerate_thumbnail=regenerate_thumbnail
            )
            
            # Log field changes to traceability
            if changes:
                log_field_changes(
                    app_type="documents",
                    item_id=document.id,
                    user=user,
                    revision=document.formatted_revision,
                    changes=changes
                )

            newObject = Document.objects.get(id=pk)
            serializer = DocumentSerializer(newObject, many=False)
            # Return the serialized updated data
            return Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(str(e), status=status.HTTP_400_BAD_REQUEST)
        finally:
            fileViews.update_org_current_storage_size(request)
    else:
        return Response(f"{method} not allowed", status=status.HTTP_400_BAD_REQUEST)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_reference_documents(request, referenceListId):
    """Method for returning a list of reference documents for a part, pcba, asm etc.
    It assembles an array with document objects.
    """

    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "documents")
    if not permission:
        return response

    if referenceListId == -1:
        return Response([], status=status.HTTP_200_OK)

    try:
        referenceListId_obj = Reference_List.objects.get(id=int(referenceListId))
    except Reference_List.DoesNotExist:
        return Response([], status=status.HTTP_200_OK)

    if not referenceListId_obj.reference_doc_ids:
        return Response([], status=status.HTTP_200_OK)

    # Efficient query with project-based access control and select_related for joins
    document_list = Document.objects.filter(
        Q(project__project_members=user) | Q(project__isnull=True),
        id__in=referenceListId_obj.reference_doc_ids
    ).select_related(
        'project',
        'project__customer'
    ).only(
        'id',
        'full_doc_number',
        'title',
        'release_state',
        'thumbnail',
        'document_number',
        'document_type',
        'prefix_id',
        'formatted_revision',
        'project__id',
        'project__title',
        'project__full_project_number',
        'project__customer__id',
        'project__customer__name'
    )

    # Build a lookup dict for efficient is_specification retrieval
    spec_lookup = {}
    for idx, doc_id in enumerate(referenceListId_obj.reference_doc_ids):
        if idx < len(referenceListId_obj.is_specification):
            spec_lookup[doc_id] = referenceListId_obj.is_specification[idx]
        else:
            spec_lookup[doc_id] = False

    document_dict_list = []

    for doc in document_list:
        # Get customer and project names from the joined data
        project_name = doc.project.title if doc.project else ""
        customer_name = ""
        if doc.project and doc.project.customer:
            customer_name = doc.project.customer.name

        # Use full_doc_number if available, otherwise it would need to be built
        document_number = doc.full_doc_number or ""

        document_dict_list.append(
            {
                "id": doc.id,
                "full_doc_number": document_number,
                "title": doc.title,
                "customer_name": customer_name,
                "project_name": project_name,
                "release_state": doc.release_state,
                "is_specification": spec_lookup.get(doc.id, False),
                "thumbnail": doc.thumbnail_id,
            }
        )

    return Response(document_dict_list, status=status.HTTP_200_OK)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def add_reference_document(request):
    """Add document to reference list.
    - The data must contain the pcba, part or ams id on the following form: asm_id, pcba_id, part_id.
    - The ID of the reference document to be added shall be on the form: ref_doc_id
    - An accompanying 'is_specification' [true/false] tag can be added. If this tag is missing, the tag is set to false.
    """

    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "documents")
    if not permission:
        return response

    if request.data == None:
        return Response(status=status.HTTP_200_OK)

    query_data = request.data

    query_specification_tag = query_data["is_specification"]
    query_reference_doc_id = query_data["reference_document_id"]

    if query_reference_doc_id == None:
        return Response(
            "Reference ID must be an integer!", status=status.HTTP_400_BAD_REQUEST
        )

    reference_list, reference_list_id, release_state = (
        util.query_data_to_reference_list(query_data=query_data)
    )

    if reference_list == None:
        return Response(
            "One of the following fields must have value 'asm_id', 'pcba_id', 'part_id'!",
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Specification can only be added to unreleased items.
    if query_specification_tag == True:
        # Check for release state.
        if release_state == "Released":
            return Response(
                "Object is Released, specification tag not allowed!",
                status=status.HTTP_400_BAD_REQUEST,
            )
        elif not (release_state == "Draft") and not (release_state == "Review"):
            return Response(
                "Unknown release state, specification tag not allowed!",
                status=status.HTTP_400_BAD_REQUEST,
            )

    reference_doc_ids = reference_list.reference_doc_ids

    if int(query_reference_doc_id) in reference_doc_ids:
        return Response(
            "Document already a reference!", status=status.HTTP_400_BAD_REQUEST
        )

    reference_doc_ids.append(int(query_reference_doc_id))
    Reference_List.objects.filter(id=reference_list_id).update(
        reference_doc_ids=reference_doc_ids
    )

    is_specification = reference_list.is_specification
    is_specification.append(query_specification_tag)
    Reference_List.objects.filter(id=reference_list_id).update(
        is_specification=is_specification
    )

    reference_list.save()
    return Response(status=status.HTTP_201_CREATED)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def remove_reference_documents(request):
    """Remove reference documents from a reference list.
    - The data must contain the pcba, part or ams id on the following form: asm_id, pcba_id, part_id.
    - The ID of the reference document to be added shall be on the form: reference_document_ids
    - Reference documents with 'is_specification' cannot be removed from as reference to Released target object.
    """

    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "documents")
    if not permission:
        return response

    if request.data == None:
        return Response(status=status.HTTP_200_OK)

    query_data = request.data

    # Documents to remove from the list.
    query_reference_doc_ids = query_data["reference_document_ids"]

    # Don't act on an empty query
    if len(query_reference_doc_ids) == 0:
        return Response(status=status.HTTP_200_OK)

    reference_list, reference_list_id, release_state = (
        util.query_data_to_reference_list(query_data=query_data)
    )

    if reference_list == None:
        return Response(
            "One of the following fields must have value 'asm_id', 'pcba_id', 'part_id'!",
            status=status.HTTP_400_BAD_REQUEST,
        )

    reference_doc_ids = reference_list.reference_doc_ids
    is_specification = reference_list.is_specification

    # Run through list and remove the documents form the list, unless the item has specification tag, and target object is Released.
    for item in query_reference_doc_ids:
        index = reference_doc_ids.index(item)

        if is_specification[index] == True and release_state == "Released":
            continue

        del is_specification[index]
        del reference_doc_ids[index]

    Reference_List.objects.filter(id=reference_list_id).update(
        reference_doc_ids=reference_doc_ids
    )
    Reference_List.objects.filter(id=reference_list_id).update(
        is_specification=is_specification
    )
    reference_list.save()

    return Response(status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def fetch_file_list(request, id):
    """View for fetching file list to use in the files table."""
    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "documents")
    if not permission:
        return response

    # Optimize queries: select_related for ForeignKeys, prefetch_related for ManyToMany
    doc = Document.objects.select_related('pdf_source', 'pdf_print').prefetch_related('files').get(id=id)
    
    file_list = []
    
    # PDF Source (ForeignKey to File table)
    if doc.pdf_source:
        file_list.append({
            "row_number": "0",
            "title": "PDF Source",
            "file_name": util.get_file_name(doc.pdf_source.file),
            "type": "PDF_RAW",
            "uri": f"api/documents/download/pdf_raw/{id}/",
            "file_id": doc.pdf_source.id,
            "is_archived": False,
        })
    
    # PDF Print (ForeignKey to File table)
    if doc.pdf_print:
        file_list.append({
            "row_number": str(len(file_list)),
            "title": "PDF Print",
            "file_name": util.get_file_name(doc.pdf_print.file),
            "type": "PDF",
            "uri": f"api/documents/download/pdf/{id}/",
            "file_id": doc.pdf_print.id,
            "is_archived": False,
        })

    # Generic files from ManyToMany field (includes document_file, zip_file, and any other files)
    file_list.extend([
        {
            "row_number": str(len(file_list) + idx),
            "title": file_obj.display_name or "File",
            "file_name": util.get_file_name(file_obj.file),
            "type": "GENERIC",
            "uri": f"api/files/download/{file_obj.id}/",
            "file_id": file_obj.id,
            "is_archived": file_obj.archived == 1,
        }
        for idx, file_obj in enumerate(doc.files.filter(archived=0))
    ])
    return Response(file_list)


@api_view(["GET"])
@renderer_classes([JSONRenderer])
@xframe_options_exempt
@permission_classes([IsAuthenticated])
def download_file(request, file_identifier, id):
    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "documents")
    if not permission:
        return response

    try:
        qs = Document.objects.filter(id=id)
        if not check_project_access(qs, user):
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
        document = qs.first()
    except Document.DoesNotExist:
        return Response({"error": "Document not found"}, status=status.HTTP_404_NOT_FOUND)

    # Map file identifiers to file objects
    file_to_serve = None
    
    if file_identifier == "document_file":
        file_to_serve = document.document_file
    elif file_identifier == "pdf_raw":
        if document.pdf_source:
            file_to_serve = document.pdf_source.file
    elif file_identifier in ["pdf", "pdf_preview"]:
        # Try pdf_print first (processed with front page), fall back to pdf_source (raw)
        if document.pdf_print:
            file_to_serve = document.pdf_print.file
        elif document.pdf_source:
            file_to_serve = document.pdf_source.file
    
    if file_to_serve:
        # Check if the file actually exists
        try:
            if not file_to_serve.name or not file_to_serve.storage.exists(file_to_serve.name):
                return Response({"error": "File not found on storage"}, status=status.HTTP_404_NOT_FOUND)
            return FileResponse(file_to_serve.open('rb'), status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": f"Failed to open file: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    else:
        return Response({"error": "Can't recognize file identifier"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def upload_file(request):
    """view supporting uploading arbitrary csv file to create a BOM on the PCBA."""

    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "documents")
    if not permission:
        return response

    data = request.data

    org_id = get_org_id(request.user)
    if org_id == -1:
        return Response("No connected organization found", status.HTTP_204_NO_CONTENT)

    if data == None:
        return Response("No data in request", status=status.HTTP_400_BAD_REQUEST)

    method = request.method
    if method != "POST":
        return Response("Only POST allowed", status=status.HTTP_400_BAD_REQUEST)

    doc_obj = Document.objects.get(id=data["id"])
    doc = Document.objects.filter(id=data["id"])
    if doc.values("release_state") == "Released":
        return Response("PCBA is released", status=status.HTTP_400_BAD_REQUEST)

    if not ("file" in data):
        return Response("No 'pcba_file' found", status=status.HTTP_400_BAD_REQUEST)
    if not fileViews.check_file_sizes_vs_limit(
        fileViews.get_organization_by_user_id(request),
        request.FILES["file"].size,
        request,
    ):
        return Response("Storage full!", status=status.HTTP_409_CONFLICT)
    try:
        file_type = data["file_type"]
        file = request.FILES["file"]

        if file_type == "SOURCE": # DEPRECATED
            doc_obj.document_file.save(f"{uuid.uuid4().hex}/{file.name}", file)
        elif file_type == "PDF_RAW":
            # Read file content before saving (since save() consumes the file)
            file.seek(0)
            pdf_content = file.read()
            
            # Delete old pdf_source file if it exists
            if doc_obj.pdf_source:
                delete_file_with_cleanup(doc_obj.pdf_source)
            
            # Create new File object for PDF source
            file.seek(0)
            new_file = File()
            new_file.display_name = f"{doc_obj.title or 'Document'} PDF Source"
            new_file.project = doc_obj.project
            new_file.file.save(f"{uuid.uuid4().hex}/{file.name}", file)
            new_file.save()
            
            doc_obj.pdf_source = new_file
            doc_obj.save()
            
            process_pdf(data["id"], org_id)
            
            # Generate thumbnail from the first page of the PDF
            thumbnail = generate_pdf_thumbnail(BytesIO(pdf_content), doc_obj.title)
            if thumbnail:
                doc_obj.thumbnail = thumbnail
                doc_obj.save()
        elif file_type == "GENERIC":
            # Check if the file is a PDF - if so, route to pdf_source instead
            file_extension = file.name.lower().split('.')[-1]
            if file_extension == 'pdf':
                # Read file content before saving (since save() consumes the file)
                file.seek(0)
                pdf_content = file.read()
                
                # Delete old pdf_source file if it exists
                if doc_obj.pdf_source:
                    delete_file_with_cleanup(doc_obj.pdf_source)
                
                # Create new File object for PDF source
                file.seek(0)
                new_file = File()
                new_file.display_name = f"{doc_obj.title or 'Document'} PDF Source"
                new_file.project = doc_obj.project
                new_file.file.save(f"{uuid.uuid4().hex}/{file.name}", file)
                new_file.save()
                
                doc_obj.pdf_source = new_file
                doc_obj.save()
                
                process_pdf(data["id"], org_id)
                
                # Generate thumbnail from the first page of the PDF
                thumbnail = generate_pdf_thumbnail(BytesIO(pdf_content), doc_obj.title)
                if thumbnail:
                    doc_obj.thumbnail = thumbnail
                    doc_obj.save()
            else:
                # Handle non-PDF generic files - route to the files ManyToMany field
                from files.models import File as FileModel
                display_name = data.get("display_name", file.name)
                
                new_file = FileModel(
                    display_name=display_name,
                    project=doc_obj.project
                )
                new_file.save()
                new_file.file.save(f"{uuid.uuid4().hex}/{file.name}", file)
                doc_obj.files.add(new_file)
                doc_obj.save()
        else:
            return Response(
                "Cannot recognize file type!", status=status.HTTP_400_BAD_REQUEST
            )

        return Response(f"{file_type}Document uploaded", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)
    finally:
        fileViews.update_org_current_storage_size(request)





@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def add_file_to_document(request, document_id, file_id):
    """
    Adds a file to a document.
    If the file is a PDF, it's routed to pdf_raw and triggers processing.
    All other files go to the generic files ManyToMany field.
    """
    if request.user is None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    try:
        from files.models import File as FileModel
        
        doc = Document.objects.get(pk=document_id)
        file_obj = FileModel.objects.get(pk=file_id)

        # Check if file is a PDF
        file_name = file_obj.file.name if file_obj.file else ""
        is_pdf = file_name.lower().endswith('.pdf')

        if is_pdf:
            # Delete old pdf_source file if it exists
            if doc.pdf_source:
                delete_file_with_cleanup(doc.pdf_source)
            
            # Copy the file content to pdf_source
            file_obj.file.open('rb')
            pdf_content = file_obj.file.read()
            file_obj.file.close()

            # Create new File object for PDF source
            from django.core.files.base import ContentFile
            original_name = file_name.split('/')[-1]  # Get just the filename
            
            new_file = File()
            new_file.display_name = f"{doc.title or 'Document'} PDF Source"
            new_file.project = doc.project
            new_file.file.save(
                f"{uuid.uuid4().hex}/{original_name}",
                ContentFile(pdf_content)
            )
            new_file.save()
            
            doc.pdf_source = new_file
            doc.save()

            # Process the PDF and generate thumbnail using centralized method
            user_profile = Profile.objects.get(user__pk=request.user.id)
            org_id = user_profile.organization_id
            process_pdf_and_generate_thumbnail(
                document_id=doc.id,
                org_id=org_id,
                user=request.user,
                regenerate_thumbnail=True
            )

            # Delete the temporary File object since we've moved it to pdf_source
            delete_file_with_cleanup(file_obj)
        else:
            # Check if the file is already in the files field
            if file_obj in doc.files.all():
                return Response("File already added", status=status.HTTP_409_CONFLICT)

            # Add non-PDF file to generic files
            doc.files.add(file_obj)
            doc.save()
            file_obj.project = doc.project
            file_obj.save()

        return Response("File added successfully", status=status.HTTP_200_OK)

    except Document.DoesNotExist:
        return Response("Document not found", status=status.HTTP_404_NOT_FOUND)
    except FileModel.DoesNotExist:
        return Response("File not found", status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(f"Failed to add file: {str(e)}", status=status.HTTP_400_BAD_REQUEST)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def get_revisions(request, documentId):
    """Return all revisions of a particular document number."""
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    try:
        document = Document.objects.get(id=documentId)
        items = Document.objects.filter(
            document_number=document.document_number, project=document.project
        ).exclude(is_archived=True)
        serializer = DocumentSerializer(items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"get_revisions failed: {e}", status=status.HTTP_400_BAD_REQUEST
        )


def is_latest_revision(document_number, project_id, revision_count_major, revision_count_minor):
    """Check if the current item is the latest revision."""
    items = Document.objects.filter(
        document_number=document_number, project__id=project_id
    ).exclude(is_archived=True)

    if len(items) == 1:
        return True

    for item in items:
        # If any item has a higher major revision, this is not the latest
        if item.revision_count_major > revision_count_major:
            return False
        # If any item has the same major but higher minor, this is not the latest
        if item.revision_count_major == revision_count_major and item.revision_count_minor > revision_count_minor:
            return False
    return True


def batch_process_is_latest_revision_by_doc_number(project_id, document_number):
    """This view runs through Documents and corrects the is_latest_revision field"""
    items = Document.objects.filter(
        project__id=project_id, document_number=document_number
    ).exclude(is_archived=True)
    for item in items:
        item.is_latest_revision = is_latest_revision(
            item.document_number, item.project.id, item.revision_count_major, item.revision_count_minor
        )
        item.save()
