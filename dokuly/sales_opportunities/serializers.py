from rest_framework import serializers
from .models import SalesOpportunity


class SalesOpportunitySerializer(serializers.ModelSerializer):
    class Meta:
        model = SalesOpportunity
        fields = '__all__'
