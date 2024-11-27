from django.db.models import Q, Count
from django.db.models import Sum
from parts.models import Part
from inventory.models import Inventory
from inventory.models import Location
from inventory.models import LocationTypes
from customers.models import Customer
from rest_framework import generics, permissions, exceptions
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from rest_framework.exceptions import ParseError
from .serializers import InventorySerializer
from .serializers import LocationSerializer
from .serializers import LocationTypeSerializer, OptimizedLocationSerializer
from customers.serializers import CustomerSerializer
from django.db import models
from django.contrib.auth.decorators import login_required
from django.utils import timezone
from django.core.exceptions import ValidationError
from projects.viewsIssues import APP_TO_MODEL, MODEL_TO_MODEL_STRING, get_request_model_data
from purchasing.models import PoItem
from django.db.models import Sum, Q, F, Count
from django.db.models.functions import Coalesce
from production.models import Lot, Production
from assembly_bom.models import Bom_item, Assembly_bom
from pcbas.models import Pcba
from assemblies.models import Assembly
from datetime import datetime
from django.utils.dateparse import parse_date


@api_view(['GET'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def get_location_entries(request, object_id, app):
    try:
        if app not in APP_TO_MODEL:
            return Response({"error": "Invalid app"}, status=status.HTTP_400_BAD_REQUEST)

        model = APP_TO_MODEL[app]
        model_object = model.objects.get(pk=object_id)

        current_part_stock_list = get_locations_and_stock_for_object(model_object, model)
        other_revisions_stock_list = get_stock_for_other_revisions(model_object, model)

        data = {"current_part_stock_list": current_part_stock_list,
                "other_revisions_stock_list": other_revisions_stock_list}

        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def add_location_entry(request):
    try:
        app, model, model_string, object_id, error_response = get_request_model_data(request)
        if error_response:
            return error_response
        model_object = model.objects.get(pk=object_id)
        fk_field_name = MODEL_TO_MODEL_STRING[model]
        new_inventory = Inventory.objects.create(
            location=None,  # Location is not set yet,
            is_latest=True,
            current_total_stock=None,
        )
        connect_part_object_to_inventory(new_inventory, fk_field_name, model_object)
        new_inventory.save()
        return Response({"success": "Inventory entry added"}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def update_location_entry(request):
    try:
        data = request.data
        if "inventory_id" not in data:
            return Response({"error": "Inventory ID not provided"}, status=status.HTTP_400_BAD_REQUEST)
        if "location_id" not in data:
            return Response({"error": "Location ID not provided"}, status=status.HTTP_400_BAD_REQUEST)

        app, model, model_string, object_id, error_response = get_request_model_data(request)
        if error_response:
            return Response({"error": error_response}, status=status.HTTP_400_BAD_REQUEST)

        inventory = Inventory.objects.get(pk=data["inventory_id"])
        location = Location.objects.get(pk=data["location_id"])
        model_object = model.objects.get(pk=object_id)
        fk_field_name = MODEL_TO_MODEL_STRING[model]

        # Check if any latest inventory entry for the model object is already at this location
        existing_inventory = Inventory.objects.filter(
            **{fk_field_name: model_object, 'is_latest': True, 'location': location}
        )

        if existing_inventory.exists():
            return Response({"status": "No update needed, already set as latest for this location."}, status=status.HTTP_204_NO_CONTENT)

        inventory.location = location
        inventory.is_latest = True
        inventory.save()

        return Response({"success": "Inventory entry updated"}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def adjust_stock(request):
    try:
        data = request.data
        if "location_id" not in data or data.get("location_id") is None:
            return Response({"error": "Location ID not provided"}, status=status.HTTP_400_BAD_REQUEST)
        if "inventory_id" not in data or data.get("inventory_id") is None:
            return Response({"error": "Inventory ID not provided"}, status=status.HTTP_400_BAD_REQUEST)
        app, model, model_string, object_id, error_response = get_request_model_data(request)
        if error_response:
            return error_response
        model_object = model.objects.get(pk=object_id)
        fk_field_name = MODEL_TO_MODEL_STRING[model]
        location = Location.objects.get(pk=data["location_id"])
        # Create new transaction record, set date to today
        inventory = Inventory.objects.create(
            location=location,  # Location is not set yet
            quantity=data.get("quantity", 0),
            created_at=timezone.now(),
            is_latest=True,
        )
        connect_part_object_to_inventory(inventory, fk_field_name, model_object)
        last_inventory = Inventory.objects.get(pk=data["inventory_id"])
        last_inventory.is_latest = False
        last_total_stock = last_inventory.current_total_stock
        if last_total_stock is None:
            last_total_stock = 0
        total_stock = last_total_stock + data.get("quantity", 0)

        inventory.current_total_stock = total_stock  # This is the total stock for that location
        inventory.save()
        last_inventory.save()

        # Fetch all latest inventory entries for the model_object
        latest_inventories = Inventory.objects.filter(
            **{fk_field_name: model_object},
            is_latest=True
        )

        # Aggregate the total current stock from these inventories
        model_total_stock = latest_inventories.aggregate(
            total=Coalesce(Sum('current_total_stock'), 0)
        )['total']

        model_object.current_total_stock = model_total_stock
        model_object.save()
        return Response({"success": "Stock adjusted"}, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def delete_location_entry(request, inventory_id):
    try:
        inventory = Inventory.objects.get(pk=inventory_id)
        # Cannot delete entires that have pcba, part, asm and location
        has_part = False
        has_location = False
        if inventory.part or inventory.assembly or inventory.pcba:
            has_part = True
        if inventory.location:
            has_location = True
        if has_part and has_location:
            return Response({"error": "Inventory entry cannot be deleted"}, status=status.HTTP_400_BAD_REQUEST)
        inventory.delete()
        return Response({"success": "Inventory entry deleted"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def update_minimum_stock_level(request):
    try:
        app, model, model_string, object_id, error_response = get_request_model_data(request)
        if error_response:
            return error_response
        data = request.data
        model_object = model.objects.get(pk=object_id)
        if "minimum_stock_level" not in data:
            return Response({"error": "Minimum stock level not provided"}, status=status.HTTP_400_BAD_REQUEST)
        model_object.minimum_stock_level = data["minimum_stock_level"]
        model_object.save()
        return Response({"success": "Minimum stock level updated"}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def get_stock_history(request, object_id, app, from_date, to_date):
    try:
        # Fetch the model object
        model = APP_TO_MODEL[app]
        model_object = model.objects.get(pk=object_id)

        inventory_entries = Inventory.objects.filter(
            **{MODEL_TO_MODEL_STRING[model]: model_object, 'created_at__range': [from_date, to_date]}
        ).order_by('created_at')

        initial_stock_level = inventory_entries.first().current_total_stock if inventory_entries.exists() else 0
        initial_stock_level = initial_stock_level if initial_stock_level is not None else 0
        serializer = InventorySerializer(inventory_entries, many=True)

        return Response({
            'history': serializer.data,
            'initial_stock_level': initial_stock_level
        }, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def get_on_order_amount(request, object_id, app):
    try:
        model = APP_TO_MODEL[app]
        model_object = model.objects.get(pk=object_id)
        total_on_order, connected_pos = get_total_on_order_for_object(model_object, model)

        # Prepare the connected purchase orders data by unpacking the tuples
        connected_pos_data = [
            {"id": po_id, "purchase_order_number": po_number, "estimated_delivery_date": po_date, "quantity": quantity}
            for (po_id, po_number, po_date, quantity) in connected_pos
        ]

        return Response({"on_order": total_on_order, "connected_pos": connected_pos_data}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def get_stock_forecast(request, object_id, app, to_date):
    try:
        model = APP_TO_MODEL[app]
        model_object = model.objects.get(pk=object_id)
        model_name = model.__name__.lower()  # Model name in lowercase for filtering

        if isinstance(to_date, str):
            to_date = parse_date(to_date.split('T')[0])  # Takes 'YYYY-MM-DD' part only

        # Filter direct lots
        direct_lots = Lot.objects.filter(
            **{model_name: model_object},
            planned_production_date__gt=to_date,
            is_archived=False
        )

        # Building Q objects for dynamic filtering
        q_objects = Q()
        if isinstance(model_object, Part):
            q_objects |= Q(part=model_object)
        if isinstance(model_object, Pcba):
            q_objects |= Q(pcba=model_object)
        if isinstance(model_object, Assembly):
            q_objects |= Q(assembly=model_object)

        bom_items = Bom_item.objects.filter(q_objects).select_related('bom')
        bom_ids = list(bom_items.values_list('bom__id', flat=True))

        assembly_boms = Assembly_bom.objects.filter(id__in=bom_ids)
        pcba_ids = list(assembly_boms.values_list('pcba', flat=True))
        assembly_ids = list(assembly_boms.values_list('assembly_id', flat=True))

        # Filter lots based on identified BOMs
        bom_lots = Lot.objects.filter(
            Q(pcba__id__in=pcba_ids) |
            Q(assembly_id__in=assembly_ids),
            planned_production_date__gt=to_date,
            is_archived=False
        )

        # Combine and ensure distinct lots
        all_lots = (direct_lots | bom_lots).distinct()

        # Fetch production counts in bulk
        productions = Production.objects.filter(lot__in=all_lots).values('lot_id', 'lot__quantity').annotate(count=Count('id'))
        production_dict = {prod['lot_id']: (prod['count'], prod['lot__quantity']) for prod in productions}

        forecast_data = []
        for lot in all_lots:

            try:
                production_count, lot_quantity = production_dict.get(lot.id, (0, lot.quantity))

                if getattr(lot, model_name) == model_object:
                    lot_type = 'Direct'
                    stock_change = lot_quantity - production_count
                else:
                    lot_type = 'BOM'
                    if lot.assembly:
                        associated_bom = assembly_boms.get(assembly_id=lot.assembly.id)
                    elif lot.pcba:
                        associated_bom = assembly_boms.get(pcba=lot.pcba)

                    related_bom_item = bom_items.get(bom=associated_bom, **{model_name: model_object})
                    remaining_productions = lot_quantity - production_count
                    bom_quantity_used = related_bom_item.quantity * remaining_productions
                    stock_change = -bom_quantity_used

                forecast_data.append({
                    'lot_number': lot.lot_number,
                    'planned_production_date': lot.planned_production_date,
                    'stock_change': stock_change,
                    'lot_type': lot_type
                })
            except Bom_item.DoesNotExist:
                continue

        return Response(forecast_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


def get_locations_and_stock_for_object(model_object, model, revision=None):
    fk_field_name = MODEL_TO_MODEL_STRING[model]
    # Fetch all latest inventory entries for each location for the model_object
    inventory_entries = Inventory.objects.filter(
        **{fk_field_name: model_object, 'is_latest': True}
    ).select_related('location')

    location_details = []
    for entry in inventory_entries:
        if entry.location:
            loc_data = {
                "id": entry.id,
                "name": entry.location.name,
                "room": entry.location.room,
                "in_stock": entry.current_total_stock,
                "location_id": entry.location.id
            }
            if revision:
                loc_data["revision"] = revision.revision
                loc_data["revision_object_id"] = revision.id
                loc_data["is_stock_in_other_revision"] = True
            location_details.append(loc_data)
        else:
            # Handle possible entries without a location
            loc_data = {
                "id": entry.id,
                "name": "",
                "room": "",
                "in_stock": None,
                "location_id": None
            }
            location_details.append(loc_data)

    total_on_order, connected_pos = get_total_on_order_for_object(model_object, model)
    on_order = {
        "name": "On order",
        "room": "",
        "in_stock": total_on_order,
        "connected_pos": [
            {"id": po_id, "purchase_order_number": po_number, "estimated_delivery_date": po_date, "quantity": quantity}
            for po_id, po_number, po_date, quantity in connected_pos
        ],
    }
    if revision:
        on_order["revision"] = revision.revision
        on_order["revision_object_id"] = revision.id
        on_order["is_stock_in_other_revision"] = True
    location_details.append(on_order)
    return location_details


def get_stock_for_other_revisions(model_object, model: models.Model):
    # Exclude the current revision
    revisions = model.objects.filter(
        part_number=model_object.part_number
    ).exclude(pk=model_object.pk)
    # Exit early if there are no other revisions
    if not revisions.exists():
        return []

    other_revisions_stock_list = []
    for revision in revisions:
        stock_list = get_locations_and_stock_for_object(revision, model, revision=revision)
        other_revisions_stock_list.extend(stock_list)

    return other_revisions_stock_list


def get_total_on_order_for_object(model_object, model):
    model_name = model.__name__.lower()
    # Fetch PoItem entries and the related PurchaseOrders
    po_items = PoItem.objects.filter(
        **{
            f"{model_name}": model_object,
            'po__status': 'Sent',
            'po__is_completed': False,
            "item_received": False
        }
    ).select_related('po')

    # Annotate items with necessary additional fields
    annotated_po_items = po_items.annotate(
        purchase_order_number=F('po__purchase_order_number'),
        estimated_delivery_date=F('po__estimated_delivery_date'),
        purchase_order_id=F('po__id')
    )

    # Calculate the total quantity on order
    total_on_order = annotated_po_items.aggregate(total_on_order=models.Sum('quantity'))['total_on_order'] or 0

    # Extract detailed information for each PoItem, including additional annotated fields
    detailed_po_items = annotated_po_items.values(
        'purchase_order_id', 'purchase_order_number', 'estimated_delivery_date', 'quantity'
    )

    # Prepare list of unique PurchaseOrders with additional details
    related_pos = {
        (item['purchase_order_id'], item['purchase_order_number'], item['estimated_delivery_date'], item['quantity'])
        for item in detailed_po_items
    }

    return total_on_order, list(related_pos)


@api_view(['POST'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def add_inventory_entry(request):
    try:
        data = request.data
        if "location_id" not in data or data.get("location_id") is None:
            return Response({"error": "Location ID not provided"}, status=status.HTTP_400_BAD_REQUEST)
        if "quantity" not in data:
            return Response({"error": "Quantity not provided"}, status=status.HTTP_400_BAD_REQUEST)

        app, model, model_string, object_id, error_response = get_request_model_data(request)
        if error_response:
            return error_response

        model_object = model.objects.get(pk=object_id)
        fk_field_name = MODEL_TO_MODEL_STRING[model]
        location = Location.objects.get(pk=data["location_id"])
        quantity = data.get("quantity", 0)

        # Create new inventory entry
        inventory = Inventory.objects.create(
            location=location,
            quantity=quantity,
            created_at=timezone.now(),
            is_latest=True,
        )
        connect_part_object_to_inventory(inventory, fk_field_name, model_object)

        # Set previous inventories for this item and location to is_latest=False
        Inventory.objects.filter(
            **{fk_field_name: model_object},
            location=location,
            is_latest=True
        ).exclude(pk=inventory.pk).update(is_latest=False)

        # Calculate current total stock for the location
        last_inventory = Inventory.objects.filter(
            **{fk_field_name: model_object},
            location=location,
            is_latest=False
        ).order_by('-created_at').first()

        last_total_stock = last_inventory.current_total_stock if last_inventory and last_inventory.current_total_stock else 0
        total_stock = last_total_stock + quantity

        inventory.current_total_stock = total_stock
        inventory.save()

        # Update model object's total stock
        latest_inventories = Inventory.objects.filter(
            **{fk_field_name: model_object},
            is_latest=True
        )

        model_total_stock = latest_inventories.aggregate(
            total=Coalesce(Sum('current_total_stock'), 0)
        )['total']

        model_object.current_total_stock = model_total_stock
        model_object.save()

        return Response({"success": "Inventory entry added", "inventory_id": inventory.pk}, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


def connect_part_object_to_inventory(new_inventory, fk_field_name, model_object):
    setattr(new_inventory, fk_field_name, model_object)
