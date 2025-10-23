from assemblies.models import Assembly
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from organizations.permissions import APIAndProjectAccess
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from datetime import datetime
from django.shortcuts import get_object_or_404
from django.db.models import Q
from django.contrib.auth.decorators import login_required
from django.core.files.base import ContentFile

from assembly_bom.models import Assembly_bom
from documents.models import MarkdownText, Reference_List
from projects.views import check_project_access
from pcbas.views import is_latest_revision
from part_numbers.methods import get_next_part_number
from assembly_bom.utilityFuncitons import cloneBom
from profiles.utilityFunctions import (
    notify_on_new_revision, notify_on_release_approval,
    notify_on_state_change_to_release)

from profiles.views import check_user_auth_and_app_permission
from purchasing.priceUtilities import copy_price_to_new_revision
from .serializers import AssemblyReleaseStateManagementSerializer, AssemblySerializer, AssemblyTableSerializer

from files.models import File, Image
from django.contrib.postgres.search import SearchVector
from profiles.models import Profile
from profiles.serializers import ProfileSerializer
from django.contrib.auth.models import User
from pcbas.viewUtilities import increment_revision
from projects.models import Project
from projects.viewsIssues import link_issues_on_new_object_revision
from projects.viewsTags import check_for_and_create_new_tags
from parts.viewUtilities import copy_markdown_tabs_to_new_revision


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@permission_classes([APIAndProjectAccess | IsAuthenticated])
def create_new_assembly(request, **kwargs):
    """Create a new assembly with a unique part number."""
    data = request.data
    try:
        assembly_entry = Assembly()
        assembly_entry.part_number = get_next_part_number()
        assembly_entry.price = 0
        if APIAndProjectAccess.has_validated_key(request):
            if "created_by" in data:
                assembly_entry.created_by = User.objects.get(
                    id=data["created_by"])
        else:
            assembly_entry.created_by = request.user
        assembly_entry.release_state = "Draft"
        assembly_entry.is_latest_revision = True
        assembly_entry.is_archived = False
        
        # Get organization_id from user profile for revision system
        organization_id = None
        if hasattr(request.user, 'profile') and request.user.profile.organization_id:
            organization_id = request.user.profile.organization_id
        
        # Set initial revision based on organization settings
        from organizations.revision_utils import get_organization_revision_settings
        if organization_id:
            use_number_revisions, revision_format, separator = get_organization_revision_settings(organization_id)
            if use_number_revisions:
                if revision_format == "major-minor":
                    assembly_entry.revision = f"1{separator}0"
                else:
                    assembly_entry.revision = "1"
            else:
                assembly_entry.revision = "A"
        else:
            assembly_entry.revision = "A"
        
        # Format full_part_number based on organization revision settings
        if organization_id:
            use_number_revisions, revision_format, separator = get_organization_revision_settings(organization_id)
            if use_number_revisions:
                # For number revisions, use underscore separator
                assembly_entry.full_part_number = f"ASM{assembly_entry.part_number}_{assembly_entry.revision}"
            else:
                # For letter revisions, use direct concatenation
                assembly_entry.full_part_number = f"ASM{assembly_entry.part_number}{assembly_entry.revision}"
        else:
            # Default to letter revision format
            assembly_entry.full_part_number = f"ASM{assembly_entry.part_number}{assembly_entry.revision}"

        if "display_name" in data:
            assembly_entry.display_name = data["display_name"]
        if "description" in data:
            assembly_entry.description = data["description"]

        if "project" in data and data["project"] != -1:
            if APIAndProjectAccess.has_validated_key(request):
                if not APIAndProjectAccess.check_project_access(request, data["project"]):
                    return Response(f"Not Authorized for project {data['project']}", status=status.HTTP_401_UNAUTHORIZED)

            try:
                project_instance = Project.objects.get(id=data["project"])
                assembly_entry.project = project_instance
            except Project.DoesNotExist:
                pass

        assembly_entry.external_part_number = data.get("external_part_number", "")
        assembly_entry.save()

        # Ensure every new assembly has a BOM.
        new_bom = Assembly_bom.objects.create(
            assembly_id=assembly_entry.id,
            bom_name=assembly_entry.display_name + "BOM",
            comments="",
        )

        serializer = AssemblySerializer(assembly_entry)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(f"Failed creating assembly {str(e)}", status=status.HTTP_400_BAD_REQUEST)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_assembly(request, asmId):
    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "assemblies")
    if not permission:
        return response
    if asmId == None:
        return Response(
            "No id sent with the request", status=status.HTTP_400_BAD_REQUEST
        )
    try:
        assembly = get_object_or_404(
            Assembly,
            Q(project__project_members=user) | Q(project__isnull=True),
            id=asmId,
        )

        if not assembly.markdown_notes:
            markdown_notes = MarkdownText(
                created_by=user,
                text='',
            )
            markdown_notes.save()
            assembly.markdown_notes = markdown_notes
            assembly.save()

        serializer = AssemblySerializer(assembly, many=False)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Assembly.DoesNotExist:
        return Response("ASM not found", status=status.HTTP_404_NOT_FOUND)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([APIAndProjectAccess | IsAuthenticated])
def get_single_asm(request, pk, **kwargs):
    user = request.user
    if pk == None:
        return Response(
            "No id sent with the request", status=status.HTTP_400_BAD_REQUEST
        )
    try:
        if APIAndProjectAccess.has_validated_key(request):
            # Here we have already checked if the user has access to the project, dont need to check again
            asm = get_object_or_404(Assembly, id=pk)
            serializer = AssemblySerializer(asm, many=False, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
        else:
            asm = get_object_or_404(
                Assembly,
                Q(project__project_members=user) | Q(project__isnull=True),
                id=pk,
            )

            if not asm.markdown_notes:
                markdown_notes = MarkdownText(
                    created_by=user,
                    text='',
                )
                markdown_notes.save()
                asm.markdown_notes = markdown_notes
                asm.save()

            serializer = AssemblySerializer(asm, many=False, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)
    except Assembly.DoesNotExist:
        return Response("ASM not found", status=status.HTTP_404_NOT_FOUND)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([APIAndProjectAccess | IsAuthenticated])
def get_latest_revisions(request, **kwargs):
    """Fetch the latest revisions of all assemblies"""
    user = request.user
    try:
        assemblies_query = Assembly.objects.filter(
            is_archived=False).exclude(is_latest_revision=False)

        if APIAndProjectAccess.has_validated_key(request):
            if not APIAndProjectAccess.check_wildcard_access(request):
                assemblies_query = assemblies_query.filter(
                    project__in=request.allowed_projects
                )
        else:
            assemblies_query = assemblies_query.filter(
                Q(project__project_members=user) | Q(project__isnull=True)
            ).prefetch_related("tags")
        serializer = AssemblyTableSerializer(assemblies_query, many=True, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(f"Error: {str(e)}", status=status.HTTP_404_NOT_FOUND)


@ api_view(("GET",))
@ renderer_classes((JSONRenderer,))
@ login_required(login_url="/login")
def get_revision_list(request, asmId):
    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "assemblies")
    if not permission:
        return response
    try:
        asm = Assembly.objects.get(pk=asmId)
        pn = asm.part_number
        asms = Assembly.objects.filter(
            Q(part_number=pn) & Q(is_archived=False))
        serializer = AssemblySerializer(asms, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Assembly.DoesNotExist:
        return Response("Object not found", status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            f"get_revision_list failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@permission_classes([APIAndProjectAccess | IsAuthenticated])
def archive_revision(request, pk, **kwargs):
    if pk == None:
        return Response("Bad ID sent with request", status=status.HTTP_400_BAD_REQUEST)
    try:
        assembly = Assembly.objects.get(pk=pk)
        assembly.is_archived = True
        assembly.save()

        # Now there is no guarantee that the latest revision is marked correctly.
        batch_process_is_latest_revision_by_part_number(assembly.part_number)

        return Response("Archived", status=status.HTTP_202_ACCEPTED)
    except Assembly.DoesNotExist:
        return Response("Object not found", status=status.HTTP_404_NOT_FOUND)


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@permission_classes([APIAndProjectAccess | IsAuthenticated])
def new_revision(request, pk, **kwargs):
    try:
        current_asm = Assembly.objects.select_related('project').get(pk=pk)
        if current_asm.is_latest_revision == False:
            return Response("Not latest revision", status=status.HTTP_401_UNAUTHORIZED)

        current_asm.is_latest_revision = False
        current_asm.save()

        current_bom = -1
        try:
            current_bom = Assembly_bom.objects.get(assembly_id=pk)
        except Assembly_bom.DoesNotExist:
            current_bom = -1

        try:
            reference_list = Reference_List.objects.get(
                id=current_asm.reference_list_id
            )
        except Reference_List.DoesNotExist:
            reference_list = None

        data = request.data
        if "copyPrev" in data:
            # Copy over ASM data
            newRevision = Assembly()
            newRevision.display_name = current_asm.display_name
            newRevision.description = current_asm.description
            newRevision.project = current_asm.project
            newRevision.part_number = current_asm.part_number
            newRevision.external_part_number = current_asm.external_part_number
            # Get organization_id from user profile for revision system
            organization_id = None
            if hasattr(request.user, 'profile') and request.user.profile.organization_id:
                organization_id = request.user.profile.organization_id
            
            # Get revision type from request data (default to "major" for backward compatibility)
            revision_type = data.get('revision_type', 'major')
            
            newRevision.revision = increment_revision(current_asm.revision, organization_id, revision_type)
            
            # Format full_part_number based on organization revision settings
            from organizations.revision_utils import get_organization_revision_settings
            if organization_id:
                use_number_revisions, revision_format, separator = get_organization_revision_settings(organization_id)
                if use_number_revisions:
                    # For number revisions, use underscore separator
                    newRevision.full_part_number = f"ASM{current_asm.part_number}_{newRevision.revision}"
                else:
                    # For letter revisions, use direct concatenation
                    newRevision.full_part_number = f"ASM{current_asm.part_number}{newRevision.revision}"
            else:
                # Default to letter revision format
                newRevision.full_part_number = f"ASM{current_asm.part_number}{newRevision.revision}"
            if APIAndProjectAccess.has_validated_key(request):
                if "created_by" in data:
                    newRevision.created_by = User.objects.get(
                        id=data["released_by"])
            else:
                newRevision.created_by = request.user
            newRevision.is_archived = False

            if reference_list != None:  # Handle Reference document copy
                reference_list.pk = None  # Creates new object
                reference_list.save()
                newRevision.reference_list_id = (
                    reference_list.id
                )  # Attach new copied list to new item revision.

            newRevision.release_state = "Draft"
            newRevision.errata = ""
            newRevision.generic_file_ids = []
            newRevision.assembly_drawing_raw = -1
            newRevision.assembly_drawing = -1
            newRevision.is_latest_revision = True

            newRevision.price = current_asm.price
            newRevision.currency = current_asm.currency

            original_thumbnail = current_asm.thumbnail
            if original_thumbnail is not None:
                new_thumbnail = Image()
                new_thumbnail.file.save(
                    original_thumbnail.image_name,
                    ContentFile(original_thumbnail.file.read()),
                )
                new_thumbnail.image_name = original_thumbnail.image_name
                new_thumbnail.save()
                newRevision.thumbnail = new_thumbnail

            # Copy markdown_notes to new revision
            if current_asm.markdown_notes:
                new_markdown_notes = MarkdownText.objects.create(
                    text=current_asm.markdown_notes.text,
                    created_by=current_asm.markdown_notes.created_by,
                )
                newRevision.markdown_notes = new_markdown_notes

            newRevision.save()

            copy_markdown_tabs_to_new_revision(current_asm, newRevision)

            # Copy over tags
            newRevision.tags.set(current_asm.tags.all())

            copy_price_to_new_revision(current_asm, newRevision)

            notify_on_new_revision(newRevision, "assemblies", request.user)

            # Handle data overwrite
            if "copyBom" in data:
                if data["copyBom"] == 1:
                    new_bom = ""
                    if current_bom != -1:
                        new_bom = cloneBom(
                            current_bom.id, newRevision.id, "Assembly")
                else:
                    Assembly.objects.filter(
                        id=newRevision.id).update(bom_id=None)

            if data["copyPrev"] == 0:
                if "description" in data:
                    Assembly.objects.filter(id=newRevision.id).update(
                        description=data["description"]
                    )
                if "revision_notes" in data:
                    Assembly.objects.filter(id=newRevision.id).update(
                        revision_notes=data["revision_notes"]
                    )

            link_issues_on_new_object_revision('assemblies', current_asm, newRevision)

            updatedAsm = Assembly.objects.get(id=newRevision.id)

            serializer = AssemblySerializer(updatedAsm, many=False)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        else:
            return Response(
                "No data persistence flag set.", status=status.HTTP_400_BAD_REQUEST
            )
    except Assembly.DoesNotExist:
        return Response("Object not found", status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            f"new_revision failed: {e}", status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@permission_classes([APIAndProjectAccess | IsAuthenticated])
def update_info(request, pk, **kwargs):
    user = request.user
    try:
        asm_qs = Assembly.objects.filter(id=pk)
        if APIAndProjectAccess.has_validated_key(request):
            asm = asm_qs.first()
        else:
            if not check_project_access(asm_qs, user):
                return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
        asm = asm_qs.first()
    except Assembly.DoesNotExist:
        return Response("Object not found", status=status.HTTP_404_NOT_FOUND)

    data = request.data
    price_update = False
    if "price_update" in data:
        if data["price_update"]:
            price_update = True

    if "markdown_notes" in data:
        markdown_notes_data = data["markdown_notes"]
        if asm.markdown_notes:
            asm.markdown_notes.text = markdown_notes_data
            asm.markdown_notes.save()

    # TODO why is this check missing?
    if asm.release_state == "Released" and not "markdown_notes" in data and not price_update and not "tags" in data:
        return Response(
            "Can't edit a released asm!", status=status.HTTP_400_BAD_REQUEST
        )

    if "display_name" in data:
        asm.display_name = data["display_name"]
    if "price" in data:
        asm.price = data["price"]
    if "model_url" in data:
        asm.model_url = data["model_url"]
    if "revision" in data:
        asm.revision = data["revision"]
    if "description" in data:
        asm.description = data["description"]
    if "part_number" in data:
        asm.part_number = data["part_number"]
    if "last_updated" in data:
        asm.last_updated = data["last_updated"]

    if "release_state" in data and data["release_state"] != asm.release_state:
        asm.release_state = data["release_state"]
        if not APIAndProjectAccess.has_validated_key(request):

            notify_on_state_change_to_release(user, asm, data["release_state"], "assemblies")

        if data["release_state"] == "Released":
            asm.released_date = datetime.now()

    if "is_approved_for_release" in data:
        if data["is_approved_for_release"] == False:
            asm.quality_assurance = None
        # Ensures QA is only set once, not every time the form is updated.
        if data["is_approved_for_release"] == True and asm.quality_assurance == None:
            if APIAndProjectAccess.has_validated_key(request):
                if "quality_assurance" in data:
                    user = User.objects.get(id=data["quality_assurance"])
                    asm.quality_assurance = Profile.objects.get(
                        user__pk=user.id)
            else:
                profile = Profile.objects.get(user__pk=user.id)
                asm.quality_assurance = profile

                notify_on_release_approval(asm, user, "assemblies")

    if "tags" in data:
        error, message, tag_ids = check_for_and_create_new_tags(asm.project, data["tags"])
        if error:
            return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)
        asm.tags.set(tag_ids)

    if "external_part_number" in data:
        asm.external_part_number = data.get("external_part_number", "")
    asm.save()

    serializer = AssemblySerializer(asm, many=False)
    return Response(serializer.data, status=status.HTTP_202_ACCEPTED)


@ api_view(("PUT",))
@ renderer_classes((JSONRenderer,))
@ login_required(login_url="/login")
def save_blueprint(request, asmId):
    permission, response = check_user_auth_and_app_permission(
        request, "assemblies")
    if not permission:
        return response

    Assembly.objects.filter(id=asmId).update(graph_blueprint=True)
    return Response(
        "Saved ASM graph Blueprint for ASM: %d" % (asmId), status=status.HTTP_200_OK
    )


@ api_view(("PUT",))
@ renderer_classes((JSONRenderer,))
@ login_required(login_url="/login")
def edit_errata(request, asmId):
    permission, response = check_user_auth_and_app_permission(
        request, "assemblies")
    if not permission:
        return response

    data = request.data
    if data == None:
        return Response(
            "No data sent with the request", status=status.HTTP_400_BAD_REQUEST
        )
    if not "errata" in data:
        return Response(
            "No data sent with the request", status=status.HTTP_400_BAD_REQUEST
        )

    asm = Assembly.objects.get(id=asmId)
    asm.errata = data["errata"]
    asm.save()
    serializer = AssemblySerializer(asm, many=False)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@ api_view(("PUT",))
@ renderer_classes((JSONRenderer,))
@ login_required(login_url="/login")
def edit_revision_notes(request, asmId):
    permission, response = check_user_auth_and_app_permission(
        request, "assemblies")
    if not permission:
        return response

    try:
        data = request.data
        if data == None:
            return Response(
                "No data sent with the request", status=status.HTTP_400_BAD_REQUEST
            )

        if "revision_notes" not in data:
            return Response(
                "No revision notes sent with the request",
                status=status.HTTP_400_BAD_REQUEST,
            )

        asm = Assembly.objects.get(id=asmId)
        if asm == None:
            return Response("Assembly not found", status=status.HTTP_404_NOT_FOUND)
        if asm.release_state == "Released":
            return Response("Assembly is Released", status=status.HTTP_401_UNAUTHORIZED)

        asm.revision_notes = data["revision_notes"]
        asm.save()

        serializer = AssemblySerializer(asm, many=False)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"edit_revision_notes faield: {e}", status=status.HTTP_400_BAD_REQUEST
        )


@ api_view(("PUT",))
@ renderer_classes((JSONRenderer,))
@ login_required(login_url="/login")
def edit_bom_id(request, asmId, bom_id):
    permission, response = check_user_auth_and_app_permission(
        request, "assemblies")
    if not permission:
        return response

    if asmId == None:
        return Response(
            "No data sent with the request", status=status.HTTP_400_BAD_REQUEST
        )
    if bom_id == None:
        return Response(
            "No data sent with the request", status=status.HTTP_400_BAD_REQUEST
        )
    Assembly.objects.filter(id=asmId).update(bom_id=bom_id)
    newAsm = Assembly.objects.get(id=asmId)
    serializer = AssemblySerializer(newAsm, many=False)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


def get_org_id(user):
    user_profile = Profile.objects.get(user__pk=user.id)
    userSerializer = ProfileSerializer(user_profile, many=False)
    org_id = -1
    if "organization_id" in userSerializer.data:
        if userSerializer.data["organization_id"] != None:
            org_id = userSerializer.data["organization_id"]
    return org_id


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def get_all_assemblies(request):
    user = request.user
    org_id = get_org_id(user)
    if org_id == -1:
        return Response("No organization id found", status=status.HTTP_400_BAD_REQUEST)
    assemblies = Assembly.objects.filter(
        Q(project__project_members=user) | Q(project__isnull=True), is_archived=False
    )
    serializer = AssemblyReleaseStateManagementSerializer(assemblies, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@ api_view(("GET",))
@ renderer_classes((JSONRenderer,))
def get_revisions(request, part_number):
    """Return all revisions of a particular part number"""
    permission, response = check_user_auth_and_app_permission(
        request, "assemblies")
    if not permission:
        return response

    items = Assembly.objects.filter(
        part_number=part_number).exclude(is_archived=True)
    serializer = AssemblySerializer(items, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


def is_latest_revision(part_number, revision):
    """Check if the current item is the latest revision."""
    items = Assembly.objects.filter(
        part_number=part_number).exclude(is_archived=True)

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


def batch_process_is_latest_revision_by_part_number(part_number):
    """This view runs through Parts and corrects the is_latest_revision field"""
    items = Assembly.objects.filter(
        part_number=part_number).exclude(is_archived=True)
    for item in items:
        item.is_latest_revision = is_latest_revision(
            item.part_number, item.revision)
        item.save()
