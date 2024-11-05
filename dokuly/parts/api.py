from parts.models import Part
from rest_framework import viewsets, permissions
from .serializers import PartSerializer
from rest_framework.permissions import IsAuthenticated
from knox.auth import TokenAuthentication
from django.shortcuts import render
from django.shortcuts import render
from rest_framework.decorators import action
from django.http import HttpResponse
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from rest_framework import renderers
from .serializers import PartSerializer

# Create your views here.


class PartViewSet(viewsets.ModelViewSet):
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Part.objects.all()
    serializer_class = PartSerializer

    # Gets the alt parts for a part
    @action(detail=True, renderer_classes=[renderers.StaticHTMLRenderer])
    def alt_parts_for_part(self, request, partIds):
        data = self.filter(part_number__in=partIds)
        serializer = PartSerializer(data, many=True)
        return Response(serializer.data)

    def perform_create(self, serializer):
        serializer.save()
