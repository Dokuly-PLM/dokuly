from .models import Inventory, Location
from rest_framework import viewsets, permissions
from .serializers import LocationSerializer, InventorySerializer
from rest_framework.permissions import IsAuthenticated
from knox.auth import TokenAuthentication


class InventoryViewSet(viewsets.ModelViewSet):
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Inventory.objects.all()
    serializer_class = InventorySerializer

    def perform_create(self, serializer):
        serializer.save()


class LocationViewSet(viewsets.ModelViewSet):
    permissions_classes = [
        permissions.IsAuthenticated
    ]
    queryset = Location.objects.all()
    serializer_class = LocationSerializer

    def perform_create(self, serializer):
        serializer.save()
