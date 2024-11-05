import uuid
from datetime import datetime

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
from .viewUtilities import (
    assemble_full_document_number,
    assemble_full_document_number_no_prefix_db_call,
)
from pcbas.viewUtilities import increment_revision
from django.db.models import F, Case, When, Value, CharField
from projects.viewsIssues import link_issues_on_new_object_revision
from profiles.utilityFunctions import (
    notify_on_new_revision, notify_on_release_approval,
    notify_on_state_change_to_release)
from projects.viewsTags import check_for_and_create_new_tags


def get_document_number(document, projects, customers, prefixes):
    """Build document number by stitching fields from necessary tables."""
    project = ""
    customer = ""
    prefix = ""
    if document["project"] != None:
        try:
            project_obj = next(
                (i for i in projects if i.id == document["project"]), None
            )
            if project_obj != None:
                project = project_obj.project_number
                try:
                    customer_obj = next(
                        (x for x in customers if x.id ==
                         project_obj.customer.id), None
                    )
                    if customer_obj != None:
                        customer = customer_obj.customer_id
                except Customer.DoesNotExist:
                    customer = ""
        except Project.DoesNotExist:
            project = ""
    if document["prefix_id"] != None and document["prefix_id"] != -1:
        try:
            prefix_obj = next(
                (i for i in prefixes if i.id == document["prefix_id"]), None
            )
            if prefix_obj != None:
                prefix = prefix_obj.prefix
        except Document_Prefix.DoesNotExist:
            prefix = ""
    else:
        prefix = document["document_type"]
    document_number = (
        str(prefix)
        + str(customer)
        + str(project)
        + "-"
        + str(document["document_number"])
        + str(document["revision"])
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


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@permission_classes([APIAndProjectAccess | IsAuthenticated])
def create_new_document(request, **kwargs):
    data = request.data
    user = request.user
    try:
        document_number = increment_document_number(data["project"])
        document = Document()
        document.title = data["title"]
        if data["description"] != "null" and data["description"] != "undefined":
            document.description = data["description"]

        document.internal = data["internal"]

        document.prefix_id = data["prefix_id"]
        document.revision = "A"
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
        customer_id = document.project.customer.customer_id
        project_number = document.project.project_number
        document.full_doc_number = f"{prefix.prefix}{customer_id}{project_number}-{document_number}{document.revision}"
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
    if "title" in data:
        document.title = data["title"]
    if "document_type" in data:
        document.document_type = data["document_type"]
    if "description" in data:
        document.description = data["description"]
    if "project" in data:
        try:
            project = Project.objects.get(id=data["project"])
            document.project = project
        except Project.DoesNotExist:
            pass

    if "language" in data:
        document.language = data["language"]

    if "last_updated" in data:
        document.last_updated = data["last_updated"]
    if "internal" in data:
        document.internal = data["internal"]
    if "prefix_id" in data:
        document.prefix_id = data["prefix_id"]
    if "summary" in data:
        document.summary = data["summary"]
    if "fullDN" in data:
        document.full_doc_number = data["fullDN"]
    if "shared_document_link" in data:
        document.shared_document_link = data["shared_document_link"]

    if "release_state" in data and data["release_state"] != document.release_state:
        document.release_state = data["release_state"]
        notify_on_state_change_to_release(user, document, data["release_state"], "documents")

    if "quality_assurance" in data:
        document.quality_assurance_id = data["quality_assurance"]
        notify_on_release_approval(document, user, "documents")

    if "tags" in data:
        error, message, tag_ids = check_for_and_create_new_tags(document.project, data["tags"])
        if error:
            return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)
        document.tags.set(tag_ids)

    document.save()

    if "autoGenNum" in data:
        if data["autoGenNum"] in ["true", True]:
            document = Document.objects.select_related("project__customer").get(
                id=documentId
            )
            project = document.project
            customer = project.customer

            if "prefix_id" in data and data["prefix_id"] != -1:
                prefix = Document_Prefix.objects.get(id=data["prefix_id"])
                pre = prefix.prefix
            else:
                pre = document.document_type

            if "duplicate_num" in data and data["duplicate_num"] == 1:
                numberOfDocsInProject = (
                    Document.objects.filter(project=project).count() + 1
                )
                fullNumber = f"{pre}{customer.customer_id}{project.project_number}-{numberOfDocsInProject}{document.revision}"
                Document.objects.filter(id=documentId).update(
                    full_doc_number=fullNumber, document_number=numberOfDocsInProject
                )
            else:
                fullNumber = f"{pre}{customer.customer_id}{project.project_number}-{document.document_number}{document.revision}"
                Document.objects.filter(id=documentId).update(
                    full_doc_number=fullNumber,
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
        + str(customer.customer_id)
        + str(project.project_number)
        + "-"
        + str(document.document_number)
        + str(document.revision)
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
            "revision",
            "is_latest_revision",
            "is_archived",
            "tags"
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
            "revision",
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
            serializer = DocumentSerializer(document, many=False)
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

            serializer = DocumentSerializer(document, many=False)
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
    file = data.pdf.file.open("rb")
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
    file = data.pdf_raw.file.open("rb")
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
                customer = Customer.objects.get(id=project.customer.id)
                fullNumber = (
                    str(pre)
                    + str(customer.customer_id)
                    + str(project.project_number)
                    + "-"
                    + str(document.document_number)
                    + str(document.revision)
                )
            else:
                fullNumber = (
                    str(pre)
                    + "!!!"
                    + "-"
                    + str(document.document_number)
                    + str(document.revision)
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
        document.revision_notes = data["revision_notes"]
        document.save()
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
@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@permission_classes([APIAndProjectAccess | IsAuthenticated])
def auto_new_revision(request, pk, **kwargs):
    try:
        user = request.user
        if user == None:
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

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
        new_revision.revision = increment_revision(old_revision.revision)
        new_revision.created_by = old_revision.created_by
        # new_revision.revision_author = request.user.id # TODO see models.py
        new_revision.previoius_revision_id = pk
        new_revision.release_state = "Draft"
        new_revision.shared_document_link = ""
        new_revision.language = old_revision.language

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

        projects = Project.objects.filter()
        customers = Customer.objects.all()
        prefixes = Document_Prefix.objects.all()
        # TODO DocumentSerializer runs twice in this view.
        document_ser = DocumentSerializer(new_revision, many=False)
        new_revision.full_doc_number = get_document_number(
            document_ser.data, projects, customers, prefixes
        )  # TODO slim down
        new_revision.save()

        notify_on_new_revision(new_revision=new_revision, app_name="documents", user=request.user)

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
                customer = Customer.objects.get(id=project.customer.id)
                fullNumber = (
                    str(pre)
                    + str(customer.customer_id)
                    + str(project.project_number)
                    + "-"
                    + str(document.document_number)
                    + str(document.revision)
                )
            elif document.part != None:
                part = Part.objects.get(id=document.part.id)
                fullNumber = (
                    str(pre)
                    + str(part.part_number)
                    + "-"
                    + str(document.document_number)
                    + str(document.revision)
                )
            elif document.assembly != None:
                asm = Assembly.objects.get(id=document.assembly.id)
                fullNumber = (
                    str(pre)
                    + str(asm.part_number)
                    + "-"
                    + str(document.document_number)
                    + str(document.revision)
                )
            else:
                fullNumber = (
                    str(pre)
                    + "!!!"
                    + "-"
                    + str(document.document_number)
                    + str(document.revision)
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
    customer = Customer.objects.get(id=project.customer.id)
    document_number = (
        str(pre)
        + str(customer.customer_id)
        + str(project.project_number)
        + "-"
        + str(document.document_number)
        + str(document.revision)
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


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@permission_classes([APIAndProjectAccess | IsAuthenticated])
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

            org_id = -1
            if APIAndProjectAccess.has_validated_key(request):
                org_id = APIAndProjectAccess.get_organization_id(request)
            else:
                org_id = get_org_id(request.user)

            # Update all fields present in form.
            if "shared_document_link" in data:
                if data["shared_document_link"] != "null":
                    document.shared_document_link = data["shared_document_link"]

            if "title" in data:
                document.title = data["title"]
            if "description" in data:
                document.description = data["description"]
            if "summary" in data:
                document.summary = data["summary"]

            if (
                "release_state" in data
                and data["release_state"] != document.release_state
            ):
                document.release_state = data["release_state"]
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

            document.front_page = front_page_fe
            # document.update(apply_ipr=apply_ipr_fe)
            document.revision_table = revision_table_fe

            document.save()

            if "pdf_raw" in data:
                file = request.FILES["pdf_raw"]
                if not fileViews.check_file_sizes_vs_limit(
                    fileViews.get_organization_by_user_id(request), file.size, request
                ):
                    return Response("Storage full!", status=status.HTTP_409_CONFLICT)

                try:
                    # Delete the old pdf_raw file before saving the new one
                    if document.pdf_raw:
                        document.pdf_raw.delete()
                except Exception as e:
                    pass

                cleaned_file_name = file.name.replace(" ", "_").replace("/", "_")
                formatted_file_name = f"{uuid.uuid4().hex}/{cleaned_file_name[:220]}"
                document.pdf_raw.save(formatted_file_name, file)

            if "document_file" in data:
                file = request.FILES["document_file"]
                if not fileViews.check_file_sizes_vs_limit(
                    fileViews.get_organization_by_user_id(request), file.size, request
                ):
                    return Response("Storage full!", status=status.HTTP_409_CONFLICT)

                try:
                    # Delete the old document_file before saving the new one
                    if document.document_file:
                        document.document_file.delete()
                except Exception as e:
                    pass

                cleaned_file_name = file.name.replace(" ", "_").replace("/", "_")
                formatted_file_name = f"{uuid.uuid4().hex}/{cleaned_file_name[:220]}"
                document.document_file.save(f"{uuid.uuid4().hex}/{formatted_file_name[:220]}", file)

            process_pdf(pk, org_id)

            find_referenced_items(pk)

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
        return Response(status=status.HTTP_200_OK)

    # TODO add access control on a per-project basis.

    referenceListId_obj = Reference_List.objects.get(id=int(referenceListId))
    document_list = Document.objects.filter(
        id__in=referenceListId_obj.reference_doc_ids
    )
    serializer = DocumentSerializer(document_list, many=True)
    projects = Project.objects.all()
    customers = Customer.objects.all()
    prefixes = Document_Prefix.objects.all()

    document_dict_list = []

    # Assemble list of document info to send to the front-end.
    for doc in serializer.data:
        index = referenceListId_obj.reference_doc_ids.index(doc["id"])
        is_specification = referenceListId_obj.is_specification[index]
        customer_name = ""
        project_name = ""
        document_number = doc["full_doc_number"]
        try:
            project_obj = next(
                (i for i in projects if i.id == doc["project"]), None)
            if project_obj != None:
                project_name = project_obj.title
            try:
                customer_obj = next(
                    (x for x in customers if x.id == project_obj.customer.id), None
                )
                if customer_obj != None:
                    customer_name = customer_obj.name
            except Customer.DoesNotExist:
                customer_name = "Not Specified"
        except Project.DoesNotExist:
            project = ""
        if doc["full_doc_number"] == None or doc["full_doc_number"] == "":
            document_number = get_document_number(
                doc, projects, customers, prefixes)

        document_dict_list.append(
            {
                "id": doc["id"],
                "full_doc_number": document_number,
                "title": doc["title"],
                "customer_name": customer_name,
                "project_name": project_name,
                "release_state": doc["release_state"],
                "is_specification": is_specification,
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

    def extract_file_name_from_shared_link(link):
        if "sharepoint.com" in link:
            return "Sharepoint file"
        else:
            return "Shared file"

    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "documents")
    if not permission:
        return response

    doc = Document.objects.get(id=id)

    file_list = []

    def get_download_query_string_or_none(id, obj, identifier_str):
        if eval(f"obj.{identifier_str}") == None:
            return None
        else:
            return f"api/documents/download/{identifier_str}/{id}/"

    # These files should always be present. They will therefore appear in the list when no actual file is present.
    if (
        doc.release_state != "Released"
        and doc.shared_document_link != None
        and doc.shared_document_link != ""
    ):
        file_list.append(
            util.assemble_file_dict(
                "0",
                "Shared Link",
                extract_file_name_from_shared_link(doc.shared_document_link),
                "SHARED_DOC_LINK",
                doc.shared_document_link,
            )
        )
    if doc.document_file != None and doc.document_file != "":
        file_list.append(
            util.assemble_file_dict(
                "1",
                "Source File",
                util.get_file_name(doc.document_file),
                "SOURCE",
                get_download_query_string_or_none(id, doc, "document_file"),
            )
        )
    if doc.pdf_raw != None and doc.pdf_raw != "":
        file_list.append(
            util.assemble_file_dict(
                "2",
                "PDF",
                util.get_file_name(doc.pdf_raw),
                "PDF_RAW",
                get_download_query_string_or_none(id, doc, "pdf_raw"),
            )
        )
    # Only show the print file in the file list if it has a value.
    if doc.pdf != None and doc.pdf != "":
        file_list.append(
            util.assemble_file_dict(
                "3",
                "PDF Print",
                util.get_file_name(doc.pdf),
                "PDF",
                get_download_query_string_or_none(id, doc, "pdf"),
            )
        )

    # TODO consider adding support for additional files in the Files table.
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

    file_map = {
        "document_file": document.document_file,
        "pdf_raw": document.pdf_raw,
        "pdf": document.pdf,
        "pdf_preview": document.pdf
    }

    file_to_serve = file_map.get(file_identifier)
    if file_to_serve:
        return FileResponse(file_to_serve.open('rb'), status=status.HTTP_200_OK)
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

        if file_type == "SOURCE":
            doc_obj.document_file.save(f"{uuid.uuid4().hex}/{file.name}", file)
        elif file_type == "PDF_RAW":
            doc_obj.pdf_raw.save(f"{uuid.uuid4().hex}/{file.name}", file)
            process_pdf(id, org_id)
        else:
            return Response(
                "Cannot recognize file type!", status=status.HTTP_400_BAD_REQUEST
            )

        return Response(f"{file_type}Document uploaded", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)
    finally:
        fileViews.update_org_current_storage_size(request)


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


def is_latest_revision(document_number, project_id, revision):
    """Check if the current item is the latest revision."""
    items = Document.objects.filter(
        document_number=document_number, project__id=project_id
    ).exclude(is_archived=True)

    if len(items) == 1:
        return True

    def first_is_greater(first, second):
        """Returns True if rev_one is greatest."""
        if len(second) > len(first):
            return False

        for index, letter in enumerate(second):
            if letter >= first[index]:
                return False
        return True

    for item in items:
        if first_is_greater(item.revision, revision):
            return False
    return True


def batch_process_is_latest_revision_by_doc_number(project_id, document_number):
    """This view runs through Documents and corrects the is_latest_revision field"""
    items = Document.objects.filter(
        project__id=project_id, document_number=document_number
    ).exclude(is_archived=True)
    for item in items:
        item.is_latest_revision = is_latest_revision(
            item.document_number, item.project.id, item.revision
        )
        item.save()
