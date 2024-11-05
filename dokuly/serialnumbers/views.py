from django.shortcuts import render
from django.http import HttpResponse
from .models import SerialNumber
from assemblies.models import Assembly
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from .serializers import SerialNumberSerializer
from django.core import serializers
from django.forms.models import model_to_dict
from profiles.views import check_authentication
from django.contrib.auth.decorators import login_required

# Create your views here.

@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def fetch_serial_numbers_asm(request, asmId):
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    if not check_authentication(request.user):
        return Response("Not authenticated", status=status.HTTP_403_FORBIDDEN)
    if asmId == None:
        return Response("Invalid id", status=status.HTTP_400_BAD_REQUEST)
    qs = SerialNumber.objects.filter(assembly=asmId)
    serializer = SerialNumberSerializer(qs, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)

@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def fetch_serial_number_value(request, asmId):
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    if not check_authentication(request.user):
        return Response("Not authenticated", status=status.HTTP_403_FORBIDDEN)
    serial_number = len(SerialNumber.objects.filter(assembly=asmId))
    return Response(serial_number+1, status=status.HTTP_200_OK)