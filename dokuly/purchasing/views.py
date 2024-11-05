from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import api_view
from django.http import JsonResponse
from django.db import transaction
from django.apps import apps
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from django.db.models import Q
from django.contrib.postgres.search import SearchVector
from django.contrib.auth.models import User
from accounts.serializers import UserSerializer
from django.contrib.auth.decorators import login_required
from django.core.exceptions import ObjectDoesNotExist
from django.db.models import Prefetch
from collections import defaultdict

from profiles.views import check_permissions_standard, check_user_auth_and_app_permission
from profiles.views import check_permissions_ownership, check_permissions_standard
from .models import PurchaseOrder, Supplier, PoItem
from .serializers import (PurchaseOrderSerializer,
                          PriceSerializer, SupplierSerializer,
                          PurchaseOrderTableSerializer)
from files.models import File
from organizations.models import Organization
from profiles.models import Profile
from assembly_bom.models import Bom_item, Assembly_bom
from assembly_bom.serializers import BomItemSerializer
from .priceModel import Price
from production.models import Lot
from assemblies.models import Assembly
from .poItemViews import calculate_po_cost
from django.utils import timezone
from datetime import datetime, timedelta

# Create your views here.


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def get_all_purchase_orders(request):
    """Returns a list of all purchase orders.
    """
    permission, response = check_user_auth_and_app_permission(request, "procurement")
    if not permission:
        return response

    purchase_orders = PurchaseOrder.objects.all().prefetch_related('supplier')
    serializerPurchaseOrder = PurchaseOrderTableSerializer(purchase_orders, many=True)

    return Response(serializerPurchaseOrder.data, status=status.HTTP_200_OK)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def get_purchase_order(request, purchase_order_id):
    """Returns a single purchase order.
    """
    permission, response = check_user_auth_and_app_permission(request, "procurement")
    if not permission:
        return response

    purchase_order = PurchaseOrder.objects.get(pk=purchase_order_id)
    serializerPurchaseOrder = PurchaseOrderSerializer(purchase_order, many=False)

    return Response(serializerPurchaseOrder.data, status=status.HTTP_200_OK)


def next_purchase_order_number():
    """Returns the next purchase order number.
    """
    purchase_orders = PurchaseOrder.objects.all()
    if len(purchase_orders) == 0:
        return 10001
    highest_id = 10001
    for item in purchase_orders:
        if item.purchase_order_number == None:
            continue
        if highest_id < item.purchase_order_number:
            highest_id = item.purchase_order_number
    return highest_id+1


@api_view(('POST', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def create_purchase_order(request):
    """Creates a new purchase order.
    """
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "procurement")
    if not permission:
        return response

    data = request.data

    try:
        supplier = Supplier.objects.get(pk=data["supplier"])
        profile = Profile.objects.get(user=user)
        organization = Organization.objects.get(id=profile.organization_id)

        if organization.delivery_address is None or organization.postal_code is None or organization.country is None or organization.billing_address is None:
            # Set organization delivery address to address sent with request
            if "delivery_address" in data:
                organization.delivery_address = data["delivery_address"]
            if "postal_code" in data:
                organization.postal_code = data["postal_code"]
            if "country" in data:
                organization.country = data["country"]
            if "billing_address" in data:
                organization.billing_address = data["billing_address"]
            organization.save()

        purchase_order = PurchaseOrder()
        purchase_order.purchase_order_number = next_purchase_order_number()
        purchase_order.created_by = user
        purchase_order.created_at = datetime.now()
        purchase_order.supplier = supplier
        purchase_order.delivery_address = organization.delivery_address
        purchase_order.postal_code = organization.postal_code
        purchase_order.country = organization.country
        purchase_order.billing_address = organization.billing_address
        purchase_order.name_of_purchaser = organization.name

        if "tracking_number" in data:
            purchase_order.tracking_number = data["tracking_number"]

        if "order_date" in data:
            purchase_order.order_date = data["order_date"]
        if "estimated_delivery_date" in data:
            purchase_order.estimated_delivery_date = data["estimated_delivery_date"]
        if "payment_terms" in data:
            purchase_order.payment_terms = data["payment_terms"]
        if "incoterm" in data:
            purchase_order.incoterms = data["incoterm"]
        if "vat" in data:
            purchase_order.vat = data["vat"]
        if "purchasing_reference" in data:
            purchase_order.purchasing_reference = data["purchasing_reference"]

        purchase_order.order_items = []

        if "notes" in data:
            purchase_order.notes = data["notes"]

        if supplier.default_currency:
            purchase_order.po_currency = supplier.default_currency
        else:
            purchase_order.po_currency = "USD"

        purchase_order.save()

        serializer = PurchaseOrderSerializer(purchase_order, many=False)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response(f"create_purchase_order failed: {e}", status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def update_parts_array(purchase_order):
    """Keep the manyToMany field up-to-date.
    """
    # Extract the list of part ids from the order items field
    order_items = purchase_order.order_items
    part_id_array = [item['part'] for item in order_items]

    # Get the set of ids of the current parts in the many-to-many field
    current_part_ids = set(purchase_order.parts_array.values_list('id', flat=True))

    # Add any missing parts to the many-to-many field by id
    purchase_order.parts_array.add(*set(part_id_array) - current_part_ids)

    # Remove any extra parts from the many-to-many field by id
    purchase_order.parts_array.remove(*current_part_ids - set(part_id_array))
    purchase_order.save()


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def update_purchase_order(request, purchase_order_id):
    """Updates a purchase order.
    """
    user = request.user
    data = request.data
    permission, response = check_user_auth_and_app_permission(request, "procurement")
    if not permission:
        return response

    purchase_order = PurchaseOrder.objects.get(pk=purchase_order_id)
    serializer = PurchaseOrderSerializer(purchase_order, data=data)
    if serializer.is_valid():
        purchase_order = serializer.save()
        if "order_items" in data:
            update_parts_array(purchase_order)
        try:
            if "lot" in data:
                lot = Lot.objects.get(pk=data["lot"])
                purchase_order.lot = lot
                purchase_order.save()
        except Lot.DoesNotExist:
            return Response(serializer.data, status=status.HTTP_206_PARTIAL_CONTENT)
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@login_required(login_url='/login')
def add_file_to_purchase_order(request, po_id, file_id):
    """
    Adds a file to the purchase order's files field.
    """
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "procurement")
    if not permission:
        return response

    if not check_permissions_standard(user):
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    try:
        purchase_order = PurchaseOrder.objects.get(pk=po_id)
        file = File.objects.get(pk=file_id)

        # Check if the file is already in the purchase order's files
        if file in purchase_order.files.all():
            return Response("File already added", status=status.HTTP_409_CONFLICT)

        # Add file to the purchase order's files
        # TODO: Connect these files to the purchase order's project when
        # or if the project field is added to the purchase order model
        purchase_order.files.add(file)
        purchase_order.save()

        return Response(status=status.HTTP_200_OK)

    except ObjectDoesNotExist:
        return Response("Purchase order or file not found", status=status.HTTP_404_NOT_FOUND)


@api_view(('DELETE', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def delete_purchase_order(request, purchase_order_id):
    """Deletes a purchase order.
    """
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "procurement")
    if not permission:
        return response

    purchase_order = PurchaseOrder.objects.get(pk=purchase_order_id)

    # Archive all files connected to the purchase
    files = purchase_order.files.all()
    for item in files:
        item.archived = 1
        item.archived_date = datetime.now()
        item.save()

    purchase_order.delete()

    return Response(status=status.HTTP_204_NO_CONTENT)


# ____________________________________________________________________________________
# View to test migration


def migrate_single_po(po_id):
    PurchaseOrder = apps.get_model('purchasing', 'PurchaseOrder')
    PoItem = apps.get_model('purchasing', 'PoItem')
    Part = apps.get_model('parts', 'Part')
    Organization = apps.get_model('organizations', 'Organization')

    try:
        organization = Organization.objects.get()
        default_currency = organization.currency
    except Organization.DoesNotExist:
        default_currency = None

    try:
        po = PurchaseOrder.objects.get(pk=po_id)
        po.po_currency = default_currency
        po.save()

        order_items = po.order_items
        if order_items:
            for item in order_items:
                part_id = item.get('part')
                part = None
                if part_id:
                    try:
                        part = Part.objects.get(id=part_id)
                    except Part.DoesNotExist:
                        part = None

                PoItem.objects.create(
                    po=po,
                    quantity=float(item.get('quantity', 1)),
                    comment=item.get('description', ''),
                    price=item.get('price', 0.0),
                    part=part,
                )
        return True, "Migration successful"
    except PurchaseOrder.DoesNotExist:
        return False, "PurchaseOrder does not exist"
    except Exception as e:
        return False, str(e)


@api_view(['GET'])
def migrate_purchase_order(request, po_id):
    """
    Runs the migration for a single purchase order.
    """
    success, message = migrate_single_po(po_id)
    if success:
        return Response({"detail": message}, status=status.HTTP_200_OK)
    else:
        return Response({"detail": message}, status=status.HTTP_400_BAD_REQUEST)


# ____________________________________________________________________________________


@api_view(['POST'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def create_po_from_bom(request):
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "procurement")
    if not permission:
        return response

    data = request.data
    if "bom_items" not in data or "order_quantity" not in data or "bom_id" not in data:
        return Response({"error": "Missing required fields"}, status=status.HTTP_400_BAD_REQUEST)

    bom_items = data["bom_items"]
    order_quantity = data["order_quantity"]
    bom_id = data["bom_id"]

    # print(f"Total BOM items in request: {len(bom_items)}")

    pcba = None
    assembly = None
    # Fetch the assembly_bom along with related items efficiently
    try:
        assembly_bom = Assembly_bom.objects.get(id=bom_id)

        if assembly_bom.assembly_id:
            assembly = Assembly.objects.get(id=assembly_bom.assembly_id)
        if assembly_bom.pcba:
            pcba = assembly_bom.pcba

    except Assembly_bom.DoesNotExist:
        return Response({"error": "BOM not found"}, status=status.HTTP_404_NOT_FOUND)

    try:

        # Separate the Bom_items into three categories: parts, pcbas, and assemblies
        bom_parts = []
        bom_pcbas = []
        bom_asms = []

        for bom_item in Bom_item.objects.filter(bom=assembly_bom):
            if bom_item.part and bom_item not in bom_parts:
                bom_parts.append(bom_item)
            elif bom_item.pcba and bom_item not in bom_pcbas:
                bom_pcbas.append(bom_item)
            elif bom_item.assembly and bom_item not in bom_asms:
                bom_asms.append(bom_item)

        # Mapping from supplier_id to list of BOM items
        supplier_map = defaultdict(list)

        for item in bom_items:
            required_quantity = int(item['quantity']) * int(order_quantity)
            # print(f"Processing item: {item['part'] or item['pcba'] or item['assembly']} with required quantity: {required_quantity}")
            best_prices = {}

            if item.get("selected_supplier"):
                # print(f"Selected supplier: {item['selected_supplier']}")
                supplier_id = item["selected_supplier"].get("id")
                supplier = Supplier.objects.get(id=supplier_id)
                added_price = False
                for price in item.get("prices", []):
                    if price.get("supplier") and price["supplier"]["id"] == supplier_id:
                        moq = int(price['minimum_order_quantity'])
                        if moq >= required_quantity:
                            best_prices[supplier_id] = {
                                "item": item,
                                "price": price['price'],
                                "moq": moq,
                                "required_quantity": required_quantity
                            }
                            added_price = True  # Set added_price to True here
                        break  # Exit after handling the price

                # If no suitable price was added, add the first available price for continuity
                if not added_price:
                    for price in item.get("prices", []):
                        if price.get("supplier") and price["supplier"]["id"] == supplier_id:
                            best_prices[supplier_id] = {
                                "item": item,
                                "price": price['price'],
                                "moq": int(price['minimum_order_quantity']),
                                "required_quantity": required_quantity
                            }
                            break  # Ensure we break after adding the fallback price

            else:
                for price in item.get("prices", []):
                    supplier = price.get("supplier")
                    if supplier:
                        supplier_id = supplier['id']
                        moq = int(price['minimum_order_quantity'])
                        if supplier_id not in best_prices or (moq >= required_quantity and
                                                              (moq < best_prices[supplier_id]['moq'] or
                                                               (moq == best_prices[supplier_id]['moq'] and price['price'] < best_prices[supplier_id]['price']))):
                            best_prices[supplier_id] = {
                                "item": item,
                                "price": price['price'],
                                "moq": moq,
                                "required_quantity": required_quantity
                            }

            for supplier_id, best_price_data in best_prices.items():
                if supplier_id in supplier_map:
                    supplier_map[supplier_id].append(best_price_data)
                else:
                    supplier_map[supplier_id] = [best_price_data]

        # total_supplier_items = sum(len(items) for items in supplier_map.values())  # Calculate total items for suppliers
        # print(f"Total items across all suppliers: {total_supplier_items}")
        # print(f"Supplier map: {supplier_map}")

        with transaction.atomic():

            lot = None
            if "connect_to_lot" in data and data["connect_to_lot"]:
                if "lot_id" in data:
                    try:
                        lot = Lot.objects.get(id=data["lot_id"])
                    except Lot.DoesNotExist:
                        return Response({"error": "Lot not found"}, status=status.HTTP_404_NOT_FOUND)
                else:
                    # Create a new lot for this set of purchase orders
                    lot = Lot.objects.create(
                        lot_number=None  # Initially set to None
                    )

                lot.lot_number = lot.pk  # Set the lot number to the primary key
                if assembly:
                    lot.title = assembly.display_name
                    lot.assembly = assembly
                elif pcba:
                    lot.title = pcba.display_name
                    lot.pcba = pcba
                lot.quantity = order_quantity
                lot.save()

            organization = Organization.objects.get(id=user.profile.organization_id)

            # If no items in supplier map, exit early with 204
            if not supplier_map:
                return Response({"message": "No items found for suppliers"}, status=status.HTTP_204_NO_CONTENT)

            for supplier_id, items in supplier_map.items():
                supplier = Supplier.objects.get(id=supplier_id)
                po = PurchaseOrder()
                po.purchase_order_number = next_purchase_order_number()
                po.created_by = user
                po.supplier = supplier
                po.status = 'Draft'
                po.order_date = timezone.now()
                po.po_currency = supplier.default_currency or organization.currency
                po.lot = lot
                po.delivery_address = organization.delivery_address
                po.postal_code = organization.postal_code
                po.country = organization.country
                po.billing_address = organization.billing_address
                po.name_of_purchaser = organization.name
                po.estimated_delivery_date = timezone.now().date() + timedelta(days=30)
                po.payment_terms = "Net 30"
                po.incoterms = "DAP"
                po.vat = 0.0
                po.purchasing_reference = ""
                po.order_items = []
                notes = "PO Generated from bom:\n"
                if assembly:
                    notes += f"- Assembly: {assembly.full_part_number}"
                if pcba:
                    notes += f"- PCBA: {pcba.full_part_number}"
                po.notes = notes
                po.save()

                for item_data in items:
                    po_item = PoItem()
                    po_item.po = po
                    # print(f"Processing item_data: {item_data}")
                    po_item.quantity = item_data.get('required_quantity')
                    # print(f"Quantity: {po_item.quantity}")
                    po_item.price = item_data.get('price', 0.0)
                    po_item.comment = "Generated from BOM"

                    # Determine which entity the item is linked to
                    if 'part' in item_data['item'] and item_data['item']['part']:
                        part_id = item_data['item']['part']
                        # print(f"Attempting to match Part ID: {part_id} in bom_parts")
                        bom_item = next((bom_items for bom_items in bom_parts if bom_items.part.id == part_id), None)
                        if bom_item:
                            po_item.part = bom_item.part
                            po_item.designator = bom_item.designator
                            # print(f"Matched Part: {bom_item.part.id} with Bom_item ID: {bom_item.id}")

                    elif 'pcba' in item_data['item'] and item_data['item']['pcba']:
                        pcba_id = item_data['item']['pcba']
                        # print(f"Attempting to match PCBA ID: {pcba_id} in bom_pcbas")
                        bom_item = next((bom_items for bom_items in bom_pcbas if bom_items.pcba.id == pcba_id), None)
                        if bom_item:
                            po_item.pcba = bom_item.pcba
                            po_item.designator = bom_item.designator
                            # print(f"Matched PCBA: {bom_item.pcba.id} with Bom_item ID: {bom_item.id}")

                    else:
                        assembly_id = item_data['item']['assembly']
                        # print(f"Attempting to match Assembly ID: {assembly_id} in bom_asms")
                        bom_item = next((bom_items for bom_items in bom_asms if bom_items.assembly.id == assembly_id), None)
                        if bom_item:
                            print(f"Matched Assembly: {bom_item.assembly.id} with Bom_item ID: {bom_item}")
                            po_item.assembly = bom_item.assembly
                            po_item.designator = bom_item.designator
                            # print(f"Matched Assembly: {bom_item.assembly.id} with Bom_item ID: {bom_item.id}")

                    po_item.save()

                calculate_po_cost(po)

        return Response({"message": "Purchase orders created successfully"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": f"Failed to create purchase orders: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
