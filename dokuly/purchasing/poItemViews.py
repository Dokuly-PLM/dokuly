# views.py
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.decorators import login_required
from rest_framework.renderers import JSONRenderer
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from decimal import Decimal
from django.db.models import F, Sum, DecimalField


from .serializers import PoItemSerializer
from .models import PurchaseOrder, PoItem
from profiles.views import check_user_auth_and_app_permission
from parts.models import Part
from pcbas.models import Pcba
from assemblies.models import Assembly


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_po_items_by_po_id(request, po_id):
    permission, response = check_user_auth_and_app_permission(request, "procurement")
    if not permission:
        return response

    if po_id is None or po_id == -1:
        return Response("Invalid PO id", status=status.HTTP_400_BAD_REQUEST)
    try:
        # Use select_related to fetch related PurchaseOrder instance
        po, created = PurchaseOrder.objects.get_or_create(id=po_id)

        # Use prefetch_related to fetch related PoItem instances and their related objects
        po_items = PoItem.objects.filter(po=po).select_related('part', 'pcba', 'assembly')

        # Serialize the query set
        serializer = PoItemSerializer(po_items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"get_po_items_by_po_id failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


def calculate_po_cost(purchase_order):
    """Funciton to calculate the total cost of a purchase order.
    Should be called from vews that affect the cost of a PO."""
    total_item_price = purchase_order.poitem_set.aggregate(
        total=Sum(F('price') * F('quantity'), output_field=DecimalField())
    )['total'] or Decimal(0)

    shipping_cost = Decimal(purchase_order.shipping_cost or 0)

    total_price = total_item_price + shipping_cost

    # Update the PO's total price
    purchase_order.total_price = total_price
    purchase_order.save()


@api_view(["PUT"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def edit_po_item(request, itemId):
    permission, response = check_user_auth_and_app_permission(request, "procurement")
    if not permission:
        return response

    po_item = get_object_or_404(PoItem, id=itemId)

    try:
        # Parse the updated data from the request
        data = request.data

        if "part" in data:
            po_item.part_id = data["part"]
            po_item.pcba = None
            po_item.assembly = None
        elif "pcba" in data:
            po_item.pcba_id = data["pcba"]
            po_item.part = None
            po_item.assembly = None
        elif "assembly" in data:
            po_item.assembly_id = data["assembly"]
            po_item.part = None
            po_item.pcba = None

        # Update fields with validation checks
        if "quantity" in data:
            quantity = float(data["quantity"])
            if quantity < 0:
                raise ValueError("Quantity must be a positive number")
            po_item.quantity = quantity

        if "price" in data:
            price = Decimal(data["price"])
            if price < 0:
                raise ValueError("Price must be a positive number")
            po_item.price = price

        if "comment" in data:
            po_item.comment = data["comment"]

        if "designator" in data:
            po_item.designator = data["designator"]

        if "temporary_mpn" in data:
            po_item.temporary_mpn = data["temporary_mpn"]

        if "temporary_manufacturer" in data:
            po_item.temporary_manufacturer = data["temporary_manufacturer"]

        if "item_received" in data:
            po_item.item_received = data["item_received"]

        po_item.save()

        po = po_item.po
        calculate_po_cost(po)

        # Serialize the updated object
        serializer = PoItemSerializer(po_item)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except ValueError as ve:
        return Response(f"edit_po_item failed: {ve}", status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(f"edit_po_item failed: {e}", status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def remove_po_item(request, itemId):
    permission, response = check_user_auth_and_app_permission(request, "procurement")
    if not permission:
        return response

    try:
        po_item = PoItem.objects.get(id=itemId)
    except PoItem.DoesNotExist:
        return Response("Item not found", status=status.HTTP_404_NOT_FOUND)

    try:
        po = po_item.po
        po_item.delete()
        calculate_po_cost(po)
        return Response(status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def add_po_item(request, poId):
    permission, response = check_user_auth_and_app_permission(request, "procurement")
    if not permission:
        return response

    try:
        # Create new PoItem with default values
        new_po_item = PoItem(po_id=poId)

        new_po_item.save()
        serializer = PoItemSerializer(new_po_item)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def add_po_item_with_contents(request, poId):
    permission, response = check_user_auth_and_app_permission(request, "procurement")
    if not permission:
        return response

    try:
        def get_data(data, key, default=None):
            value = data.get(key, default)
            return default if value == "N/A" else value

        # Parse the updated data from the request
        data = request.data


        # Create a new PoItem instance with the provided details
        new_po_item = PoItem.objects.create(
            po_id=poId,
            quantity=get_data(data, "quantity", 0),
            price=Decimal(get_data(data, "price", 0.0)),
            temporary_mpn=get_data(data, "temporary_mpn", None),
            comment=get_data(data, "comment", ""),
            designator=get_data(data, "designator", None),
        )

        po = new_po_item.po
        calculate_po_cost(po)

        # Serialize the newly created PoItem instance
        serializer = PoItemSerializer(new_po_item)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except ValueError as ve:
        return Response(str(ve), status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(
            f"add_po_item_with_contents failed: {e}",
            status=status.HTTP_400_BAD_REQUEST,
        )

@api_view(["PUT"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def clear_po_items(request, poId):
    permission, response = check_user_auth_and_app_permission(request, "procurement")
    if not permission:
        return response
        
    try:
        items = PoItem.objects.filter(po_id=poId)
        items.delete()
        return Response(status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def match_po_items_with_parts(request, poId):
    permission, response = check_user_auth_and_app_permission(request, "procurement")
    if not permission:
        return response

    try:
        po_items = PoItem.objects.filter(po_id=poId)

        for po_item in po_items:
            # if part is already matched, skip
            if po_item.part or po_item.assembly or po_item.pcba:
                continue

            if po_item.temporary_mpn is None:
                continue

            # Strip for leading/trailing whitespaces
            temporary_mpn = po_item.temporary_mpn.strip()

            # Extract the full part number and revision
            full_part_number_with_revision = temporary_mpn
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
                part_match_latest = Part.objects.filter(mpn__iexact=temporary_mpn, is_latest_revision=True).first()
                if part_match_latest:
                    po_item.part = part_match_latest
            else:
                # Update po_item with the first match found
                if part_match:
                    po_item.part = part_match
                elif assembly_match:
                    po_item.assembly = assembly_match
                elif pcba_match:
                    po_item.pcba = pcba_match

            # Save changes if there's a match
            if part_match or assembly_match or pcba_match or part_match_latest:
                po_item.save()

        # Serialize and return the updated po_items
        serializer = PoItemSerializer(po_items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"match_po_items_with_parts failed: {e}",
            status=status.HTTP_400_BAD_REQUEST,
        )


@api_view(["PUT"])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def mark_item_as_received(request, itemId):
    permission, response = check_user_auth_and_app_permission(request, "procurement")
    if not permission:
        return response

    try:
        po_item = PoItem.objects.get(id=itemId)
        po_item.item_received = True
        po_item.save()

        # Fetch all items related to the same PurchaseOrder
        po = po_item.po
        if po:  # Ensure po is not None
            all_items = PoItem.objects.filter(po=po)
            # Check if all items are received
            if all(all_item.item_received for all_item in all_items):
                po.is_completed = True
                po.save()  # Update the PurchaseOrder's is_completed field
            else:
                po.is_completed = False
                po.save()

        return Response(status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)
