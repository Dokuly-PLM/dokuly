from rest_framework import serializers

from .models import Pcba, Project
from projects.serializers import ProjectTitleSerializer, TagSerializer
from documents.serializers import MarkdownTextSerializer
from customers.models import Customer

# from .models import Employee

# User Serializer

# Default serializer for fetching the main pcba info.


class PcbaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pcba
        # fields = '__all__'
        exclude = [
            "pcb",
            "is_archived",
            "assembly_pdf",
            "manufacture_pdf",
            "layout_image",
            "schematic_pdf",
            "schematic_pdf_monochrome",
            "document_file",
            "generic_files",
        ]


class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = ("id", "name")


class ProjectTitleSerializer(serializers.ModelSerializer):
    customer = CustomerSerializer()  # Nested serialization

    class Meta:
        model = Project
        fields = ("id", "title", "customer")


class PcbaTableSerializer(serializers.ModelSerializer):
    project = ProjectTitleSerializer()
    tags = TagSerializer(many=True)

    class Meta:
        model = Pcba
        fields = (
            "id",
            "part_number",
            "full_part_number",
            "display_name",
            "revision",
            "release_state",
            "released_date",
            "last_updated",
            "pcb_renders",
            "thumbnail",
            "project",
            "tags",
        )


class PcbaSerializerFull(serializers.ModelSerializer):
    """Serializer with every field in the model."""

    markdown_notes = MarkdownTextSerializer()
    tags = TagSerializer(many=True)

    class Meta:
        model = Pcba
        fields = "__all__"


class PcbaSerializerWithProject(serializers.ModelSerializer):
    project = ProjectTitleSerializer()

    class Meta:
        model = Pcba
        fields = (
            "id",
            "part_number",
            "full_part_number",
            "display_name",
            "revision",
            "release_state",
            "is_latest_revision",
            "thumbnail",
            "project",
        )


class PcbaThumbnailTitleSerializer(serializers.ModelSerializer):
    project = ProjectTitleSerializer()

    class Meta:
        model = Pcba
        fields = ("id", "display_name", "thumbnail",
                  "full_part_number", "project", "revision")


class PcbaBomSerializer(serializers.ModelSerializer):

    class Meta:
        model = Pcba
        fields = (
            "id",
            "part_number",
            "full_part_number",
            "display_name",
            "revision",
            "release_state",
            "is_latest_revision",
            "thumbnail",
            "current_total_stock",
            "minimum_stock_level",
            "serial_number_counter",
            "serial_number_offset",
            "serial_number_prefix",
        )
