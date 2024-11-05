from rest_framework import serializers
from rest_framework.exceptions import ValidationError

from inventory.models import Inventory, Location, LocationTypes

class LocationTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = LocationTypes
        fields = '__all__'

class LocationSerializer(serializers.ModelSerializer):
    location_type_v2 = serializers.PrimaryKeyRelatedField(queryset=LocationTypes.objects.all())

    class Meta:
        model = Location
        fields = '__all__'

class OptimizedLocationSerializer(serializers.ModelSerializer):
    # Define custom serializer methods for the container type fields
    container_type_custom = serializers.SerializerMethodField()
    container_type_desc = serializers.SerializerMethodField()
    container_type_id = serializers.SerializerMethodField()
    container_type_archived = serializers.SerializerMethodField()

    class Meta:
        model = Location
        fields = ['id', 'name', 'container_type_custom', 'container_type_desc', 'container_type_id', 'container_type_archived', 'archived']

    def get_container_type_custom(self, obj):
        # Prioritize new data, but return legacy data if new data is not available
        if obj.location_type_v2:
            return obj.location_type_v2.display_name
        elif obj.location_type_id != -1:
            return "Legacy: " + obj.location_type
        else:
            return "Not Defined"

    def get_container_type_desc(self, obj):
        # Prioritize new data, but return legacy data if new data is not available
        if obj.location_type_v2:
            return obj.location_type_v2.description
        elif obj.location_type_id != -1:
            return "Legacy: " + obj.location_type
        else:
            return "Not Defined"

    def get_container_type_id(self, obj):
        # Prioritize new data, but return legacy data if new data is not available
        if obj.location_type_v2:
            return obj.location_type_v2.id
        else:
            return obj.location_type_id
        
    def get_container_type_archived(self, obj):
        # Prioritize new data, but return legacy data if new data is not available
        if obj.location_type_v2:
            return obj.location_type_v2.archived
        elif obj.location_type_id != -1:
            # For legacy data, return False as we don't have an archived status for old location types
            return False
        else:
            return True
    
class InventorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Inventory
        fields = '__all__'


class LocationSerializer(serializers.ModelSerializer):
    location_type_v2 = LocationTypeSerializer()

    class Meta:
        model = Location
        fields = ['id', 'name', 'location_type_v2', 'location_column', 'location_row', 'location_number', 'capacity_full', 'notes']

class OptimizedLocationSerializer(serializers.ModelSerializer):
    container_type_custom = serializers.CharField(source='location_type_v2.display_name', default="Not Defined")
    container_type_desc = serializers.CharField(source='location_type_v2.description', default="Not Defined")
    container_type_id = serializers.IntegerField(source='location_type_v2.id', default=-1)

    class Meta:
        model = Location
        fields = ['id', 'name', 'container_type_custom', 'container_type_desc', 'container_type_id', 'location_column', 'location_row', 'location_number', 'notes']

