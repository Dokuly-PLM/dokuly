from django.shortcuts import get_object_or_404
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from .models import LocationTypes
from .serializers import LocationTypeSerializer
from django.utils import timezone
from rest_framework import status


@api_view(['GET'])
@renderer_classes((JSONRenderer,))
def get_location_types(request):
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    # Retrieve the LocationType object using the primary key (pk) provided in the request
    location_types = LocationTypes.objects.filter(archived=False)
    serializer = LocationTypeSerializer(location_types, many=True)
    return Response(serializer.data)


@api_view(['GET'])
@renderer_classes((JSONRenderer,))
def get_location_type(request, pk):
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    location_type = get_object_or_404(LocationTypes, pk=pk)
    serializer = LocationTypeSerializer(location_type)
    return Response(serializer.data)

@api_view(['POST'])
@renderer_classes((JSONRenderer,))
def create_location_type(request):
    # Check if the user is authenticated
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    # Deserialize and validate the incoming data using LocationTypeSerializer
    serializer = LocationTypeSerializer(data=request.data)

    # If the deserialized data is valid, save it to the database
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Location type created successfully", "data": serializer.data}, status=201)
    
    # If the data is not valid, return the validation errors
    return Response({"message": "Failed to create Location type", "errors": serializer.errors}, status=400)

@api_view(['PUT'])
@renderer_classes((JSONRenderer,))
def update_location_type(request, pk):
    # Check if the user is authenticated
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    # Retrieve the LocationType object using the primary key (pk) provided in the request
    location_type = get_object_or_404(LocationTypes, pk=pk)

    # Deserialize and validate the incoming data using LocationTypeSerializer
    serializer = LocationTypeSerializer(location_type, data=request.data, partial=True)

    # If the deserialized data is valid, save the updates to the database
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "Location type updated successfully", "data": serializer.data})
    
    # If the data is not valid, return the validation errors
    return Response({"message": "Failed to update location type", "errors": serializer.errors}, status=400)


@api_view(['PUT'])
@renderer_classes((JSONRenderer,))
def archive_location_type(request, pk):
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    location_type = get_object_or_404(LocationTypes, pk=pk)
    
    # Archive the location type instead of deleting it
    location_type.archived = 1
    location_type.archived_date = timezone.now()
    location_type.save()
    
    return Response({"message": "Location type archived successfully"}, status=200)
