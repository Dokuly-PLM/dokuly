from rest_framework import serializers
from .models import Eco, AffectedItem
from profiles.serializers import ProfileSerializer
from parts.serializers import PartBomSerializer
from pcbas.serializers import PcbaBomSerializer
from assemblies.serializers import AssemblyBomSerializer
from documents.serializers import DocumentTableSerializer
from projects.serializers import ProjectTitleSerializer, TagSerializer
from projects.issuesModel import Issues


class EcoSerializer(serializers.ModelSerializer):
    responsible = ProfileSerializer(read_only=True)
    quality_assurance = ProfileSerializer(read_only=True)
    project = ProjectTitleSerializer(read_only=True)
    tags = TagSerializer(many=True, read_only=True)
    description_text = serializers.SerializerMethodField()

    class Meta:
        model = Eco
        fields = '__all__'

    def get_description_text(self, obj):
        """Return the markdown text from the description field."""
        if obj.description:
            return obj.description.text
        return ""


class GlobalSearchEcoSerializer(serializers.ModelSerializer):
    """Lightweight serializer for global search results."""
    item_type = serializers.SerializerMethodField()
    project_title = serializers.ReadOnlyField(source="project.title")
    full_part_number = serializers.ReadOnlyField(source="display_name")

    def get_item_type(self, obj):
        return "ECO"

    class Meta:
        model = Eco
        fields = [
            "id",
            "display_name",
            "full_part_number",
            "release_state",
            "project",
            "project_title",
            "item_type",
            "created_at",
        ]


class AffectedItemSerializer(serializers.ModelSerializer):
    """Basic serializer for AffectedItem."""

    class Meta:
        model = AffectedItem
        fields = '__all__'


class IssuePillSerializer(serializers.ModelSerializer):
    """Lightweight serializer for issue pills in ECO affected items."""
    is_closed = serializers.SerializerMethodField()

    class Meta:
        model = Issues
        fields = ['id', 'title', 'criticality', 'is_closed']

    def get_is_closed(self, obj):
        return obj.closed_at is not None


class AffectedItemDetailSerializer(serializers.ModelSerializer):
    """Serializer with nested item details for display."""
    part = PartBomSerializer(read_only=True)
    pcba = PcbaBomSerializer(read_only=True)
    assembly = AssemblyBomSerializer(read_only=True)
    document = DocumentTableSerializer(read_only=True)
    issues = IssuePillSerializer(many=True, read_only=True)

    class Meta:
        model = AffectedItem
        fields = '__all__'