from rest_framework.decorators import api_view, renderer_classes
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.decorators import login_required
from rest_framework.renderers import JSONRenderer
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.db.models import Max
import re

from .serializers import Assembly_bomSerializer, BomItemSerializer
from django.db import transaction
from .models import Assembly_bom, Part, Pcba, Assembly, Bom_item
from profiles.views import check_user_auth_and_app_permission
from traceability.utilities import log_bom_change


def _bom_linked_item_display(bom_item):
    """Return full_part_number of linked part/pcba/assembly or empty string."""
    if bom_item.part_id and bom_item.part:
        return bom_item.part.full_part_number or ""
    if bom_item.pcba_id and bom_item.pcba:
        return bom_item.pcba.full_part_number or ""
    if bom_item.assembly_id and bom_item.assembly:
        return bom_item.assembly.full_part_number or ""
    return ""


def _bom_linked_display_by_ids(part_id, pcba_id, assembly_id):
    """Return full_part_number for given FK ids (after save, relations may not be loaded)."""
    if part_id:
        p = Part.objects.filter(pk=part_id).values_list("full_part_number", flat=True).first()
        return p or ""
    if pcba_id:
        p = Pcba.objects.filter(pk=pcba_id).values_list("full_part_number", flat=True).first()
        return p or ""
    if assembly_id:
        a = Assembly.objects.filter(pk=assembly_id).values_list("full_part_number", flat=True).first()
        return a or ""
    return ""


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_bom_items_by_asm_id(request, asm_id):
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    if asm_id is None or asm_id == -1:
        return Response("Invalid ASM id", status=status.HTTP_400_BAD_REQUEST)
    try:
        bom, created = Assembly_bom.objects.get_or_create(assembly_id=asm_id)

        if created:
            pass

        # Use prefetch_related to fetch related Bom_item instances and their related objects
        bom_items = Bom_item.objects.filter(bom=bom).select_related('part', 'pcba', 'assembly')
        serializer = BomItemSerializer(bom_items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"get_bom_items_by_asm_id failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_bom_items_by_pcba_id(request, pcba_id):
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    if pcba_id is None or pcba_id == -1:
        return Response("Invalid PCBA id", status=status.HTTP_400_BAD_REQUEST)

    try:
        # Get or create Assembly_bom instance
        bom, created = Assembly_bom.objects.get_or_create(pcba__id=pcba_id)
        if created:
            bom.pcba_id = pcba_id
            bom.save()

        # Query Bom_item instances related to the assembly
        bom_items = Bom_item.objects.filter(bom=bom)

        # Serialize the query set
        serializer = BomItemSerializer(bom_items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"get_bom_items_by_pcba_id failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


# Keys that only affect "temp" row state; edits to only these do not trigger traceability.
_TEMP_ONLY_KEYS = {"temporary_mpn", "temporary_manufacturer", "comment", "is_mounted"}


@api_view(["PUT"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def edit_bom_item(request, itemId):
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    bom_item = get_object_or_404(
        Bom_item.objects.select_related("part", "pcba", "assembly", "bom"),
        id=itemId,
    )

    try:
        data = request.data

        # Capture old state before applying changes
        old_designator = bom_item.designator
        old_quantity = bom_item.quantity
        old_part_id = bom_item.part_id
        old_pcba_id = bom_item.pcba_id
        old_assembly_id = bom_item.assembly_id
        old_linked_display = _bom_linked_item_display(bom_item)
        was_temp = not (old_part_id or old_pcba_id or old_assembly_id)

        if "part" in data:
            bom_item.part_id = data["part"]
            bom_item.pcba = None
            bom_item.assembly = None
        elif "pcba" in data:
            bom_item.pcba_id = data["pcba"]
            bom_item.part = None
            bom_item.assembly = None
        elif "assembly" in data:
            bom_item.assembly_id = data["assembly"]
            bom_item.part = None
            bom_item.pcba = None

        if "designator" in data:
            bom_item.designator = data["designator"]

        if "quantity" in data:
            quantity = float(data["quantity"])
            if quantity < 0:
                raise ValueError("Quantity must be a positive number")
            bom_item.quantity = quantity

        if "is_mounted" in data:
            bom_item.is_mounted = bool(data["is_mounted"])

        if "comment" in data:
            bom_item.comment = data["comment"]

        if "temporary_mpn" in data:
            bom_item.temporary_mpn = data["temporary_mpn"]

        if "temporary_manufacturer" in data:
            bom_item.temporary_manufacturer = data["temporary_manufacturer"]

        bom_item.save()

        # Skip traceability when only temp row fields were changed
        keys_changed = set(data.keys())
        if keys_changed <= _TEMP_ONLY_KEYS:
            serializer = BomItemSerializer(bom_item)
            return Response(serializer.data, status=status.HTTP_200_OK)

        bom = bom_item.bom
        app_type = None
        parent_id = None
        rev = None
        if bom.pcba_id:
            app_type = "pcbas"
            parent_id = bom.pcba_id
            rev = bom.pcba.formatted_revision or bom.pcba.revision
        elif bom.assembly_id:
            try:
                assembly = Assembly.objects.get(id=bom.assembly_id)
                app_type = "assemblies"
                parent_id = assembly.id
                rev = assembly.formatted_revision or assembly.revision
            except Assembly.DoesNotExist:
                pass

        if app_type and parent_id is not None:
            user = request.user

            if "designator" in data and (old_designator or data["designator"]) and old_designator != data.get("designator"):
                log_bom_change(
                    app_type=app_type,
                    item_id=parent_id,
                    user=user,
                    bom_id=bom.id,
                    revision=rev,
                    field_name="refdes",
                    old_value=old_designator or "",
                    new_value=data.get("designator", bom_item.designator) or "",
                )

            if "quantity" in data and old_quantity != bom_item.quantity:
                refdes = bom_item.designator or "—"
                log_bom_change(
                    app_type=app_type,
                    item_id=parent_id,
                    user=user,
                    bom_id=bom.id,
                    revision=rev,
                    field_name="quantity",
                    old_value=str(old_quantity),
                    new_value=str(bom_item.quantity),
                    refdes_for_quantity=refdes,
                )

            linked_changed = (
                "part" in data or "pcba" in data or "assembly" in data
            )
            if linked_changed:
                new_linked = _bom_linked_display_by_ids(
                    bom_item.part_id, bom_item.pcba_id, bom_item.assembly_id
                )
                if was_temp and new_linked:
                    log_bom_change(
                        app_type=app_type,
                        item_id=parent_id,
                        user=user,
                        bom_id=bom.id,
                        revision=rev,
                        field_name="add bom item",
                        old_value="",
                        new_value=f"{bom_item.designator or '—'} → {new_linked}",
                    )
                elif old_linked_display != new_linked:
                    log_bom_change(
                        app_type=app_type,
                        item_id=parent_id,
                        user=user,
                        bom_id=bom.id,
                        revision=rev,
                        field_name="change connected part/asm/pcba",
                        old_value=old_linked_display or "—",
                        new_value=new_linked or "—",
                    )

        serializer = BomItemSerializer(bom_item)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except ValueError as ve:
        return Response(str(ve), status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def remove_bom_item(request, itemId):
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    try:
        bom_item = Bom_item.objects.select_related("part", "pcba", "assembly").get(id=itemId)
    except Bom_item.DoesNotExist:
        return Response("Item not found", status=status.HTTP_404_NOT_FOUND)

    try:
        bom = bom_item.bom
        designator = bom_item.designator or ""
        linked_display = _bom_linked_item_display(bom_item)
        old_value = f"{designator}" + (f" → {linked_display}" if linked_display else "")

        if bom.pcba_id:
            log_bom_change(
                app_type="pcbas",
                item_id=bom.pcba_id,
                user=request.user,
                bom_id=bom.id,
                revision=bom.pcba.formatted_revision or bom.pcba.revision,
                field_name="remove bom item",
                old_value=old_value,
                new_value="",
            )
        elif bom.assembly_id:
            try:
                assembly = Assembly.objects.get(id=bom.assembly_id)
                log_bom_change(
                    app_type="assemblies",
                    item_id=assembly.id,
                    user=request.user,
                    bom_id=bom.id,
                    revision=assembly.formatted_revision or assembly.revision,
                    field_name="remove bom item",
                    old_value=old_value,
                    new_value="",
                )
            except Assembly.DoesNotExist:
                pass

        bom_item.delete()
        return Response(status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def clear_bomb_items(request, bomId):
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    try:
        bom = get_object_or_404(Assembly_bom.objects.select_related("pcba"), id=bomId)
        bom_items = list(
            Bom_item.objects.filter(bom_id=bomId).select_related("part", "pcba", "assembly")
        )
        app_type = None
        parent_id = None
        rev = None
        if bom.pcba_id:
            app_type = "pcbas"
            parent_id = bom.pcba_id
            rev = bom.pcba.formatted_revision or bom.pcba.revision
        elif bom.assembly_id:
            try:
                asm = Assembly.objects.get(id=bom.assembly_id)
                app_type = "assemblies"
                parent_id = asm.id
                rev = asm.formatted_revision or asm.revision
            except Assembly.DoesNotExist:
                pass
        for bom_item in bom_items:
            designator = bom_item.designator or ""
            linked_display = _bom_linked_item_display(bom_item)
            old_value = f"{designator}" + (f" → {linked_display}" if linked_display else "")
            if app_type and parent_id is not None:
                log_bom_change(
                    app_type=app_type,
                    item_id=parent_id,
                    user=request.user,
                    bom_id=bom.id,
                    revision=rev,
                    field_name="clear bom",
                    old_value=old_value,
                    new_value="",
                    event_type="bom_cleared",
                )
        Bom_item.objects.filter(bom_id=bomId).delete()
        return Response(status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@renderer_classes([JSONRenderer])
@login_required(login_url='/login')
def add_bom_item(request, bomId):
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    try:
        # Retrieve all Bom_item objects tied to the specified BOM
        bom_items = Bom_item.objects.filter(bom_id=bomId)

        # Filter items with purely numeric designators
        numeric_designators = [
            int(item.designator) for item in bom_items if item.designator.isdigit()
        ]

        # Find the highest existing numeric designator
        max_designator = max(numeric_designators, default=0)

        # Create new Bom_item with the next designator
        new_designator = str(max_designator + 1)
        new_bom_item = Bom_item(bom_id=bomId, designator=new_designator)

        new_bom_item.save()

        # Temp row (no part/pcba/assembly) — do not log traceability

        serializer = BomItemSerializer(new_bom_item)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def add_bom_item_with_contents(request, bomId):
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    try:
        def get_data(data, key, default=None):
            value = data.get(key, default)
            return default if value == "N/A" else value

        # Parse the updated data from the request
        data = request.data

        # Create a new Bom_item instance with the provided details
        new_bom_item = Bom_item.objects.create(
            bom_id=bomId,
            designator=get_data(data, "designator", ""),
            quantity=get_data(data, "quantity", 0),
            temporary_mpn=get_data(data, "temporary_mpn", None),
            is_mounted=get_data(data, "is_mounted", True),
        )

        # Temp row (no part/pcba/assembly linked yet) — do not log traceability

        # Serialize the newly created Bom_item instance
        serializer = BomItemSerializer(new_bom_item)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except ValueError as ve:
        return Response(str(ve), status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            f"add_bom_item_with_contents failed: {e}",
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
def match_bom_items_with_parts(request, bomId):
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    try:
        bom_items = Bom_item.objects.filter(bom_id=bomId)

        for bom_item in bom_items:
            # if part is already matched, skip
            if bom_item.part or bom_item.assembly or bom_item.pcba:
                continue

            if bom_item.temporary_mpn is None:
                continue

            # Extract the full part number and revision
            full_part_number_with_revision = bom_item.temporary_mpn
            print("Warning: `match_bom_items_with_parts` The regex pattern may not match all revision formats.")

            revision = full_part_number_with_revision[-1]  # Last letter is revision #TODO this is no longer valid for all the custom revision formats
            full_part_number = full_part_number_with_revision[:-1]

            # Attempt to match with Part
            part_match = Part.objects.filter(
                full_part_number=full_part_number, revision=revision
            ).first()

            # Attempt to match with Assembly if no Part match
            assembly_match = (
                Assembly.objects.filter(
                    full_part_number=full_part_number, revision=revision
                ).first()
                if not part_match
                else None
            )

            # Attempt to match with Pcba if no Assembly match
            pcba_match = (
                Pcba.objects.filter(
                    full_part_number=full_part_number, revision=revision
                ).first()
                if not assembly_match
                else None
            )

            part_match_latest = None
            # If no match found yet, try to find a Part with is_latest_revision=True
            if not part_match and not assembly_match and not pcba_match:
                part_match_latest = Part.objects.filter(
                    mpn=bom_item.temporary_mpn, is_latest_revision=True
                ).first()
                if part_match_latest:
                    bom_item.part = part_match_latest
            else:
                # Update bom_item with the first match found
                if part_match:
                    bom_item.part = part_match
                elif assembly_match:
                    bom_item.assembly = assembly_match
                elif pcba_match:
                    bom_item.pcba = pcba_match

            # Save changes if there's a match; log "add bom item" (temp → actual)
            if part_match or assembly_match or pcba_match or part_match_latest:
                bom_item.save()
                part_or_latest = part_match or part_match_latest
                if part_or_latest:
                    linked = part_or_latest.full_part_number or ""
                elif assembly_match:
                    linked = assembly_match.full_part_number or ""
                elif pcba_match:
                    linked = pcba_match.full_part_number or ""
                else:
                    linked = ""
                bom = bom_item.bom
                app_type = None
                parent_id = None
                rev = None
                if bom.pcba_id:
                    app_type = "pcbas"
                    parent_id = bom.pcba_id
                    rev = bom.pcba.formatted_revision or bom.pcba.revision
                elif bom.assembly_id:
                    try:
                        asm = Assembly.objects.get(id=bom.assembly_id)
                        app_type = "assemblies"
                        parent_id = asm.id
                        rev = asm.formatted_revision or asm.revision
                    except Assembly.DoesNotExist:
                        pass
                if app_type and parent_id is not None:
                    log_bom_change(
                        app_type=app_type,
                        item_id=parent_id,
                        user=request.user,
                        bom_id=bom.id,
                        revision=rev,
                        field_name="bom import",
                        old_value="",
                        new_value=f"{bom_item.designator or '—'} → {linked or ''}",
                        event_type="bom_imported",
                    )

        # Serialize and return the updated bom_items
        serializer = BomItemSerializer(bom_items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"match_bom_items_with_parts failed: {e}",
            status=status.HTTP_400_BAD_REQUEST,
        )
