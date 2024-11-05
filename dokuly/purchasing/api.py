from purchasing.models import PurchaseOrder
from purchasing.suppliermodel import Supplier
from purchasing.priceModel import Price
from rest_framework import viewsets, permissions
from .serializers import PurchaseOrderSerializer, SupplierSerializer, PriceSerializer
from rest_framework.permissions import IsAuthenticated
from knox.auth import TokenAuthentication


class PurchaseOrderViewSet(viewsets.ModelViewSet):
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = PurchaseOrder.objects.all()
    serializer_class = PurchaseOrderSerializer

    def perform_create(self, serializer):
        serializer.save()


class SupplierViewSet(viewsets.ModelViewSet):
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer

    def perform_create(self, serializer):
        serializer.save()


class PriceViewSet(viewsets.ModelViewSet):
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Price.objects.all()
    serializer_class = PriceSerializer

    def perform_create(self, serializer):
        serializer.save()
