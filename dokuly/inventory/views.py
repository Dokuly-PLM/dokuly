from os import stat
from django.shortcuts import render
from parts.models import Part
from inventory.models import Inventory
from inventory.models import Location
from inventory.models import LocationTypes
from customers.models import Customer
from rest_framework import generics, permissions, exceptions
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes
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


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def fetch_locations(request):
    # Return an unauthorized response if the user is not authenticated
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    try:
        # Query the Location objects, filtering by the `archived` field and using select_related to fetch related LocationTypes
        qs = Location.objects.filter(archived=0).select_related('location_type_v2')

        # Serialize the queryset using the optimized serializer
        serializer = OptimizedLocationSerializer(qs, many=True)

    except Exception as e:
        print("Error in fetch_locations view:")
        print(e)
        raise exceptions.APIException(str(e))

    # Return the serialized data as a JSON response
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def fetch_archived_locations(request):
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    qs = Location.objects.filter(archived=1)
    serializer = LocationSerializer(qs, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['POST'])
@renderer_classes((JSONRenderer, ))
def create_location(request):
    if request.user is None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    location = Location()
    data = request.data

    if not data:
        raise ParseError("No data provided")

    try:
        if 'location_name' in data:
            location.name = data.get('location_name')
        if 'row' in data:
            location.location_row = data.get('row')
        if 'col' in data:
            location.location_column = data.get('col')
        if 'location_type_id_v2' in data:
            location.location_type_v2_id = data.get('location_type_id_v2')
        if 'location_number' in data:
            location.location_number = data.get('location_number')
        if 'max_capacity' in data:
            location.capacity_full = data.get('max_capacity')
        if 'notes' in data:
            location.notes = data.get('notes')
        location.archived = 0
        location.archived_date = None
        location.full_clean()  # this will validate the fields
        location.save()
    except ValidationError as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    serializer = LocationSerializer(location)
    return Response(serializer.data, status=status.HTTP_201_CREATED)


@api_view(['PUT'])
@renderer_classes((JSONRenderer,))
def update_location(request, location_id):
    try:
        location = Location.objects.get(id=location_id)
    except Location.DoesNotExist:
        return Response({'error': 'Location not found.'}, status=status.HTTP_404_NOT_FOUND)

    location.name = request.data.get('location_name', location.name)
    location.location_row = request.data.get('row', location.location_row)
    location.location_column = request.data.get('col', location.location_column)
    location.location_type_id = -1
    location.location_type_v2_id = request.data.get('location_type_id_v2')
    location.location_number = request.data.get('location_number', location.location_number)
    location.capacity_full = request.data.get('max_capacity', location.capacity_full)
    location.notes = request.data.get('notes', location.notes)

    location.save()

    serializer = LocationSerializer(location)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(['PUT'])
@renderer_classes((JSONRenderer,))
def archive_location(request, location_id):
    try:
        location = Location.objects.get(id=location_id)
    except Location.DoesNotExist:
        return Response({'error': 'Location not found.'}, status=status.HTTP_404_NOT_FOUND)

    location.archived = 1
    location.archived_date = timezone.now()
    location.save()

    return Response(status=status.HTTP_200_OK)

# Deprecated


@api_view(('POST', 'PUT'))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def handle_post_and_put_2(request, fetchRest):  # Locations
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    if request.method == 'POST':
        serializer = LocationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            if fetchRest == 1:
                qs = Location.objects.filter(archived=0)
                retSerializer = LocationSerializer(qs, many=True)
                for obj in retSerializer.data:
                    if 'location_type_id' in obj:
                        if obj['location_type_id'] != -1:
                            try:
                                type = LocationTypes.objects.get(id=obj['location_type_id'])
                                typeSerializer = LocationTypeSerializer(type, many=False)
                                obj['container_type_custom'] = typeSerializer.data['display_name']
                                obj['container_type_desc'] = typeSerializer.data['description']
                                obj['container_type_id'] = typeSerializer.data['id']
                                obj['container_type_archived'] = typeSerializer.data['archived']
                            except LocationTypes.DoesNotExist:
                                obj['container_type_custom'] = "Not Found"
                        else:
                            obj['container_type_custom'] = "Not Defined"
                    else:
                        obj['container_type_custom'] = "Key Error"
                return Response(retSerializer.data, status=status.HTTP_201_CREATED)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    elif request.method == 'PUT':
        data = request.data
        if data == None:
            return Response("Invalid data parameters", status=status.HTTP_400_BAD_REQUEST)
        if fetchRest != 2:
            if 'id' not in data:
                return Response("No id sent with the request", status=status.HTTP_400_BAD_REQUEST)
        if fetchRest == 2:
            # Bulk edit archived
            if 'ids' in data:
                Location.objects.filter(id__in=data['ids']).update(archived=1, archived_date=data['archived_date'])
                newLocationsQs = Location.objects.filter(archived=0)
                serializer = LocationSerializer(newLocationsQs, many=True)
                for obj in serializer.data:
                    if 'location_type_id' in obj:
                        if obj['location_type_id'] != -1:
                            try:
                                type = LocationTypes.objects.get(id=obj['location_type_id'])
                                typeSerializer = LocationTypeSerializer(type, many=False)
                                obj['container_type_custom'] = typeSerializer.data['display_name']
                                obj['container_type_desc'] = typeSerializer.data['description']
                                obj['container_type_id'] = typeSerializer.data['id']
                                obj['container_type_archived'] = typeSerializer.data['archived']
                            except LocationTypes.DoesNotExist:
                                obj['container_type_custom'] = "Not Found"
                        else:
                            obj['container_type_custom'] = "Not Defined"
                    else:
                        obj['container_type_custom'] = "Key Error"
                return Response(serializer.data, status=status.HTTP_200_OK)
        id = data['id']
        if 'name' in data:
            Location.objects.filter(id=id).update(name=data['name'])
        if 'container_column' in data:
            Location.objects.filter(id=id).update(container_column=data['container_column'])
        if 'container_row' in data:
            Location.objects.filter(id=id).update(container_row=data['container_row'])
        if 'capacity_full' in data:
            Location.objects.filter(id=id).update(capacity_full=data['capacity_full'])
        if 'container_number' in data:
            Location.objects.filter(id=id).update(container_number=data['container_number'])
        if 'container_column' in data:
            Location.objects.filter(id=id).update(container_column=data['container_column'])
        if 'location_type_id' in data:
            if data['location_type_id'] != -1:
                Location.objects.filter(id=id).update(location_type_id=data['location_type_id'])
        if 'container_placement_number' in data:
            Location.objects.filter(id=id).update(container_placement_number=data['container_placement_number'])
        if 'room' in data:
            Location.objects.filter(id=id).update(room=data['room'])
        if 'archived' in data:
            Location.objects.filter(id=id).update(archived=data['archived'])
        updatedObject = Location.objects.get(id=id)
        serializer = LocationSerializer(updatedObject, many=False)
        retObj = serializer.data
        if fetchRest == 3:
            qsArchived = Location.objects.filter(archived=1)
            qsNotArchived = Location.objects.filter(archived=0)
            s1 = LocationSerializer(qsArchived, many=True)
            s2 = LocationSerializer(qsNotArchived, many=True)
            for obj in s2.data:
                if 'location_type_id' in obj:
                    if obj['location_type_id'] != -1:
                        try:
                            type = LocationTypes.objects.get(id=obj['location_type_id'])
                            typeSerializer = LocationTypeSerializer(type, many=False)
                            obj['container_type_custom'] = typeSerializer.data['display_name']
                            obj['container_type_desc'] = typeSerializer.data['description']
                            obj['container_type_id'] = typeSerializer.data['id']
                            obj['container_type_archived'] = typeSerializer.data['archived']
                        except LocationTypes.DoesNotExist:
                            obj['container_type_custom'] = "Not Found"
                    else:
                        obj['container_type_custom'] = "Not Defined"
                else:
                    obj['container_type_custom'] = "Key Error"
            return Response({'locations': s2.data, 'archived': s1.data}, status=status.HTTP_200_OK)
        if fetchRest == 1:
            qs = Location.objects.filter(archived=0)
            retSerializer = LocationSerializer(qs, many=True)
            for obj in retSerializer.data:
                if 'location_type_id' in obj:
                    if obj['location_type_id'] != -1:
                        try:
                            type = LocationTypes.objects.get(id=obj['location_type_id'])
                            typeSerializer = LocationTypeSerializer(type, many=False)
                            obj['container_type_custom'] = typeSerializer.data['display_name']
                            obj['container_type_desc'] = typeSerializer.data['description']
                            obj['container_type_id'] = typeSerializer.data['id']
                            obj['container_type_archived'] = typeSerializer.data['archived']
                        except LocationTypes.DoesNotExist:
                            obj['container_type_custom'] = "Not Found"
                    else:
                        obj['container_type_custom'] = "Not Defined"
                else:
                    obj['container_type_custom'] = "Key Error"
            try:
                updatedType = LocationTypes.objects.get(id=retObj['location_type_id'])
                typeSer = LocationTypeSerializer(updatedType, many=False)
                retObj['container_type_custom'] = typeSer.data['display_name']
                retObj['container_type_desc'] = typeSer.data['description']
                retObj['container_type_id'] = typeSer.data['id']
                retObj['container_type_archived'] = typeSer.data['archived']
                # print("Done with adding custom fields")
            except LocationTypes.DoesNotExist:
                retObj['container_type_custom'] = "Not Found"
                print("No types found")
            return Response({'all': retSerializer.data,  'updated': retObj}, status=status.HTTP_200_OK)
        return Response(serializer.data, status=status.HTTP_200_OK)
    else:
        return Response(f"{request.method} not allowed.", status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def fetch_part_stock(request, partId):
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    inventory = list(Inventory.objects.filter(part_id=partId))
    if inventory == None:
        return Response("No current inventory for this part", status=status.HTTP_204_NO_CONTENT)
    checked = []
    stockList = []
    for i in inventory:
        if i.id not in checked:
            sum = 0
            stock = list(Inventory.objects.filter(location_id=i.location_id).filter(part_id=partId))
            for j in stock:
                sum += j.quantity

            location = Location.objects.get(id=i.location_id)
            l_serializer = LocationSerializer(location, many=False)
            owner = Customer.objects.get(id=i.owner_id)
            c_serializer = CustomerSerializer(owner, many=False)
            ok = True
            for f in stockList:
                if i.location_id == f["location"]["id"]:
                    ok = False
            if ok:
                entry = {
                    "location": l_serializer.data,
                    "owner": c_serializer.data,
                    "quantity": sum
                }
                stockList.append(entry)
        checked.append(i.id)

    return Response(stockList, status=status.HTTP_200_OK)


@api_view(('POST', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def add_inv_entry(request):
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    data = list(request.data.values())
    if data == None:
        return Response("No data sent to server", status=status.HTTP_400_BAD_REQUEST)
    if len(data) > 4:
        return Response("Too much data sent to server", status=status.HTTP_400_BAD_REQUEST)

    inv_entry = Inventory.objects.create(part_id=data[0], owner_id=data[1], location_id=data[2], quantity=data[3])
    serializer = InventorySerializer(inv_entry, many=False)
    return Response(serializer.data, status=status.HTTP_201_CREATED)
