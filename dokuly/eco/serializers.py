from rest_framework import serializers
from .models import Eco, AffectedItem
from profiles.serializers import ProfileSerializer
from parts.serializers import PartBomSerializer
from pcbas.serializers import PcbaBomSerializer
from assemblies.serializers import AssemblyBomSerializer
from documents.serializers import DocumentTableSerializer


class EcoSerializer(serializers.ModelSerializer):
    responsible = ProfileSerializer(read_only=True)
    quality_assurance = ProfileSerializer(read_only=True)
    description_text = serializers.SerializerMethodField()

    class Meta:
        model = Eco
        fields = '__all__'

    def get_description_text(self, obj):
        """Return the markdown text from the description field."""
        if obj.description:
            return obj.description.text
        return ""


class AffectedItemSerializer(serializers.ModelSerializer):
    """Basic serializer for AffectedItem."""

    class Meta:
        model = AffectedItem
        fields = '__all__'


class AffectedItemDetailSerializer(serializers.ModelSerializer):
    """Serializer with nested item details for display."""
    part = PartBomSerializer(read_only=True)
    pcba = PcbaBomSerializer(read_only=True)
    assembly = AssemblyBomSerializer(read_only=True)
    document = DocumentTableSerializer(read_only=True)

    class Meta:
        model = AffectedItem
        fields = '__all__'