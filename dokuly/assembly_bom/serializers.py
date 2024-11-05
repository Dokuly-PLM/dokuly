from rest_framework import serializers
from assembly_bom.models import Assembly_bom, Bom_item
from parts.models import Part
from rest_framework.fields import ListField
from pcbas.serializers import PcbaBomSerializer
from assemblies.serializers import AssemblyBomSerializer
# from .models import Employee
from purchasing.models import Supplier, Price


class Assembly_bomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assembly_bom
        fields = '__all__'


class BomItemSerializer(serializers.ModelSerializer):

    class Meta:
        model = Bom_item
        fields = '__all__'


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = ['id', 'name', 'thumbnail']


class PriceSerializer(serializers.ModelSerializer):
    supplier = SupplierSerializer()

    class Meta:
        model = Price
        fields = ['price',  'supplier', 'is_latest_price',
                  'minimum_order_quantity', 'currency']


class PartBomSerializerWithSupplier(serializers.ModelSerializer):
    prices = PriceSerializer(many=True, read_only=True)  # Use the related_name 'prices'

    class Meta:
        model = Part
        fields = [
            "id",
            "part_number",
            "full_part_number",
            "display_name",
            "revision",
            "release_state",
            "is_latest_revision",
            "mpn",
            "image_url",
            "unit",
            "part_type",
            "manufacturer",
            "thumbnail",
            "current_total_stock",
            "minimum_stock_level",
            "prices",
        ]


class BomItemSerializerWithParts(serializers.ModelSerializer):
    part = PartBomSerializerWithSupplier()
    pcba = PcbaBomSerializer()
    assembly = AssemblyBomSerializer()

    class Meta:
        model = Bom_item
        fields = [
            "assembly",
            "part",
            "pcba",
            "bom",
            "designator",
            "id",
            "is_mounted",
            "quantity",
        ]
