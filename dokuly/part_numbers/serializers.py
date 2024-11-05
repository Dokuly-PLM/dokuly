from rest_framework import serializers
from part_numbers.models import PartNumber
from rest_framework.fields import ListField

# A basic serializer

class PartNumberSerializer(serializers.ModelSerializer):

    class Meta:
        model = PartNumber
        fields = '__all__'