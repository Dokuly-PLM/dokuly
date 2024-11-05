from rest_framework import serializers
from .models import SerialNumber


class SerialNumberSerializer(serializers.ModelSerializer):
    class Meta:
        model = SerialNumber
        fields = '__all__'
