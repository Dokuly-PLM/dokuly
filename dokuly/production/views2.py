from .models import Assembly, Part, Pcba, Production, Lot
from .models import Production, Assembly, Part, Pcba
from django.db import IntegrityError
from rest_framework.decorators import api_view, permission_classes
from django.shortcuts import render
from django.db import transaction
from django.http import HttpResponse
from production.models import Production, TestData
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from .serializers import ProductionSerializer, TestDataSerializer
from files.serializers import FileSerializer
from files.models import File
from parts.models import Part
from assemblies.models import Assembly
from django.db.models import Q, Max
from django.contrib.auth.decorators import login_required
from rest_framework.permissions import IsAuthenticated
from organizations.permissions import APIAndProjectAccess
import json
from profiles.views import check_user_auth_and_app_permission
from django.core.exceptions import ObjectDoesNotExist
from django.db.utils import IntegrityError
from django.utils import timezone
import re
from documents.models import MarkdownText


@api_view(['GET'])
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def get_production_by_number_and_serial(request, number, serial_number, **kwargs):
    """
    Retrieves a production record by part number, assembly number, or pcba number along with the serial number.
    The 'number' parameter is expected to be the 'full_part_number' from one of the related models.
    """
    try:
        # Adjust the filter to use the 'full_part_number' field in the related models
        production = Production.objects.filter(
            # Adjusted for 'full_part_number'
            Q(part__full_part_number=number) |
            Q(assembly__full_part_number=number) |
            Q(pcba__full_part_number=number),
            serial_number=serial_number
        ).select_related('part', 'assembly', 'pcba').first()  # Efficiently fetch related data

        if not production:
            return Response({'error': 'No matching production item found'}, status=404)

        # Serialize the production item
        serializer = ProductionSerializer(production)
        return Response(serializer.data)

    except Exception as e:
        return Response({'error': str(e)}, status=500)

# Get all production items


@api_view(['GET'])
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def get_all_production(request, **kwargs):
    try:

        # Retrieve all production items
        production_items = Production.objects.all()

        if APIAndProjectAccess.has_validated_key(request):
            if APIAndProjectAccess.check_wildcard_access(request):
                production_items = production_items
            else:
                allowed_projects = APIAndProjectAccess.get_allowed_projects(
                    request)
                production_items = production_items.filter(
                    (Q(pcba__project__in=allowed_projects) | Q(pcba__project__isnull=True)) &
                    (Q(part__project__in=allowed_projects) | Q(part__project__isnull=True)) &
                    (Q(assembly__project__in=allowed_projects) | Q(
                        assembly__project__isnull=True))
                )
        else:
            production_items = production_items.filter(
                (Q(pcba__project__project_members=request.user) |
                 Q(pcba__project__isnull=True)) &
                (Q(part__project__project_members=request.user) |
                 Q(part__project__isnull=True)) &
                (Q(assembly__project__project_members=request.user) |
                 Q(assembly__project__isnull=True))
            )

        # Serialize the production items
        serializer = ProductionSerializer(production_items, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(f"get_all_production failed: {e}", status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(('POST',))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def create_new_production(request, **kwargs):
    """
    Create a new production entry based on the provided data.
    Handles different types of production items: pcba, part, and assembly.
    Serial numbers are generated and incremented based on the provided data.
    All database operations are wrapped in a transaction to ensure data integrity.
    """
    try:
        # Wrapping all database operations in a transaction for data integrity
        with transaction.atomic():
            data = request.data

            # Initialize variable for the production item (pcba, part, assembly)
            production_item = None

            # Retrieve the relevant item and its details
            for item_type in ['pcba', 'part', 'assembly']:
                if item_type in data:
                    model = globals()[item_type.capitalize()]
                    production_item = model.objects.get(id=data[item_type])
                    if APIAndProjectAccess.has_validated_key(request):
                        if not APIAndProjectAccess.check_project_access(request, production_item.project_id):
                            return Response("Not Authorized", status=status.HTTP_401_UNAUTHORIZED)
                    break
            if not production_item:
                return Response("No valid item type provided", status=status.HTTP_400_BAD_REQUEST)

            # Handling serial number generation and updates
            if production_item.serial_number_counter == 0:
                production_item.serial_number_counter = data.get(
                    'serial_number_offset', 0)
                production_item.serial_number_prefix = data.get(
                    'serial_number_prefix', '')
            start_serial_number = int(production_item.serial_number_counter)

            # Preparing a list of production items to be created
            productions = []
            quantity = data.get('quantity', 1)

            lot = Lot.objects.get(id=data.get('lot'))

            if type(quantity) == str:
                quantity = int(quantity)
            for i in range(quantity):
                prod = Production(
                    serial_number=production_item.serial_number_prefix +
                    str(start_serial_number + i + 1),
                    assembly_date=data.get('assembly_date'),
                    state=data.get('state', ''),
                    lot=lot,
                    is_archived=False
                )

                if type(production_item) == Pcba:
                    prod.pcba = production_item
                elif type(production_item) == Part:
                    prod.part = production_item
                elif type(production_item) == Assembly:
                    prod.assembly = production_item

                markdown = MarkdownText.objects.create(
                    text=data.get('description', '')
                )
                prod.description = markdown
                # Setting the foreign key relation dynamically
                setattr(prod, f"{item_type}_id", production_item.id)
                productions.append(prod)

            # Bulk creating production items for efficiency
            Production.objects.bulk_create(productions)

            # Updating the serial number counter in the production item
            quantity = int(data.get('quantity', 1))
            production_item.serial_number_counter = str(
                int(production_item.serial_number_counter) + quantity)
            production_item.save()

            lot.serial_number_counter = production_item.serial_number_counter
            lot.save()

            # Preparing the response with the count and last item details
            items_created = len(productions)
            last_item = productions[-1] if productions else None
            last_item_data = ProductionSerializer(
                last_item).data if last_item else None

            response_data = {
                "items_created": items_created,
                "last_item": last_item_data
            }

            return Response(response_data, status=status.HTTP_200_OK)

    except Exception as e:
        # Handling exceptions and returning an error response
        import traceback
        traceback.print_exc()
        return Response(f"create_new_production failed: {e}", status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def search_production_items(request, **kwargs):
    try:
        if request.user is None:
            return Response("Not Authorized", status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        query = data.get('query', '')

        results = Production.objects.filter(
            Q(is_archived=False) &
            (
                Q(pcba__full_part_number__icontains=query) |
                Q(pcba__display_name__icontains=query) |
                Q(part__full_part_number__icontains=query) |
                Q(part__display_name__icontains=query) |
                Q(assembly__full_part_number__icontains=query) |
                Q(assembly__display_name__icontains=query)
            ) |
            (
                Q(serial_number__icontains=query) |
                Q(comment__icontains=query)
            )
        ).select_related("part", "pcba", "assembly")  # This will retrieve related objects

        if APIAndProjectAccess.has_validated_key(request):
            if APIAndProjectAccess.check_wildcard_access(request):
                results = results
            else:
                allowed_projects = APIAndProjectAccess.get_allowed_projects(
                    request)
                results = results.filter(
                    (Q(pcba__project__in=allowed_projects) | Q(pcba__project__isnull=True)) &
                    (Q(part__project__in=allowed_projects) | Q(part__project__isnull=True)) &
                    (Q(assembly__project__in=allowed_projects) | Q(
                        assembly__project__isnull=True))
                )
        else:
            results = results.filter(
                (Q(pcba__project__project_members=request.user) |
                 Q(pcba__project__isnull=True)) &
                (Q(part__project__project_members=request.user) |
                 Q(part__project__isnull=True)) &
                (Q(assembly__project__project_members=request.user) |
                 Q(assembly__project__isnull=True))
            )

        serializer = ProductionSerializer(results, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(f"Search failed: {e}", status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def create_single_production(request, **kwargs):
    """
    Creates a single production item with the provided serial number and other details.
    Expects 'full_part_number' and 'revision' in the request data.
    """
    try:
        # Extract data from request
        full_part_number = request.data.get('full_part_number')
        revision = request.data.get('revision')
        provided_serial_number = request.data.get('serial_number', None)

        # Construct a query to look for an item with both full_part_number and revision
        item_query = Q(full_part_number=full_part_number, revision=revision)

        # Fetch the item from Assembly, Part, or Pcba
        item = (Assembly.objects.filter(item_query).first() or
                Part.objects.filter(item_query).first() or
                Pcba.objects.filter(item_query).first())

        if not item:
            return Response({'error': 'No item found matching full part number and revision'}, status=404)

        with transaction.atomic():
            if provided_serial_number:
                # Check if the provided serial number is unique
                if Production.objects.filter(serial_number=provided_serial_number).exists():
                    return Response({'error': 'Serial number already exists'}, status=400)

                # Parse out the numerical part of the provided serial number to compare with the counter
                match = re.match(
                    f"{re.escape(item.serial_number_prefix)}(\\d+)", provided_serial_number)
                if match:
                    provided_number = int(match.group(1))
                    if provided_number > item.serial_number_counter:
                        # Update the counter if the provided number is larger
                        item.serial_number_counter = provided_number
                else:
                    return Response({'error': 'Provided serial number format is incorrect'}, status=400)

                new_serial_number = provided_serial_number
            else:
                # Generate the new serial number based on the current counter
                new_serial_number = f"{item.serial_number_prefix}{item.serial_number_counter + 1}"
                item.serial_number_counter += 1  # Increment the serial number counter in the item

            item.save()

            production = Production(
                serial_number=new_serial_number,
                assembly_date=request.data.get('assembly_date') or timezone.now(),
                comment=request.data.get('comment', ''),
                state=request.data.get('state', 'New'),
                is_archived=request.data.get('is_archived', False)
            )

            # Save the production item to the appropriate model
            if isinstance(item, Part):
                production.part = item
            elif isinstance(item, Assembly):
                production.assembly = item
            elif isinstance(item, Pcba):
                production.pcba = item

            production.save()

        return Response({'message': 'Production item created successfully', 'serial_number': new_serial_number}, status=201)

    except KeyError as e:
        return Response({'error': 'Missing necessary fields: ' + str(e)}, status=400)
    except IntegrityError as e:
        return Response({'error': str(e)}, status=400)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['PUT'])
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def update_production(request, identifier, serial_number, **kwargs):
    try:
        # Extract the full_part_number and revision from the identifier
        match = re.match(r"(\D+\d+)(\D)", identifier)
        if not match:
            return Response({'error': 'Invalid identifier format'}, status=400)

        full_part_number = match.group(1)
        revision = match.group(2)

        # Fetch the item from Assembly, Part, or Pcba
        item_query = Q(full_part_number=full_part_number, revision=revision)
        product_item = None
        production = None

        # Attempt to find the production item and check the appropriate model type
        for Model, field_name in [(Assembly, 'assembly'), (Part, 'part'), (Pcba, 'pcba')]:
            product_item = Model.objects.filter(item_query).first()
            if product_item:
                # Construct the query based on the correct model type
                production_query = {field_name: product_item,
                                    'serial_number': serial_number}
                production = Production.objects.filter(
                    **production_query).first()
                if production:
                    break

        if not production:
            return Response({'error': 'Production item not found'}, status=404)

        # Update fields from request data if provided
        production.assembly_date = request.data.get(
            'assembly_date', production.assembly_date)
        production.state = request.data.get('state', production.state)
        production.comment = request.data.get('comment', production.comment)
        production.last_updated = timezone.now()
        production.is_archived = request.data.get(
            'is_archived', production.is_archived)

        # Save the updated production item
        production.save()

        return Response({'message': 'Production item updated successfully'}, status=200)

    except KeyError as e:
        return Response({'error': 'Missing necessary fields: ' + str(e)}, status=400)
    except ObjectDoesNotExist:
        return Response({'error': 'Item not found'}, status=404)
    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def get_test_data(request, identifier, serial_number, **kwargs):
    """
    Retrieves all test data for items identified by a full_part_number and revision (either assembly, part, or PCBA)
    and a serial number.
    """
    try:
        # Extract full_part_number and revision
        match = re.match(r"(\D+\d+)(\D)", identifier)
        if not match:
            return Response({'error': 'Invalid identifier format'}, status=400)

        full_part_number = match.group(1)
        revision = match.group(2)

        # Construct a query to look for an item with both full_part_number and revision
        item_query = Q(full_part_number=full_part_number, revision=revision)
        production_query = Q(serial_number=serial_number)
        product_items = []

        # Check each model to find the production items
        for Model, field_name in [(Assembly, 'assembly'), (Part, 'part'), (Pcba, 'pcba')]:
            items = Model.objects.filter(item_query)
            if items.exists():
                # Filter the production items using the specific model field and add to list
                productions = Production.objects.filter(
                    production_query & Q(**{field_name + "__in": items}))
                if productions.exists():
                    product_items.extend(productions)

        if not product_items:
            return Response({'error': 'Production items not found'}, status=404)

        # Get all test data linked to the found production items
        test_data_items = TestData.objects.filter(
            produced_item__in=product_items)
        serializer = TestDataSerializer(test_data_items, many=True)
        return Response(serializer.data)

    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def post_test_data(request, identifier, serial_number, **kwargs):
    """
    Posts test data for an item identified by a full_part_number and revision (either assembly, part, or PCBA)
    and a serial number.
    """
    try:
        # Extract full_part_number and revision
        match = re.match(r"(\D+\d+)(\D)", identifier)
        if not match:
            return Response({'error': 'Invalid identifier format'}, status=400)

        full_part_number = match.group(1)
        revision = match.group(2)

        # Construct a query to look for an item with both full_part_number and revision
        item_query = Q(full_part_number=full_part_number,
                       revision=revision)
        production_query = Q(serial_number=serial_number)

        # Initialize product_item
        product_item = None

        # Check each model to find the production item
        for Model, field_name in [(Assembly, 'assembly'), (Part, 'part'), (Pcba, 'pcba')]:
            model_items = Model.objects.filter(item_query)
            if model_items.exists():
                # Get the first item matching the model and serial number
                product_item = Production.objects.filter(
                    production_query & Q(**{field_name + "__in": model_items})).first()
                if product_item:
                    break

        if not product_item:
            return Response({'error': 'Production item not found'}, status=404)

        # Deserialize the incoming data
        serializer = TestDataSerializer(data=request.data)
        if serializer.is_valid():
            # Save the test data with the linked production item
            test_data = serializer.save(produced_item=product_item)
            return Response({'message': 'Test data added successfully'}, status=201)
        else:
            return Response(serializer.errors, status=400)

    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def delete_test_data(request, id, **kwargs):
    """
    Deletes test data by ID.
    """
    try:
        test_data = TestData.objects.get(pk=id)
        test_data.delete()
        return Response({'message': 'Test data deleted successfully'}, status=status.HTTP_204_NO_CONTENT)
    except TestData.DoesNotExist:
        return Response({'error': 'Test data not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
