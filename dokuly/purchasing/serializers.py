from rest_framework import serializers
from purchasing.models import PurchaseOrder, PoItem
from purchasing.suppliermodel import Supplier
from purchasing.priceModel import Price
from production.serializers import LotSerializer


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = "__all__"


class SupplierTableSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = (
            'id',
            'name',
            'default_currency',
            'thumbnail',
            'supplier_id',
        )


class PurchaseOrderTableSerializer(serializers.ModelSerializer):
    supplier = SupplierTableSerializer(read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = (
            'id',
            'supplier',
            'estimated_delivery_date',
            'order_date',
            'status',
            'is_completed',
            'total_price',
            'purchase_order_number',
            'supplier',
        )


class PurchaseOrderSerializer(serializers.ModelSerializer):
    supplier = SupplierSerializer(read_only=True)
    lot = LotSerializer(read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = "__all__"


class PriceSerializer(serializers.ModelSerializer):
    supplier = SupplierSerializer(read_only=True)

    class Meta:
        model = Price
        fields = "__all__"


class PoItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = PoItem
        fields = '__all__'


class PurchaseOrderTableSerializer(serializers.ModelSerializer):
    supplier = SupplierTableSerializer(read_only=True)

    class Meta:
        model = PurchaseOrder
        fields = (
            'id',
            'supplier',
            'estimated_delivery_date',
            'actual_delivery_date',
            'order_date',
            'status',
            'is_completed',
            'total_price',
            'purchase_order_number',
        )
