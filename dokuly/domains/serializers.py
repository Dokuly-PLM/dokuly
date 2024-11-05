from rest_framework import serializers
from .models import DomainNames


class DomainSerializer(serializers.ModelSerializer):
    class Meta:
        model = DomainNames
        fields = '__all__'