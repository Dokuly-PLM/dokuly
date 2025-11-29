from rest_framework import serializers
from .models import Eco
from profiles.serializers import ProfileSerializer


class EcoSerializer(serializers.ModelSerializer):
    responsible = ProfileSerializer(read_only=True)
    description_text = serializers.SerializerMethodField()

    class Meta:
        model = Eco
        fields = '__all__'

    def get_description_text(self, obj):
        """Return the markdown text from the description field."""
        if obj.description:
            return obj.description.text
        return ""