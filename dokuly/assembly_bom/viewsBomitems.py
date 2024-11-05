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


@api_view(["PUT"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def edit_bom_item(request, itemId):
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    bom_item = get_object_or_404(Bom_item, id=itemId)

    try:
        # Parse the updated data from the request
        data = request.data

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

        # Update fields with validation checks
        if "designator" in data:
            # Apply any specific validation for 'designator' if needed
            bom_item.designator = data["designator"]

        if "quantity" in data:
            # Ensure quantity is a positive integer
            quantity = float(data["quantity"])
            if quantity < 0:
                raise ValueError("Quantity must be a positive number")
            bom_item.quantity = quantity

        if "is_mounted" in data:
            # Validate is_mounted to be a boolean
            bom_item.is_mounted = bool(data["is_mounted"])

        if "comment" in data:
            bom_item.comment = data["comment"]

        if "temporary_mpn" in data:
            bom_item.temporary_mpn = data["temporary_mpn"]

        if "temporary_manufacturer" in data:
            bom_item.temporary_manufacturer = data["temporary_manufacturer"]

        bom_item.save()

        # Serialize the updated object
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
        bom_item = Bom_item.objects.get(id=itemId)
    except Bom_item.DoesNotExist:
        return Response("Item not found", status=status.HTTP_404_NOT_FOUND)

    try:
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
        bom_items = Bom_item.objects.filter(bom_id=bomId)
        bom_items.delete()
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
            revision = full_part_number_with_revision[-1]  # Last letter is revision
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

            # Save changes if there's a match
            if part_match or assembly_match or pcba_match or part_match_latest:
                bom_item.save()

        # Serialize and return the updated bom_items
        serializer = BomItemSerializer(bom_items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"match_bom_items_with_parts failed: {e}",
            status=status.HTTP_400_BAD_REQUEST,
        )
