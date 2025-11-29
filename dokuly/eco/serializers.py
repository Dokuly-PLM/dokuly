from rest_framework import serializers
from .models import Eco


class EcoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Eco
        fields = '__all__'
