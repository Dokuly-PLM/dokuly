from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.contrib.auth.decorators import login_required
from datetime import datetime

from .models import Eco, AffectedItem
from .serializers import EcoSerializer, AffectedItemSerializer, AffectedItemDetailSerializer
from profiles.views import check_user_auth_and_app_permission
from profiles.models import Profile
from documents.models import MarkdownText, Document
from parts.models import Part
from pcbas.models import Pcba
from assemblies.models import Assembly
from projects.models import Project, Tag
from projects.viewsTags import check_for_and_create_new_tags


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def create_eco(request):
    """Create a new ECO."""
    permission, response = check_user_auth_and_app_permission(request, "assemblies") # TODO make permission specific to ECOs
    if not permission:
        return response

    try:
        data = request.data
        eco = Eco()
        eco.created_by = request.user
        eco.release_state = "Draft"

        if "display_name" in data:
            eco.display_name = data["display_name"]

        if "responsible" in data and data["responsible"]:
            try:
                eco.responsible = Profile.objects.get(id=data["responsible"])
            except Profile.DoesNotExist:
                pass

        if "project" in data and data["project"]:
            try:
                eco.project = Project.objects.get(id=data["project"])
            except Project.DoesNotExist:
                pass

        # Create markdown description
        description = MarkdownText.objects.create(
            created_by=request.user,
            text="",
        )
        eco.description = description

        eco.save()

        serializer = EcoSerializer(eco)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(f"Failed creating ECO: {str(e)}", status=status.HTTP_400_BAD_REQUEST)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def edit_eco(request, pk):
    """Edit an existing ECO. Cannot edit if released."""
    permission, response = check_user_auth_and_app_permission(request, "assemblies")  # TODO make permission specific to ECOs
    if not permission:
        return response

    try:
        eco = Eco.objects.get(pk=pk)
    except Eco.DoesNotExist:
        return Response("ECO not found", status=status.HTTP_404_NOT_FOUND)

    if eco.release_state == "Released":
        return Response("Cannot edit a released ECO!", status=status.HTTP_400_BAD_REQUEST)

    data = request.data

    if "display_name" in data:
        eco.display_name = data["display_name"]

    if "description" in data:
        if eco.description:
            eco.description.text = data["description"]
            eco.description.save()
        else:
            description = MarkdownText.objects.create(
                created_by=request.user,
                text=data["description"],
            )
            eco.description = description

    if "responsible" in data:
        if data["responsible"]:
            try:
                eco.responsible = Profile.objects.get(id=data["responsible"])
            except Profile.DoesNotExist:
                pass
        else:
            eco.responsible = None

    if "release_state" in data:
        eco.release_state = data["release_state"]
        if data["release_state"] == "Released":
            eco.released_date = datetime.now()
            eco.released_by = request.user

    if "is_approved_for_release" in data:
        if data["is_approved_for_release"] == False:
            eco.quality_assurance = None
        # Ensures QA is only set once, not every time the form is updated.
        if data["is_approved_for_release"] == True and eco.quality_assurance == None:
            profile = Profile.objects.get(user__pk=request.user.id)
            eco.quality_assurance = profile

    if "project" in data:
        if data["project"]:
            try:
                eco.project = Project.objects.get(id=data["project"])
            except Project.DoesNotExist:
                pass
        else:
            eco.project = None

    eco.save()

    # Handle tags (must be done after save for ManyToMany)
    if "tags" in data:
        tags_data = data["tags"]
        if isinstance(tags_data, list):
            # Check if tags_data contains dictionaries (with id, name, color) or just IDs
            if tags_data and isinstance(tags_data[0], dict):
                # Tags data contains full tag objects, use check_for_and_create_new_tags
                error, message, tag_ids = check_for_and_create_new_tags(eco.project, tags_data)
                if error:
                    return Response(message, status=status.HTTP_400_BAD_REQUEST)
                eco.tags.set(tag_ids)
            else:
                # Tags data contains just IDs, filter out any -1 values (invalid)
                valid_tag_ids = [tid for tid in tags_data if tid != -1]
                eco.tags.set(valid_tag_ids)

    serializer = EcoSerializer(eco)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("DELETE",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def delete_eco(request, pk):
    """Delete an ECO. Cannot delete if released."""
    permission, response = check_user_auth_and_app_permission(request, "assemblies") # TODO make permission specific to ECOs
    if not permission:
        return response

    try:
        eco = Eco.objects.get(pk=pk)
    except Eco.DoesNotExist:
        return Response("ECO not found", status=status.HTTP_404_NOT_FOUND)

    if eco.release_state == "Released":
        return Response("Cannot delete a released ECO!", status=status.HTTP_400_BAD_REQUEST)

    eco.delete()
    return Response("ECO deleted", status=status.HTTP_204_NO_CONTENT)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def get_eco(request, pk):
    """Get a single ECO by ID."""
    permission, response = check_user_auth_and_app_permission(request, "assemblies")  # TODO make permission specific to ECOs
    if not permission:
        return response

    try:
        eco = Eco.objects.get(pk=pk)
    except Eco.DoesNotExist:
        return Response("ECO not found", status=status.HTTP_404_NOT_FOUND)

    serializer = EcoSerializer(eco)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def get_all_ecos(request):
    """Get all ECOs."""
    permission, response = check_user_auth_and_app_permission(request, "assemblies")  # TODO make permission specific to ECOs
    if not permission:
        return response

    ecos = Eco.objects.all().order_by("-last_updated")
    serializer = EcoSerializer(ecos, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# ============== Affected Items ==============

@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def add_affected_item(request, eco_id):
    """Add a new affected item row to an ECO."""
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    try:
        eco = Eco.objects.get(pk=eco_id)
    except Eco.DoesNotExist:
        return Response("ECO not found", status=status.HTTP_404_NOT_FOUND)

    if eco.release_state == "Released":
        return Response("Cannot modify a released ECO!", status=status.HTTP_400_BAD_REQUEST)

    # Create empty affected item
    affected_item = AffectedItem.objects.create(eco=eco)

    # Update the ECO's last_updated timestamp
    eco.save()

    serializer = AffectedItemDetailSerializer(affected_item)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def edit_affected_item(request, pk):
    """Edit an affected item - attach a part/pcba/assembly/document."""
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    try:
        affected_item = AffectedItem.objects.get(pk=pk)
    except AffectedItem.DoesNotExist:
        return Response("Affected item not found", status=status.HTTP_404_NOT_FOUND)

    if affected_item.eco.release_state == "Released":
        return Response("Cannot modify a released ECO!", status=status.HTTP_400_BAD_REQUEST)

    data = request.data

    # Clear all item references first when setting a new one
    if "part_id" in data or "pcba_id" in data or "assembly_id" in data or "document_id" in data:
        affected_item.part = None
        affected_item.pcba = None
        affected_item.assembly = None
        affected_item.document = None

    if "part_id" in data:
        if data["part_id"]:
            try:
                affected_item.part = Part.objects.get(pk=data["part_id"])
            except Part.DoesNotExist:
                return Response("Part not found", status=status.HTTP_404_NOT_FOUND)

    if "pcba_id" in data:
        if data["pcba_id"]:
            try:
                affected_item.pcba = Pcba.objects.get(pk=data["pcba_id"])
            except Pcba.DoesNotExist:
                return Response("PCBA not found", status=status.HTTP_404_NOT_FOUND)

    if "assembly_id" in data:
        if data["assembly_id"]:
            try:
                affected_item.assembly = Assembly.objects.get(pk=data["assembly_id"])
            except Assembly.DoesNotExist:
                return Response("Assembly not found", status=status.HTTP_404_NOT_FOUND)

    if "document_id" in data:
        if data["document_id"]:
            try:
                affected_item.document = Document.objects.get(pk=data["document_id"])
            except Document.DoesNotExist:
                return Response("Document not found", status=status.HTTP_404_NOT_FOUND)

    if "description" in data:
        affected_item.description = data["description"]

    affected_item.save()

    # Update the ECO's last_updated timestamp
    affected_item.eco.save()

    serializer = AffectedItemDetailSerializer(affected_item)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("DELETE",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def delete_affected_item(request, pk):
    """Delete an affected item from an ECO."""
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    try:
        affected_item = AffectedItem.objects.get(pk=pk)
    except AffectedItem.DoesNotExist:
        return Response("Affected item not found", status=status.HTTP_404_NOT_FOUND)

    if affected_item.eco.release_state == "Released":
        return Response("Cannot modify a released ECO!", status=status.HTTP_400_BAD_REQUEST)

    # Store reference to ECO before deleting
    eco = affected_item.eco

    affected_item.delete()

    # Update the ECO's last_updated timestamp
    eco.save()

    return Response("Affected item deleted", status=status.HTTP_204_NO_CONTENT)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def get_affected_items(request, eco_id):
    """Get all affected items for an ECO."""
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    try:
        eco = Eco.objects.get(pk=eco_id)
    except Eco.DoesNotExist:
        return Response("ECO not found", status=status.HTTP_404_NOT_FOUND)

    affected_items = AffectedItem.objects.filter(eco=eco).order_by("created_at")
    serializer = AffectedItemDetailSerializer(affected_items, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def get_ecos_for_item(request, app, item_id):
    """Get all ECOs that reference a specific item (part/pcba/assembly/document).
    
    Args:
        app: One of 'parts', 'pcbas', 'assemblies', 'documents'
        item_id: The ID of the item
    
    Returns:
        List of ECOs with basic info and affected item count
    """
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    # Map app name to field name
    app_to_field = {
        'parts': 'part',
        'pcbas': 'pcba',
        'assemblies': 'assembly',
        'documents': 'document',
    }

    field_name = app_to_field.get(app)
    if not field_name:
        return Response(f"Invalid app type: {app}", status=status.HTTP_400_BAD_REQUEST)

    # Build filter for the specific item type
    filter_kwargs = {f'{field_name}_id': item_id}
    affected_items = AffectedItem.objects.filter(**filter_kwargs).select_related('eco')

    # Get unique ECOs
    ecos_data = []
    seen_eco_ids = set()
    
    for affected_item in affected_items:
        eco = affected_item.eco
        if eco.id not in seen_eco_ids:
            seen_eco_ids.add(eco.id)
            # Count total affected items for this ECO
            affected_count = AffectedItem.objects.filter(eco=eco).count()
            
            ecos_data.append({
                'id': eco.id,
                'display_name': eco.display_name,
                'release_state': eco.release_state,
                'description_text': eco.description.text if eco.description else '',
                'affected_items_count': affected_count,
                'created_at': eco.created_at,
                'last_updated': eco.last_updated,
            })

    return Response(ecos_data, status=status.HTTP_200_OK)