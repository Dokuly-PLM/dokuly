from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import Q
from datetime import datetime

from .models import Eco, AffectedItem
from .serializers import EcoSerializer, AffectedItemSerializer, AffectedItemDetailSerializer, IssuePillSerializer
from profiles.views import check_user_auth_and_app_permission
from profiles.models import Profile
from documents.models import MarkdownText, Document
from parts.models import Part
from pcbas.models import Pcba
from assemblies.models import Assembly
from projects.models import Project, Tag
from projects.issuesModel import Issues
from projects.viewsTags import check_for_and_create_new_tags
from assembly_bom.models import Assembly_bom, Bom_item


def get_eco_missing_bom_items(eco):
    """
    Get all BOM items from affected assemblies/PCBAs that are:
    1. NOT released
    2. NOT included in the ECO
    
    Args:
        eco: Eco object
        
    Returns:
        list: List of missing BOM items with details
    """
    # Get all affected items in this ECO
    affected_items = AffectedItem.objects.filter(eco=eco)
    
    # Build sets of part/pcba/assembly IDs that are included in the ECO
    eco_part_ids = set()
    eco_pcba_ids = set()
    eco_assembly_ids = set()
    
    for item in affected_items:
        if item.part_id:
            eco_part_ids.add(item.part_id)
        if item.pcba_id:
            eco_pcba_ids.add(item.pcba_id)
        if item.assembly_id:
            eco_assembly_ids.add(item.assembly_id)
    
    missing_items = []
    seen_items = set()  # To avoid duplicates
    
    # Check BOM items for affected assemblies
    for item in affected_items:
        if item.assembly_id:
            try:
                assembly_bom = Assembly_bom.objects.get(assembly_id=item.assembly_id)
                bom_items = Bom_item.objects.filter(bom=assembly_bom).select_related('part', 'pcba', 'assembly')
                
                for bom_item in bom_items:
                    # Check if BOM item is released or in ECO
                    if bom_item.part:
                        item_key = ('part', bom_item.part_id)
                        if item_key not in seen_items:
                            if bom_item.part.release_state != 'Released' and bom_item.part_id not in eco_part_ids:
                                seen_items.add(item_key)
                                missing_items.append({
                                    'type': 'Part',
                                    'id': bom_item.part_id,
                                    'full_part_number': bom_item.part.full_part_number,
                                    'display_name': bom_item.part.display_name,
                                    'release_state': bom_item.part.release_state,
                                    'thumbnail_id': bom_item.part.thumbnail_id,
                                    'parent_type': 'Assembly',
                                    'parent_part_number': item.assembly.full_part_number if item.assembly else '-',
                                })
                    elif bom_item.pcba:
                        item_key = ('pcba', bom_item.pcba_id)
                        if item_key not in seen_items:
                            if bom_item.pcba.release_state != 'Released' and bom_item.pcba_id not in eco_pcba_ids:
                                seen_items.add(item_key)
                                missing_items.append({
                                    'type': 'PCBA',
                                    'id': bom_item.pcba_id,
                                    'full_part_number': bom_item.pcba.full_part_number,
                                    'display_name': bom_item.pcba.display_name,
                                    'release_state': bom_item.pcba.release_state,
                                    'thumbnail_id': bom_item.pcba.thumbnail_id,
                                    'parent_type': 'Assembly',
                                    'parent_part_number': item.assembly.full_part_number if item.assembly else '-',
                                })
                    elif bom_item.assembly:
                        item_key = ('assembly', bom_item.assembly_id)
                        if item_key not in seen_items:
                            if bom_item.assembly.release_state != 'Released' and bom_item.assembly_id not in eco_assembly_ids:
                                seen_items.add(item_key)
                                missing_items.append({
                                    'type': 'Assembly',
                                    'id': bom_item.assembly_id,
                                    'full_part_number': bom_item.assembly.full_part_number,
                                    'display_name': bom_item.assembly.display_name,
                                    'release_state': bom_item.assembly.release_state,
                                    'thumbnail_id': bom_item.assembly.thumbnail_id,
                                    'parent_type': 'Assembly',
                                    'parent_part_number': item.assembly.full_part_number if item.assembly else '-',
                                })
            except Assembly_bom.DoesNotExist:
                pass
        
        # Check BOM items for affected PCBAs
        if item.pcba_id:
            try:
                pcba_bom = Assembly_bom.objects.get(pcba_id=item.pcba_id)
                bom_items = Bom_item.objects.filter(bom=pcba_bom).select_related('part', 'pcba', 'assembly')
                
                for bom_item in bom_items:
                    # Check if BOM item is released or in ECO
                    if bom_item.part:
                        item_key = ('part', bom_item.part_id)
                        if item_key not in seen_items:
                            if bom_item.part.release_state != 'Released' and bom_item.part_id not in eco_part_ids:
                                seen_items.add(item_key)
                                missing_items.append({
                                    'type': 'Part',
                                    'id': bom_item.part_id,
                                    'full_part_number': bom_item.part.full_part_number,
                                    'display_name': bom_item.part.display_name,
                                    'release_state': bom_item.part.release_state,
                                    'thumbnail_id': bom_item.part.thumbnail_id,
                                    'parent_type': 'PCBA',
                                    'parent_part_number': item.pcba.full_part_number if item.pcba else '-',
                                })
                    elif bom_item.pcba:
                        item_key = ('pcba', bom_item.pcba_id)
                        if item_key not in seen_items:
                            if bom_item.pcba.release_state != 'Released' and bom_item.pcba_id not in eco_pcba_ids:
                                seen_items.add(item_key)
                                missing_items.append({
                                    'type': 'PCBA',
                                    'id': bom_item.pcba_id,
                                    'full_part_number': bom_item.pcba.full_part_number,
                                    'display_name': bom_item.pcba.display_name,
                                    'release_state': bom_item.pcba.release_state,
                                    'thumbnail_id': bom_item.pcba.thumbnail_id,
                                    'parent_type': 'PCBA',
                                    'parent_part_number': item.pcba.full_part_number if item.pcba else '-',
                                })
                    elif bom_item.assembly:
                        item_key = ('assembly', bom_item.assembly_id)
                        if item_key not in seen_items:
                            if bom_item.assembly.release_state != 'Released' and bom_item.assembly_id not in eco_assembly_ids:
                                seen_items.add(item_key)
                                missing_items.append({
                                    'type': 'Assembly',
                                    'id': bom_item.assembly_id,
                                    'full_part_number': bom_item.assembly.full_part_number,
                                    'display_name': bom_item.assembly.display_name,
                                    'release_state': bom_item.assembly.release_state,
                                    'thumbnail_id': bom_item.assembly.thumbnail_id,
                                    'parent_type': 'PCBA',
                                    'parent_part_number': item.pcba.full_part_number if item.pcba else '-',
                                })
            except Assembly_bom.DoesNotExist:
                pass
    
    return missing_items


def release_affected_items(eco, released_by):
    """
    Release all affected items linked to an ECO.
    
    When an ECO is released, all parts/pcbas/assemblies/documents that are
    affected by it should be released as well (if not already released).
    
    Args:
        eco: The ECO that was just released
        released_by: The user who released the ECO
        
    Returns:
        dict: Summary of released items with counts and any errors
    """
    results = {
        'parts_released': 0,
        'pcbas_released': 0,
        'assemblies_released': 0,
        'documents_released': 0,
        'already_released': 0,
        'errors': []
    }
    
    affected_items = AffectedItem.objects.filter(eco=eco)
    release_date = datetime.now()
    
    for affected_item in affected_items:
        try:
            # Release Part
            if affected_item.part:
                part = affected_item.part
                if part.release_state != "Released":
                    part.release_state = "Released"
                    part.released_date = release_date
                    part.save()
                    results['parts_released'] += 1
                else:
                    results['already_released'] += 1
                    
            # Release PCBA
            elif affected_item.pcba:
                pcba = affected_item.pcba
                if pcba.release_state != "Released":
                    pcba.release_state = "Released"
                    pcba.released_date = release_date
                    pcba.save()
                    results['pcbas_released'] += 1
                else:
                    results['already_released'] += 1
                    
            # Release Assembly
            elif affected_item.assembly:
                assembly = affected_item.assembly
                if assembly.release_state != "Released":
                    assembly.release_state = "Released"
                    assembly.released_date = release_date
                    assembly.save()
                    results['assemblies_released'] += 1
                else:
                    results['already_released'] += 1
                    
            # Release Document
            elif affected_item.document:
                document = affected_item.document
                if document.release_state != "Released":
                    document.release_state = "Released"
                    document.released_date = release_date
                    document.save()
                    results['documents_released'] += 1
                else:
                    results['already_released'] += 1
                    
        except Exception as e:
            results['errors'].append(f"Error releasing affected item {affected_item.id}: {str(e)}")
    
    return results


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
            
            # Batch release all affected items when ECO is released
            eco.save()  # Save first to ensure ECO is released
            release_results = release_affected_items(eco, request.user)
            
            # Include release results in the response
            serializer = EcoSerializer(eco)
            response_data = serializer.data
            response_data['release_results'] = release_results

            return Response(response_data, status=status.HTTP_200_OK)

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
    item_changed = False

    # Clear all item references first when setting a new one
    if "part_id" in data or "pcba_id" in data or "assembly_id" in data or "document_id" in data:
        affected_item.part = None
        affected_item.pcba = None
        affected_item.assembly = None
        affected_item.document = None
        item_changed = True

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

    # Auto-attach issues when an item is newly linked
    if item_changed:
        affected_item.issues.clear()
        linked_item = affected_item.part or affected_item.pcba or affected_item.assembly or affected_item.document
        if linked_item:
            app_field_map = {
                Part: "parts_issues",
                Pcba: "pcbas_issues",
                Assembly: "assemblies_issues",
                Document: "documents_issues",
            }
            field_name = app_field_map.get(type(linked_item))
            if field_name:
                issues = getattr(linked_item, field_name).all()
                affected_item.issues.set(issues)

    # Update the ECO's last_updated timestamp
    affected_item.eco.save()

    serializer = AffectedItemDetailSerializer(affected_item)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def add_issue_to_affected_item(request, pk):
    """Add an issue to an affected item."""
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    try:
        affected_item = AffectedItem.objects.get(pk=pk)
    except AffectedItem.DoesNotExist:
        return Response("Affected item not found", status=status.HTTP_404_NOT_FOUND)

    if affected_item.eco.release_state == "Released":
        return Response("Cannot modify a released ECO!", status=status.HTTP_400_BAD_REQUEST)

    issue_id = request.data.get("issue_id")
    if not issue_id:
        return Response("issue_id is required", status=status.HTTP_400_BAD_REQUEST)

    try:
        issue = Issues.objects.get(pk=issue_id)
    except Issues.DoesNotExist:
        return Response("Issue not found", status=status.HTTP_404_NOT_FOUND)

    affected_item.issues.add(issue)
    affected_item.eco.save()

    serializer = AffectedItemDetailSerializer(affected_item)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def remove_issue_from_affected_item(request, pk):
    """Remove an issue from an affected item."""
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    try:
        affected_item = AffectedItem.objects.get(pk=pk)
    except AffectedItem.DoesNotExist:
        return Response("Affected item not found", status=status.HTTP_404_NOT_FOUND)

    if affected_item.eco.release_state == "Released":
        return Response("Cannot modify a released ECO!", status=status.HTTP_400_BAD_REQUEST)

    issue_id = request.data.get("issue_id")
    if not issue_id:
        return Response("issue_id is required", status=status.HTTP_400_BAD_REQUEST)

    affected_item.issues.remove(issue_id)
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


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def get_eco_missing_bom_items_api(request, eco_id):
    """Get BOM items from affected assemblies/PCBAs that are not released and not in the ECO.
    
    This endpoint is used to display a warning pill in the ECO info card.
    
    Args:
        eco_id: The ID of the ECO
    
    Returns:
        List of missing BOM items with details
    """
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    try:
        eco = Eco.objects.get(pk=eco_id)
    except Eco.DoesNotExist:
        return Response("ECO not found", status=status.HTTP_404_NOT_FOUND)

    missing_items = get_eco_missing_bom_items(eco)
    
    return Response({
        'missing_items': missing_items,
        'count': len(missing_items),
    }, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def search_issues(request):
    """Search issues by ID or title for adding to affected items."""
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    query = request.GET.get("q", "").strip()
    if not query:
        return Response([], status=status.HTTP_200_OK)

    results = Issues.objects.none()

    # Search by issue ID if query is numeric
    if query.lstrip("#").isdigit():
        issue_id = int(query.lstrip("#"))
        results = Issues.objects.filter(pk=issue_id)
    else:
        # Search by title
        results = Issues.objects.filter(title__icontains=query)[:20]

    serializer = IssuePillSerializer(results, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def get_ecos_for_issue(request, issue_id):
    """Get all ECOs that reference a specific issue via affected items."""
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    affected_items = AffectedItem.objects.filter(issues__id=issue_id).select_related('eco')

    ecos_data = []
    seen_eco_ids = set()

    for affected_item in affected_items:
        eco = affected_item.eco
        if eco.id not in seen_eco_ids:
            seen_eco_ids.add(eco.id)
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


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_downstream_impact(request, eco_id):
    """
    For each affected item in an ECO, find all downstream items (where-used)
    across current and prior revisions of the affected item's part number line.
    Only returns the latest revision of each downstream parent.
    Excludes downstream parents whose latest revision no longer references
    any current/prior revision of the affected item's part number line.
    Excludes items already in the ECO's affected items list.
    """
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    try:
        eco = Eco.objects.get(id=eco_id)
    except Eco.DoesNotExist:
        return Response("ECO not found", status=status.HTTP_404_NOT_FOUND)

    affected_items = AffectedItem.objects.filter(eco=eco).select_related(
        'part', 'pcba', 'assembly'
    )

    # Build sets of item IDs already in the ECO (by part_number to cover all revisions)
    eco_assembly_pns = set()
    eco_pcba_pns = set()
    for ai in affected_items:
        if ai.assembly_id and ai.assembly:
            eco_assembly_pns.add(ai.assembly.part_number)
        if ai.pcba_id and ai.pcba:
            eco_pcba_pns.add(ai.pcba.part_number)

    # ── Phase 1: Classify affected items and collect revision IDs ──
    # One query per item type (parts/pcbas/assemblies) instead of per item.
    items_by_type = {"parts": [], "pcbas": [], "assemblies": []}
    for ai in affected_items:
        linked = ai.part or ai.pcba or ai.assembly
        if not linked:
            continue
        if ai.part_id:
            items_by_type["parts"].append((ai, linked))
        elif ai.pcba_id:
            items_by_type["pcbas"].append((ai, linked))
        elif ai.assembly_id:
            items_by_type["assemblies"].append((ai, linked))

    # Build per-affected-item data: all_rev_ids and part_number
    # Uses one bulk query per type instead of per-item queries.
    affected_data = []  # list of (ai, linked, app, part_number, all_rev_ids)

    for app, model_cls, pn_field in [
        ("parts", Part, "part_id"),
        ("pcbas", Pcba, "pcba_id"),
        ("assemblies", Assembly, "assembly_id"),
    ]:
        items = items_by_type[app]
        if not items:
            continue
        # Collect all part_numbers and their revision ceilings
        pn_rev_map = {}  # part_number -> (major, minor, ai, linked)
        for ai, linked in items:
            major = getattr(linked, 'revision_count_major', None) or 0
            minor = getattr(linked, 'revision_count_minor', None) or 0
            pn_rev_map.setdefault(linked.part_number, []).append(
                (major, minor, ai, linked)
            )

        # Bulk fetch all revisions for all part_numbers in this type
        all_pns = set(pn_rev_map.keys())
        all_objects = model_cls.objects.filter(part_number__in=all_pns).values_list(
            'id', 'part_number', 'revision_count_major', 'revision_count_minor'
        )
        # Group by part_number
        pn_to_revisions = {}
        for obj_id, pn, rmaj, rmin in all_objects:
            pn_to_revisions.setdefault(pn, []).append((obj_id, rmaj or 0, rmin or 0))

        for pn, entries in pn_rev_map.items():
            for major, minor, ai, linked in entries:
                rev_ids = set()
                for obj_id, rmaj, rmin in pn_to_revisions.get(pn, []):
                    if rmaj < major or (rmaj == major and rmin <= minor):
                        rev_ids.add(obj_id)
                if rev_ids:
                    affected_data.append((ai, linked, app, pn, rev_ids))

    if not affected_data:
        return Response([], status=status.HTTP_200_OK)

    # ── Phase 2: Find all BOMs containing any revision of affected items ──
    # One query per type to get bom_ids
    all_part_rev_ids = set()
    all_pcba_rev_ids = set()
    all_asm_rev_ids = set()
    for _, _, app, _, rev_ids in affected_data:
        if app == "parts":
            all_part_rev_ids |= rev_ids
        elif app == "pcbas":
            all_pcba_rev_ids |= rev_ids
        elif app == "assemblies":
            all_asm_rev_ids |= rev_ids

    # Map: bom_item FK value -> set of bom_ids (one query per FK type)
    bom_ids_by_part = {}
    bom_ids_by_pcba = {}
    bom_ids_by_asm = {}

    if all_part_rev_ids:
        for part_id, bom_id in Bom_item.objects.filter(
            part_id__in=all_part_rev_ids
        ).values_list('part_id', 'bom_id'):
            bom_ids_by_part.setdefault(part_id, set()).add(bom_id)

    if all_pcba_rev_ids:
        for pcba_id, bom_id in Bom_item.objects.filter(
            pcba_id__in=all_pcba_rev_ids
        ).values_list('pcba_id', 'bom_id'):
            bom_ids_by_pcba.setdefault(pcba_id, set()).add(bom_id)

    if all_asm_rev_ids:
        for asm_id, bom_id in Bom_item.objects.filter(
            assembly_id__in=all_asm_rev_ids
        ).values_list('assembly_id', 'bom_id'):
            bom_ids_by_asm.setdefault(asm_id, set()).add(bom_id)

    # Collect all bom_ids across all affected items
    every_bom_id = set()
    for _, _, app, _, rev_ids in affected_data:
        lookup = {"parts": bom_ids_by_part, "pcbas": bom_ids_by_pcba, "assemblies": bom_ids_by_asm}[app]
        for rid in rev_ids:
            every_bom_id |= lookup.get(rid, set())

    # ── Phase 3: Bulk fetch all BOMs and their parent references ──
    bom_parent_map = {}  # bom_id -> (assembly_id, pcba_id)
    if every_bom_id:
        for bom_id, asm_id, pcba_id in Assembly_bom.objects.filter(
            id__in=every_bom_id
        ).values_list('id', 'assembly_id', 'pcba_id'):
            bom_parent_map[bom_id] = (asm_id, pcba_id)

    # Bulk fetch parent part_numbers (one query per type)
    parent_asm_ids = {asm_id for asm_id, _ in bom_parent_map.values() if asm_id}
    parent_pcba_ids = {pcba_id for _, pcba_id in bom_parent_map.values() if pcba_id}

    asm_id_to_pn = {}
    if parent_asm_ids:
        asm_id_to_pn = dict(
            Assembly.objects.filter(id__in=parent_asm_ids).values_list('id', 'part_number')
        )

    pcba_id_to_pn = {}
    if parent_pcba_ids:
        pcba_id_to_pn = dict(
            Pcba.objects.filter(id__in=parent_pcba_ids).values_list('id', 'part_number')
        )

    # ── Phase 4: Bulk fetch all candidate latest revisions ──
    candidate_asm_pns = set(asm_id_to_pn.values()) - eco_assembly_pns
    candidate_pcba_pns = set(pcba_id_to_pn.values()) - eco_pcba_pns

    latest_asm_by_pn = {}
    if candidate_asm_pns:
        for asm in Assembly.objects.filter(
            part_number__in=candidate_asm_pns, is_latest_revision=True
        ):
            latest_asm_by_pn[asm.part_number] = asm

    latest_pcba_by_pn = {}
    if candidate_pcba_pns:
        for pcba in Pcba.objects.filter(
            part_number__in=candidate_pcba_pns, is_latest_revision=True
        ):
            latest_pcba_by_pn[pcba.part_number] = pcba

    # ── Phase 5: Bulk fetch BOMs for all latest parents ──
    latest_asm_ids = [a.id for a in latest_asm_by_pn.values()]
    latest_pcba_ids = [p.id for p in latest_pcba_by_pn.values()]

    latest_bom_by_asm_id = {}
    if latest_asm_ids:
        for bom in Assembly_bom.objects.filter(assembly_id__in=latest_asm_ids):
            latest_bom_by_asm_id[bom.assembly_id] = bom

    latest_bom_by_pcba_id = {}
    if latest_pcba_ids:
        for bom in Assembly_bom.objects.filter(pcba_id__in=latest_pcba_ids):
            latest_bom_by_pcba_id[bom.pcba_id] = bom

    # ── Phase 6: Bulk check still-used across all latest BOMs ──
    all_latest_bom_ids = (
        {b.id for b in latest_bom_by_asm_id.values()}
        | {b.id for b in latest_bom_by_pcba_id.values()}
    )

    # For each (bom_id, FK_id) pair that exists, record it
    # so we can check per-affected-item whether "still used"
    still_used_part = set()  # (bom_id, part_id)
    still_used_pcba = set()  # (bom_id, pcba_id)
    still_used_asm = set()   # (bom_id, assembly_id)

    if all_latest_bom_ids and all_part_rev_ids:
        for bom_id, part_id in Bom_item.objects.filter(
            bom_id__in=all_latest_bom_ids, part_id__in=all_part_rev_ids
        ).values_list('bom_id', 'part_id'):
            still_used_part.add((bom_id, part_id))

    if all_latest_bom_ids and all_pcba_rev_ids:
        for bom_id, pcba_id in Bom_item.objects.filter(
            bom_id__in=all_latest_bom_ids, pcba_id__in=all_pcba_rev_ids
        ).values_list('bom_id', 'pcba_id'):
            still_used_pcba.add((bom_id, pcba_id))

    if all_latest_bom_ids and all_asm_rev_ids:
        for bom_id, asm_id in Bom_item.objects.filter(
            bom_id__in=all_latest_bom_ids, assembly_id__in=all_asm_rev_ids
        ).values_list('bom_id', 'assembly_id'):
            still_used_asm.add((bom_id, asm_id))

    # ── Phase 7: Assemble results per affected item (no queries) ──
    result = []

    for ai, linked, app, part_number, rev_ids in affected_data:
        # Determine which bom_ids contain this affected item's revisions
        lookup = {"parts": bom_ids_by_part, "pcbas": bom_ids_by_pcba, "assemblies": bom_ids_by_asm}[app]
        item_bom_ids = set()
        for rid in rev_ids:
            item_bom_ids |= lookup.get(rid, set())

        if not item_bom_ids:
            continue

        # Resolve parent part_numbers from cached bom data
        parent_asm_pns = set()
        parent_pcba_pns = set()
        for bid in item_bom_ids:
            parent = bom_parent_map.get(bid)
            if not parent:
                continue
            asm_id, pcba_id = parent
            if asm_id:
                pn = asm_id_to_pn.get(asm_id)
                if pn and not (app == "assemblies" and pn == part_number):
                    parent_asm_pns.add(pn)
            elif pcba_id:
                pn = pcba_id_to_pn.get(pcba_id)
                if pn and not (app == "pcbas" and pn == part_number):
                    parent_pcba_pns.add(pn)

        # Filter out ECO items
        parent_asm_pns -= eco_assembly_pns
        parent_pcba_pns -= eco_pcba_pns

        # Check still-used against pre-fetched data
        still_used_lookup = {"parts": still_used_part, "pcbas": still_used_pcba, "assemblies": still_used_asm}[app]

        downstream_items = []
        seen = set()

        for pn in parent_asm_pns:
            latest = latest_asm_by_pn.get(pn)
            if not latest:
                continue
            bom = latest_bom_by_asm_id.get(latest.id)
            if not bom:
                continue
            if any((bom.id, rid) in still_used_lookup for rid in rev_ids):
                key = ("assembly", latest.id)
                if key not in seen:
                    seen.add(key)
                    downstream_items.append({
                        "item_type": "assembly",
                        "id": latest.id,
                        "full_part_number": latest.full_part_number,
                        "display_name": latest.display_name,
                        "release_state": latest.release_state,
                        "is_latest_revision": latest.is_latest_revision,
                        "thumbnail": latest.thumbnail_id,
                    })

        for pn in parent_pcba_pns:
            latest = latest_pcba_by_pn.get(pn)
            if not latest:
                continue
            bom = latest_bom_by_pcba_id.get(latest.id)
            if not bom:
                continue
            if any((bom.id, rid) in still_used_lookup for rid in rev_ids):
                key = ("pcba", latest.id)
                if key not in seen:
                    seen.add(key)
                    downstream_items.append({
                        "item_type": "pcba",
                        "id": latest.id,
                        "full_part_number": latest.full_part_number,
                        "display_name": latest.display_name,
                        "release_state": latest.release_state,
                        "is_latest_revision": latest.is_latest_revision,
                        "thumbnail": latest.thumbnail_id,
                    })

        if downstream_items:
            affected_info = {
                "full_part_number": getattr(linked, 'full_part_number', '') or getattr(linked, 'full_doc_number', ''),
                "display_name": getattr(linked, 'display_name', ''),
                "item_type": app,
                "id": linked.id,
                "thumbnail": getattr(linked, 'thumbnail_id', None),
            }
            result.append({
                "affected_item": affected_info,
                "downstream": downstream_items,
            })

    return Response(result, status=status.HTTP_200_OK)