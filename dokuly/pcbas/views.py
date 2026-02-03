from purchasing.priceUtilities import copy_price_to_new_revision
from organizations.revision_utils import build_full_part_number, build_formatted_revision, increment_revision_counters
from django.contrib.auth.decorators import login_required
from rest_framework import status
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
from django.core.files.base import ContentFile

from django.db.models import Q
import random
import os
from datetime import datetime
from django.shortcuts import get_object_or_404

from pcbas.models import Pcba, StarredPcba
from projects.models import Project
from documents.models import MarkdownText, Reference_List
from part_numbers.methods import get_next_part_number
from assembly_bom.models import Assembly_bom
from files.models import Image
from assembly_bom.utilityFuncitons import cloneBom

from .serializers import PcbaSerializer, PcbaSerializerFull, PcbaTableSerializer
from profiles.models import Profile
from profiles.views import check_user_auth_and_app_permission
from rest_framework.permissions import IsAuthenticated
from organizations.odoo_service import auto_push_on_release_async
from organizations.permissions import APIAndProjectAccess
from django.contrib.auth.models import User
from projects.viewsIssues import link_issues_on_new_object_revision
from profiles.utilityFunctions import (
    notify_on_new_revision, notify_on_release_approval,
    notify_on_state_change_to_release)
from projects.viewsTags import check_for_and_create_new_tags
from parts.viewUtilities import copy_markdown_tabs_to_new_revision, resolve_part_type_for_module


def is_latest_revision(part_number, revision_count_major, revision_count_minor):
    """
    Check if the current item is the latest revision.

    Args:
        part_number: The part number to check
        revision_count_major: Major revision count of the current item
        revision_count_minor: Minor revision count of the current item

    Returns:
        True if this is the latest revision, False otherwise
    """
    items = Pcba.objects.filter(
        part_number=part_number).exclude(is_archived=True)

    if len(items) == 1:
        return True

    # Check if any other item has a higher revision
    for item in items:
        # If another item has a higher major revision, current is not latest
        if item.revision_count_major > revision_count_major:
            return False
        # If same major but higher minor, current is not latest
        if item.revision_count_major == revision_count_major and item.revision_count_minor > revision_count_minor:
            return False

    return True


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def fetch_single_pcba(request, pk, **kwargs):
    """Fetch a single PCBA. Archived PCBAs are excluded."""
    user = request.user
    # Not an API request, project filter is done by APIAndProjectAccess in decorator.
    if not APIAndProjectAccess.has_validated_key(request):
        pcba_queryset = (
            Pcba.objects.select_related("project", "project__customer", "markdown_notes", "thumbnail", "part_type")
            .prefetch_related("tags", "markdown_note_tabs", "generic_files")
        )
        pcba = get_object_or_404(
            pcba_queryset, Q(project__project_members=user) | Q(project__isnull=True), id=pk
        )
    else:
        pcba_queryset = (
            Pcba.objects.select_related("project", "project__customer", "markdown_notes", "thumbnail", "part_type")
            .prefetch_related("tags", "markdown_note_tabs", "generic_files")
        )
        pcba = get_object_or_404(pcba_queryset, id=pk)

    if pcba.is_archived == True:
        return Response(f"PCBA is archived!", status=status.HTTP_204_NO_CONTENT)

    # Get or create the markdown notes
    if not pcba.markdown_notes:
        markdown_notes = MarkdownText(
            created_by=user,
            text='',
        )
        markdown_notes.save()
        pcba.markdown_notes = markdown_notes
        pcba.save()

    serializer = PcbaSerializerFull(pcba, many=False, context={'request': request})

    data = serializer.data

    data["latest_revision"] = pcba.is_latest_revision

    if data["project"] != None:
        project = Project.objects.get(pk=data["project"])
        if project.customer != None:
            data["customer"] = project.customer.id
            data["customer_name"] = project.customer.name

    return Response(data)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def fetch_pcba_by_revision_and_part_number(request, **kwargs):
    """Fetch a single PCBA. Archived PCBAs are excluded."""
    data = request.data
    if "part_number" not in data or "revision" not in data:
        return Response("part_number and revision required", status=status.HTTP_400_BAD_REQUEST)
    # Not an API request, project filter is done by APIAndProjectAccess in decorator.
    if not APIAndProjectAccess.has_validated_key(request):
        user = request.user
        pcba = get_object_or_404(
            Pcba, Q(project__project_members=user) | Q(project__isnull=True), part_number=data["part_number"], revision=data["revision"]
        )
    else:
        print("We are using the API key")
        pcba = get_object_or_404(Pcba, part_number=data["part_number"], revision=data["revision"])

    if pcba.is_archived == True:
        return Response(f"PCBA is archived!", status=status.HTTP_204_NO_CONTENT)

    # Get or create the markdown notes
    if not pcba.markdown_notes:
        markdown_notes = MarkdownText(
            created_by=user,
            text='',
        )
        markdown_notes.save()
        pcba.markdown_notes = markdown_notes
        pcba.save()

    serializer = PcbaSerializerFull(pcba, many=False, context={'request': request})

    data = serializer.data

    data["latest_revision"] = pcba.is_latest_revision

    if data["project"] != None:
        project = Project.objects.get(pk=data["project"])
        if project.customer != None:
            data["customer"] = project.customer.id
            data["customer_name"] = project.customer.name

    return Response(data, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
def fetch_pcbas(request):
    """Get All unarchived PCBAs."""
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "pcbas")
    if not permission:
        return response
    pcba = Pcba.objects.filter(
        Q(project__project_members=user) | Q(project__isnull=True), is_archived=False
    )
    serializer = PcbaSerializer(pcba, many=True)

    data = serializer.data

    for item in data:
        if item["project"] != None:
            project = Project.objects.get(pk=item["project"])
            item["project_name"] = project.title
            if project.customer != None:
                item["customer"] = project.customer.id
                item["customer_name"] = project.customer.name

        if item["full_part_number"] == None:
            item["full_part_number"] = f"PCBA{item['part_number']}"

    return Response(data)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def archive_pcba(request, pk, **kwargs):
    """Archive a single PCBA."""
    try:
        if request.user == None:
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
        pcba = Pcba.objects.get(id=pk)
        pcba.is_archived = True
        pcba.save()

        # Now there is no guarantee that the latest revision is marked correctly.
        batch_process_is_latest_revision_by_part_number(pcba.part_number)

        return Response("Archived PCBA", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"archive_pcba failed: {e}", status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def get_latest_revisions(request, **kwargs):
    """Get the latest revision of all unarchived PCBAs."""
    user = request.user
    pcba = (
        Pcba.objects.filter(is_archived=False)
        .exclude(is_latest_revision=False)
        .select_related("project", "part_type")
        .only(
            "id",
            "part_number",
            "full_part_number",
            "revision",
            "release_state",
            "released_date",
            "display_name",
            "last_updated",
            "pcb_renders",
            "thumbnail",
            "external_part_number",
            "part_type_id",
            "part_type__icon_url",
            "project__title",
            "project__customer",
            "project__customer__name",
        )
        .prefetch_related("tags")
    )

    if APIAndProjectAccess.has_validated_key(request):
        if not APIAndProjectAccess.check_wildcard_access(request):
            pcba = pcba.filter(project__in=request.allowed_projects)
    else:
        pcba = pcba.filter(Q(project__project_members=user)
                           | Q(project__isnull=True))

    # Get starred PCBAs for the current user
    starred_pcba_ids = set()
    if request.user.is_authenticated:
        starred_pcba_ids = set(
            StarredPcba.objects.filter(user=request.user)
            .values_list("pcba_id", flat=True)
        )

    serializer = PcbaTableSerializer(pcba, many=True, context={
        'request': request,
        'starred_pcba_ids': starred_pcba_ids
    })
    data = serializer.data
    return Response(data)


@api_view(("POST", "PUT"))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def star_pcba(request, pk, **kwargs):
    """Star a PCBA. Stars are always personal (only visible to the user)."""
    user = request.user

    try:
        pcba = get_object_or_404(Pcba, id=pk)

        # Check if user has access to the pcba's project
        if pcba.project:
            if not (pcba.project.project_members.filter(id=user.id).exists() or
                    (APIAndProjectAccess.has_validated_key(request) and
                     APIAndProjectAccess.check_project_access(request, pcba.project.id))):
                return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

        # Create or get existing star (always personal)
        starred, created = StarredPcba.objects.get_or_create(
            user=user,
            pcba=pcba
        )

        return Response({
            'starred': True,
            'pcba_id': pcba.id
        }, status=status.HTTP_200_OK)
    except Pcba.DoesNotExist:
        return Response("PCBA not found", status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(f"Error: {str(e)}", status=status.HTTP_400_BAD_REQUEST)


@api_view(("DELETE",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def unstar_pcba(request, pk, **kwargs):
    """Unstar a PCBA."""
    user = request.user

    try:
        pcba = get_object_or_404(Pcba, id=pk)
        starred = StarredPcba.objects.filter(user=user, pcba=pcba).first()

        if starred:
            starred.delete()
            return Response({
                'starred': False,
                'pcba_id': pcba.id
            }, status=status.HTTP_200_OK)
        else:
            return Response("PCBA not starred", status=status.HTTP_404_NOT_FOUND)
    except Pcba.DoesNotExist:
        return Response("PCBA not found", status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(f"Error: {str(e)}", status=status.HTTP_400_BAD_REQUEST)


@swagger_auto_schema(
    method='put',
    operation_id='new_revision_pcba',
    operation_description="""
    Create a new revision of an existing PCBA.
    
    **Optional fields:**
    - `revision_notes`: Notes describing the changes in this revision (max 20000 characters)
    - `revision_type`: Type of revision ("major" or "minor", default: "major")
      - Use "major" for significant changes (increments major version: 1-0 → 2-0, or 1 → 2)
      - Use "minor" for minor changes (increments minor version: 1-0 → 1-1, or adds .1 in major-only format)
      - Only applies when number-based revisions are enabled for the organization
      - For letter-based revisions (A, B, C...), this parameter is ignored
    - `created_by`: User ID (only for API key requests, integer)
    
    **Note:** The PCBA must be the latest revision to create a new revision. The new revision will inherit most fields from the previous revision.
    """,
    tags=['pcbas'],
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=[],
        properties={
            'revision_notes': openapi.Schema(type=openapi.TYPE_STRING, maxLength=20000, description='Notes describing the changes in this revision', example='Updated PCB layout and component placement'),
            'revision_type': openapi.Schema(type=openapi.TYPE_STRING, description='Type of revision (only applies when number-based revisions are enabled)', enum=['major', 'minor'], example='major', default='major'),
            'created_by': openapi.Schema(type=openapi.TYPE_INTEGER, description='User ID (only for API key requests)'),
        }
    ),
    responses={
        200: openapi.Response(description='New revision created successfully', schema=PcbaSerializer),
        400: openapi.Response(description='Bad request - invalid data'),
        401: openapi.Response(description='Unauthorized - not latest revision or no project access'),
        404: openapi.Response(description='PCBA not found'),
    },
    security=[{'Token': []}, {'Api-Key': []}]
)
@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def new_revision(request, pk, **kwargs):
    data = request.data
    user = request.user
    if APIAndProjectAccess.has_validated_key(request):
        old_pcba = get_object_or_404(Pcba, id=pk)
    else:
        old_pcba = get_object_or_404(Pcba, Q(project__project_members=user)
                                     | Q(project__isnull=True), id=pk)
    try:
        reference_list = Reference_List.objects.get(
            id=old_pcba.reference_list_id)
    except Reference_List.DoesNotExist:
        reference_list = None

    # Update old revision is_latest_revision field.
    old_pcba.is_latest_revision = False
    old_pcba.save()

    new_pcba = Pcba()
    new_pcba.is_latest_revision = True
    new_pcba.release_state = "Draft"
    new_pcba.display_name = old_pcba.display_name
    new_pcba.project = old_pcba.project
    new_pcba.description = old_pcba.description
    new_pcba.created_by = old_pcba.created_by
    new_pcba.part_number = old_pcba.part_number
    new_pcba.external_part_number = old_pcba.external_part_number

    # Get organization_id from user profile or API key for revision system
    organization_id = None
    if APIAndProjectAccess.has_validated_key(request):
        org_id = APIAndProjectAccess.get_organization_id(request)
        if org_id != -1:
            organization_id = org_id
    elif hasattr(user, 'profile') and user.profile.organization_id:
        organization_id = user.profile.organization_id

    # Get revision type from request data (default to "major" for backward compatibility)
    revision_type = request.data.get('revision_type', 'major')
    new_pcba.revision_count_major, new_pcba.revision_count_minor = increment_revision_counters(old_pcba.revision_count_major, old_pcba.revision_count_minor, revision_type == 'major')

    new_pcba.save()

    new_pcba.full_part_number = build_full_part_number(
        organization_id=organization_id,
        prefix="PCBA",
        part_number=new_pcba.part_number,
        revision_count_major=new_pcba.revision_count_major,
        revision_count_minor=new_pcba.revision_count_minor,
        project_number=new_pcba.project.full_project_number if new_pcba.project else None,
        created_at=new_pcba.created_at
    )

    new_pcba.formatted_revision = build_formatted_revision(
        organization_id=organization_id,
        prefix="PCBA",
        part_number=new_pcba.part_number,
        revision_count_major=new_pcba.revision_count_major,
        revision_count_minor=new_pcba.revision_count_minor,
        project_number=new_pcba.project.full_project_number if new_pcba.project else None,
        created_at=new_pcba.created_at
    )

    new_pcba.price = old_pcba.price  # TODO are these deprecated?
    new_pcba.currency = old_pcba.currency  # TODO are these deprecated?
    new_pcba.save()

    copy_bom_to_new_revision = True
    if copy_bom_to_new_revision:
        try:
            current_bom = Assembly_bom.objects.get(pcba_id=old_pcba.id)
            new_bom = cloneBom(current_bom.id, new_pcba.id, "Pcba")
        except Assembly_bom.DoesNotExist:
            new_bom = None

        new_pcba.save()

    if reference_list != None:  # Handle Reference document copy
        reference_list.pk = None  # Creates new object
        reference_list.save()
        # Attach new copied list to new item revision.
        new_pcba.reference_list_id = reference_list.id
        new_pcba.save()

    original_thumbnail = old_pcba.thumbnail
    if original_thumbnail is not None:
        new_thumbnail = Image()
        new_thumbnail.file.save(
            original_thumbnail.image_name, ContentFile(
                original_thumbnail.file.read())
        )
        new_thumbnail.image_name = original_thumbnail.image_name
        new_thumbnail.save()
        new_pcba.thumbnail = new_thumbnail

    # Copy markdown_notes to new revision
    if old_pcba.markdown_notes:
        new_markdown_notes = MarkdownText.objects.create(
            text=old_pcba.markdown_notes.text,
            created_by=old_pcba.markdown_notes.created_by,
        )
        new_pcba.markdown_notes = new_markdown_notes

    # Set revision_notes from request data if provided
    if "revision_notes" in request.data:
        new_pcba.revision_notes = request.data["revision_notes"]

    new_pcba.save()

    copy_markdown_tabs_to_new_revision(old_pcba, new_pcba)

    # Copy tags to new revision
    new_pcba.tags.set(old_pcba.tags.all())

    link_issues_on_new_object_revision("pcbas", old_pcba, new_pcba)

    copy_price_to_new_revision(old_pcba, new_pcba)

    notify_on_new_revision(new_revision=new_pcba, app_name="pcbas", user=user)

    data = {"id": new_pcba.id}

    return Response(data, status=status.HTTP_200_OK)


@swagger_auto_schema(
    method='put',
    operation_id='edit_pcba',
    operation_description="""
    Update an existing PCBA.
    
    **Note:** Most fields can only be edited when the PCBA is in "Draft" state. Released PCBAs can only have `markdown_notes`, `tags`, and `price_update` modified.
    
    **Optional fields (all can be updated):**
    - `display_name`: Name of the PCBA (max 150 characters)
    - `description`: Description of the PCBA (max 500 characters)
    - `release_state`: Release state ("Draft", "Released", etc.)
    - `is_approved_for_release`: Boolean to approve for release
    - `markdown_notes`: Markdown text (can be edited on released PCBAs)
    - `tags`: Array of tag IDs (can be edited on released PCBAs)
    - `price_update`: Boolean to allow price updates on released PCBAs
    - `user_qa_id`: User ID for quality assurance (only for API key requests, integer)
    """,
    tags=['pcbas'],
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=[],
        properties={
            'display_name': openapi.Schema(type=openapi.TYPE_STRING, maxLength=150, description='Name of the PCBA'),
            'description': openapi.Schema(type=openapi.TYPE_STRING, maxLength=500, description='Description of the PCBA'),
            'release_state': openapi.Schema(type=openapi.TYPE_STRING, description='Release state', enum=['Draft', 'Released']),
            'is_approved_for_release': openapi.Schema(type=openapi.TYPE_BOOLEAN, description='Approve for release'),
            'markdown_notes': openapi.Schema(type=openapi.TYPE_STRING, description='Markdown text (can be edited on released PCBAs)'),
            'tags': openapi.Schema(type=openapi.TYPE_ARRAY, items=openapi.Items(type=openapi.TYPE_INTEGER), description='Array of tag IDs (can be edited on released PCBAs)'),
            'price_update': openapi.Schema(type=openapi.TYPE_BOOLEAN, description='Allow price updates on released PCBAs'),
            'user_qa_id': openapi.Schema(type=openapi.TYPE_INTEGER, description='User ID for quality assurance (only for API key requests)'),
        }
    ),
    responses={
        200: openapi.Response(description='PCBA updated successfully', schema=PcbaSerializer),
        400: openapi.Response(description='Bad request - PCBA is released and field cannot be edited, or invalid data'),
        401: openapi.Response(description='Unauthorized'),
        404: openapi.Response(description='PCBA not found'),
    },
    security=[{'Token': []}, {'Api-Key': []}]
)
@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def edit_pcba(request, pk, **kwargs):
    user = request.user
    try:
        # TODO check access on a per-project basis.
        data = request.data
        pcba = Pcba.objects.get(pk=pk)
        price_update = False
        if "price_update" in data:
            if data["price_update"]:
                price_update = True

        if "markdown_notes" in data:
            markdown_notes_data = data["markdown_notes"]
            if pcba.markdown_notes:
                pcba.markdown_notes.text = markdown_notes_data
                pcba.markdown_notes.save()

        if pcba.release_state == "Released" and not "markdown_notes" in data and not price_update and not "tags" in data:
            return Response(
                "Can't edit a released pcba!", status=status.HTTP_400_BAD_REQUEST
            )

        if "display_name" in data:
            pcba.display_name = data["display_name"]
        if "description" in data:
            pcba.description = data["description"]
        if "release_state" in data and data["release_state"] != pcba.release_state:
            pcba.release_state = data["release_state"]

            notify_on_state_change_to_release(user=user, item=pcba,
                                              new_state=data["release_state"], app_name="pcbas")

            if data["release_state"] == "Released":
                pcba.released_date = datetime.now()

                # Auto-push to Odoo if enabled (runs in background)
                auto_push_on_release_async(pcba, 'pcbas', user)

        user = request.user
        if "is_approved_for_release" in data:
            if data["is_approved_for_release"] == False:
                pcba.quality_assurance = None
            # Ensures QA is only set once, not every time the form is updated.
            if (
                data["is_approved_for_release"] == True
                and pcba.quality_assurance == None
            ):
                if APIAndProjectAccess.has_validated_key(request):
                    if "user_qa_id" in data:
                        user = User.objects.get(pk=data["user_qa_id"])
                        profile = Profile.objects.get(user=user)
                        pcba.quality_assurance = profile
                else:
                    profile = Profile.objects.get(user__pk=user.id)
                    pcba.quality_assurance = profile
                    notify_on_release_approval(item=pcba, user=user, app_name="pcbas")

        if "revision_notes" in data:
            pcba.revision_notes = data["revision_notes"]

        if "project" in data:
            if APIAndProjectAccess.has_validated_key(request):
                if not APIAndProjectAccess.check_project_access(request, data["project"]):
                    return Response(f"Not Authorized for project {data['project']}", status=status.HTTP_401_UNAUTHORIZED)

            project = Project.objects.get(pk=data["project"])
            pcba.project = project
        if "attributes" in data:
            pcba.attributes = data["attributes"]

        if "external_part_number" in data:
            pcba.external_part_number = data.get("external_part_number", "")

        if "part_type" in data:
            part_type, part_type_error = resolve_part_type_for_module(
                data.get("part_type"), "PCBA"
            )
            if part_type_error:
                return part_type_error
            pcba.part_type = part_type

        if "tags" in data:
            error, message, tag_ids = check_for_and_create_new_tags(pcba.project, data["tags"])
            if error:
                return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)
            pcba.tags.set(tag_ids)

        pcba.save()

        return Response(status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"edit_pcba failed: {e}", status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@swagger_auto_schema(
    method='post',
    operation_id='create_new_pcba',
    operation_description="""
    Create a new PCBA with a unique part number.
    
    **Required fields:**
    - `display_name`: Name of the PCBA (max 150 characters)
    - `description`: Description of the PCBA (max 500 characters)
    - `project`: Project ID (integer, must have access to the project)
    
    **Optional fields:**
    - `external_part_number`: External part number (max 1000 characters)
    - `created_by`: User ID (only for API key requests, integer)
    
    **Note:** A new BOM (Bill of Materials) is automatically created for each new PCBA.
    """,
    tags=['pcbas'],
    request_body=openapi.Schema(
        type=openapi.TYPE_OBJECT,
        required=['display_name', 'description', 'project'],
        properties={
            'display_name': openapi.Schema(type=openapi.TYPE_STRING, maxLength=150, description='Name of the PCBA', example='Main Controller PCBA'),
            'description': openapi.Schema(type=openapi.TYPE_STRING, maxLength=500, description='Description of the PCBA', example='Main controller printed circuit board assembly'),
            'project': openapi.Schema(type=openapi.TYPE_INTEGER, description='Project ID (must have access to the project)', example=1),
            'external_part_number': openapi.Schema(type=openapi.TYPE_STRING, maxLength=1000, description='External part number'),
            'created_by': openapi.Schema(type=openapi.TYPE_INTEGER, description='User ID (only for API key requests)'),
        }
    ),
    responses={
        201: openapi.Response(description='PCBA created successfully', schema=PcbaSerializer),
        400: openapi.Response(description='Bad request - missing required fields or invalid data'),
        401: openapi.Response(description='Unauthorized'),
        404: openapi.Response(description='Project not found'),
        500: openapi.Response(description='Internal server error'),
    },
    security=[{'Token': []}, {'Api-Key': []}]
)
@api_view(("GET", "POST",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def create_new_pcba(request, **kwargs):
    try:
        data = request.data

        pcba = Pcba()

        pcba.display_name = data["display_name"]
        pcba.description = data["description"]
        if not "project" in data:
            return Response("No project provided", status=status.HTTP_400_BAD_REQUEST)
        try:
            project = None
            if APIAndProjectAccess.has_validated_key(request):
                if APIAndProjectAccess.check_project_access(request, data["project"]):
                    project = Project.objects.filter(pk=data["project"])
            else:
                user = request.user
                project = Project.objects.filter(
                    id=data["project"]).filter(project_members=user)
                if not project.exists():
                    return Response("Project not found", status=status.HTTP_404_NOT_FOUND)
            if project == None:
                return Response("Project not found", status=status.HTTP_404_NOT_FOUND)
            pcba.project = project.first()
        except Exception as e:
            return Response(str(e), status=status.HTTP_400_BAD_REQUEST)

        pcba.is_latest_revision = True
        pcba.is_archived = False
        pcba.release_state = "Draft"
        pcba.part_number = get_next_part_number()
        pcba.external_part_number = data.get("external_part_number", "")

        part_type, part_type_error = resolve_part_type_for_module(
            data.get("part_type"), "PCBA"
        )
        if part_type_error:
            return part_type_error
        pcba.part_type = part_type

        # Initialize revision counters - both start at 0 for first revision
        pcba.revision_count_major = 0
        pcba.revision_count_minor = 0

        # Get organization_id from user profile or API key for revision system
        organization_id = None
        if APIAndProjectAccess.has_validated_key(request):
            org_id = APIAndProjectAccess.get_organization_id(request)
            if org_id != -1:
                organization_id = org_id
        elif hasattr(request.user, 'profile') and request.user.profile.organization_id:
            organization_id = request.user.profile.organization_id

        if APIAndProjectAccess.has_validated_key(request):
            if "created_by" in data:
                user = User.objects.get(pk=data["created_by"])
                pcba.created_by = user
        else:
            pcba.created_by = request.user
        pcba.save()

        pcba.full_part_number = build_full_part_number(
            organization_id=organization_id,
            prefix="PCBA",
            part_number=pcba.part_number,
            revision_count_major=pcba.revision_count_major,
            revision_count_minor=pcba.revision_count_minor,
            project_number=pcba.project.full_project_number if pcba.project else None,
            created_at=pcba.created_at
        )

        pcba.formatted_revision = build_formatted_revision(
            organization_id=organization_id,
            prefix="PCBA",
            part_number=pcba.part_number,
            revision_count_major=pcba.revision_count_major,
            revision_count_minor=pcba.revision_count_minor,
            project_number=pcba.project.full_project_number if pcba.project else None,
            created_at=pcba.created_at
        )

        pcba.save()

        # Create new assembly bom
        new_bom = Assembly_bom()
        new_bom.pcba = pcba
        new_bom.save()

        serializer = PcbaSerializer(pcba, many=False)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(
            f"create_new_pcba failed: {e}", status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


def save_temp_file(file):
    """Write the file to the actual location in a temp folder."""

    def asseble_path(path, file_name, extension, num_rand=0):
        r_path = path + file_name
        for i in range(num_rand):
            r_path += str(random.randint(0, 9))

        return r_path + extension

    base_name = os.path.basename(str(file.name))
    # print("base_name = " + base_name)
    file_name = os.path.splitext(base_name)[0]
    # print("file_name = "+ file_name)
    file_extension = os.path.splitext(base_name)[1]

    path = asseble_path("/tmp/", file_name, file_extension)

    i = 0
    while os.path.exists(path):
        path = asseble_path("/tmp/", file_name, file_extension, i)
        i += 1

    with open(path, "wb+") as destination:
        # for chunk in file.chunks():
        destination.write(file.read())

    unique_name = os.path.basename(path)
    return path, unique_name


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def fetch_nodes_blueprint(request, pcbaIds):
    permission, response = check_user_auth_and_app_permission(request, "pcbas")
    if not permission:
        return response
    pcbasToFetch = pcbaIds.split(",")
    ids = []
    for string in pcbasToFetch:
        pcbaId = int(string)
        ids.append(pcbaId)

    data = Pcba.objects.filter(id__in=ids)
    serializer = PcbaSerializer(data, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def save_blueprint_edge(request, source, target, asmId):
    permission, response = check_user_auth_and_app_permission(request, "pcbas")
    if not permission:
        return response
    # Some string logic, need to save the asmId with each connection so saving connection and asmId as 1 string, saves lots of db space and is faster than using 2D arrays
    data = list(request.data.values())
    source_s = str(data[0])  # Prev
    target_s = str(data[1])  # Next
    asmId_s = str(asmId)
    combined_source = source_s + "," + asmId_s
    combined_target = target_s + "," + asmId_s

    sourcePcba = Pcba.objects.get(id=source)
    current_next = []
    if sourcePcba.next_pcba != None:
        current_next = list(sourcePcba.next_pbca)
    if combined_target != None and combined_target != "":
        if combined_target not in current_next:
            current_next.append(combined_target)
            Pcba.objects.filter(id=source).update(next_pcba=current_next)
        else:
            return Response(
                "Target is already added, two connections to same prod not allowed",
                status=status.HTTP_400_BAD_REQUEST,
            )
    else:
        return Response(
            "Target is None or empty string", status=status.HTTP_404_NOT_FOUND
        )

    current_prev = []
    if sourcePcba.prev_pcba != None:
        current_prev = list(sourcePcba.prev_pcba)
    if combined_source != None and combined_target != "":
        if combined_source not in current_prev:
            current_prev.append(combined_source)
            Pcba.objects.filter(id=target).update(prev_pcba=current_prev)
        else:
            return Response(
                "Source is already added, two connections to same prod not allowed",
                status=status.HTTP_400_BAD_REQUEST,
            )
    else:
        return Response(
            "Source is None or empty string", status=status.HTTP_404_NOT_FOUND
        )

    return Response(
        "Saved source %s and target %s connection" % (
            combined_source, combined_target),
        status=status.HTTP_200_OK,
    )


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def update_revision_notes(request, pcbaId):
    permission, response = check_user_auth_and_app_permission(request, "pcbas")
    if not permission:
        return response
    try:
        data = request.data
        if not "revision_notes" in data:
            return Response(
                "No data sent with request", status=status.HTTP_400_BAD_REQUEST
            )

        pcba = Pcba.objects.get(id=pcbaId)
        pcba.revision_notes = data["revision_notes"]
        pcba.save()
        serializer = PcbaSerializer(pcba, many=False)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"update_revision_notes failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def edit_errata(request, pcbaId):
    permission, response = check_user_auth_and_app_permission(request, "pcbas")
    if not permission:
        return response
    try:
        data = request.data

        if not "errata" in data:
            return Response(
                "No data sent with request", status=status.HTTP_400_BAD_REQUEST
            )

        pcba = Pcba.objects.get(id=pcbaId)
        pcba.errata = data["errata"]
        pcba.save()
        serializer = PcbaSerializer(pcba, many=False)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            f"edit_errata failed: {e}", status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
def get_revisions(request, id):
    """Return all revisions of a particular part number"""
    permission, response = check_user_auth_and_app_permission(request, "pcbas")
    if not permission:
        return response

    pcba = Pcba.objects.get(pk=id)
    pcbas = Pcba.objects.filter(
        part_number=pcba.part_number).exclude(is_archived=True)
    serializer = PcbaSerializer(pcbas, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


def batch_process_is_latest_revision_by_part_number(part_number):
    """This view runs through Pcbas and corrects the is_latest_revision field"""
    items = Pcba.objects.filter(
        part_number=part_number).exclude(is_archived=True)
    for item in items:
        item.is_latest_revision = is_latest_revision(
            item.part_number, item.revision_count_major, item.revision_count_minor)
        item.save()
