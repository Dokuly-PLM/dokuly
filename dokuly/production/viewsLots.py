from .models import Assembly, Part, Pcba, Production, Lot
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from .serializers import LotSerializer, LotSerializerWithProject, ProductionSerializer
from assemblies.models import Assembly
from django.db.models import Q, Max, Sum, Prefetch
from pcbas.models import Pcba
from purchasing.models import PoItem, PurchaseOrder
from purchasing.serializers import PurchaseOrderTableSerializer
from rest_framework.permissions import IsAuthenticated
from projects.viewsIssues import get_request_model_data, connect_model_object_to_related_object
from django.shortcuts import get_object_or_404
from documents.models import MarkdownText
from assembly_bom.models import Assembly_bom, Bom_item
from assembly_bom.serializers import BomItemSerializerWithParts
from inventory.viewsLocationEntires import get_total_on_order_for_object


@api_view(['GET'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def get_lots(request):
    """Get all lots"""
    lots = Lot.objects.all().prefetch_related('pcba__project', 'part__project', 'assembly__project')
    serializer = LotSerializerWithProject(lots, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['GET'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def get_single_lot(request, id):
    """Get a single lot with related pcba, part, and assembly details."""
    # Use get_object_or_404 to handle non-existing objects gracefully
    lot = get_object_or_404(Lot.objects.prefetch_related('pcba', 'part', 'assembly', 'description'), id=id)
    serializer = LotSerializer(lot)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PUT'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def edit_lot(request, id):
    """Edit a lot"""
    data = request.data
    try:
        lot = Lot.objects.get(id=id)
        lot.title = data.get('title', lot.title)
        lot.quantity = data.get('quantity', lot.quantity)
        if "description" in data:
            if lot.description:
                lot.description.text = data.get('description')
                lot.description.save()
            else:
                lot.description = MarkdownText.objects.create(text=data.get('description'))

        if "object_id" in data and "app" in data:
            app, model, model_string, object_id, error_response = get_request_model_data(request)
            if error_response:
                return error_response
            model_object = model.objects.get(id=object_id)
            connect_model_object_to_related_object(lot, model_string, model_object)

        if "planned_production_date" in data:
            lot.planned_production_date = data.get('planned_production_date')

        if lot.lot_number is None:
            lot.lot_number = lot.pk
        lot.save()
        serializer = LotSerializer(lot)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def create_lot(request):
    """Create a new lot"""
    data = request.data
    try:
        app, model, model_string, object_id, error_response = get_request_model_data(request)
        model_object = model.objects.get(id=object_id)
        lot = Lot.objects.create(
            title=data.get('title'),
            quantity=data.get('quantity'),
        )

        if "assembly_date" in data:
            lot.planned_production_date = data.get('assembly_date')

        connect_model_object_to_related_object(lot, model_string, model_object)
        lot.lot_number = lot.pk
        lot.save()
        serializer = LotSerializer(lot)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def fetch_bom(request, id):
    """Fetch the BOM for a lot"""
    try:
        lot = Lot.objects.get(id=id)
        model_object = None
        if lot.pcba:
            model_object = lot.pcba
        elif lot.assembly:
            model_object = lot.assembly
        else:
            return Response({"bom": [], "app": "parts"}, status=status.HTTP_200_OK)
        bom = None
        app = "assemblies"
        if type(model_object) == Assembly:
            bom = Assembly_bom.objects.get(assembly_id=model_object.pk)
        elif type(model_object) == Pcba:
            bom = Assembly_bom.objects.get(pcba=model_object)
            app = "pcbas"
        else:
            return Response({"bom": [], "app": "parts"}, status=status.HTTP_200_OK)

        bom_items = Bom_item.objects.filter(bom=bom).prefetch_related('part', 'pcba', 'assembly',
                                                                      'part__prices',
                                                                      'part__prices__supplier')
        serializer = BomItemSerializerWithParts(bom_items, many=True)

        # Collect all model objects from bom items
        related_models = {'pcba': [], 'assembly': [], 'part': []}
        for item in bom_items:
            if item.pcba:
                related_models['pcba'].append(item.pcba)
            if item.assembly:
                related_models['assembly'].append(item.assembly)
            if item.part:
                related_models['part'].append(item.part)

        # Aggregate total on order quantities by model type
        on_order_data = {}
        for model_name, models in related_models.items():
            if models:
                ids = [model.id for model in models]
                po_items = PoItem.objects.filter(
                    **{f"{model_name}__id__in": ids, 'po__status': 'Sent', 'po__is_completed': False}
                ).values(f"{model_name}__id").annotate(total_on_order=Sum('quantity'))

                # This update does not update the Po Item, but rather the dictionary holding the data
                on_order_data.update({(model_name, item[f"{model_name}__id"]): item['total_on_order'] for item in po_items})

        # Map aggregated data back to serialized data
        for item_data, item in zip(serializer.data, bom_items):
            for model_name in ['pcba', 'assembly', 'part']:
                model_instance = getattr(item, model_name)
                if model_instance:
                    key = (model_name, model_instance.id)
                    item_data['on_order_stock'] = on_order_data.get(key, 0)

        return Response({"bom": serializer.data, "app": app}, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def fetch_serial_numbers(request, id):
    """Fetch all serial numbers for a lot"""
    try:
        lot = Lot.objects.get(id=id)
        serial_numbers = Production.objects.filter(lot=lot).prefetch_related('pcba', 'part', 'assembly')
        serializer = ProductionSerializer(serial_numbers, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def update_serial_number(request, id):
    """Update a serial number"""
    data = request.data
    try:
        production = Production.objects.get(id=id)
        if "description" in data:
            if production.description:
                production.description.text = data.get('description')
                production.description.save()
            else:
                production.description = MarkdownText.objects.create(text=data.get('description'))
        production.save()
        serializer = ProductionSerializer(production)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def fetch_connected_po(request, id):
    """Fetch the connected PO for a lot"""
    try:
        lot = Lot.objects.get(id=id)

        # Determine the related object and its BOM
        model_object = None
        bom = None
        app = None

        if lot.pcba:
            model_object = lot.pcba
            bom = Assembly_bom.objects.filter(pcba=model_object).first()
            app = "pcbas"
        elif lot.assembly:
            model_object = lot.assembly
            bom = Assembly_bom.objects.filter(assembly_id=model_object.pk).first()
            app = "assemblies"
        else:  # Handle part lots (no bom)
            po_items = PoItem.objects.filter(part=lot.part).select_related('po').prefetch_related(
                Prefetch('po', queryset=PurchaseOrder.objects.filter(status='Sent', is_completed=False))
            )

            # Extract connected POs without duplicates
            connected_pos = {item.po for item in po_items if item.po and item.po.status == 'Sent'}

            # Serialize and return the data
            serializer = PurchaseOrderTableSerializer(list(connected_pos), many=True)
            return Response(serializer.data, status=status.HTTP_200_OK)

        if not bom:
            return Response([], status=status.HTTP_204_NO_CONTENT)

        # Fetch BOM items related to the found BOM
        bom_items = Bom_item.objects.filter(bom=bom).prefetch_related('part', 'pcba', 'assembly')

        # Extract parts, pcbas, and assemblies IDs from BOM items
        part_ids = [item.part.id for item in bom_items if item.part]
        pcba_ids = [item.pcba.id for item in bom_items if item.pcba]
        assembly_ids = [item.assembly.id for item in bom_items if item.assembly]

        # Use these IDs to filter PoItems
        po_items = PoItem.objects.filter(
            Q(pcba_id__in=pcba_ids) |
            Q(assembly_id__in=assembly_ids) |
            Q(part_id__in=part_ids)
        ).select_related('po').prefetch_related(
            Prefetch('po', queryset=PurchaseOrder.objects.filter(status='Sent', is_completed=False))
        )

        # Extract connected POs without duplicates
        connected_pos = {item.po for item in po_items if item.po and item.po.status == 'Sent'}

        # Serialize and return the data
        serializer = PurchaseOrderTableSerializer(list(connected_pos), many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def delete_lot(request, id):
    """Delete a lot"""
    try:
        lot = Lot.objects.get(id=id)
        lot.delete()
        return Response("Lot deleted", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)
