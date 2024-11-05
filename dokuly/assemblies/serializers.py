from rest_framework import serializers
from assemblies.models import Assembly
from documents.serializers import MarkdownTextSerializer
from projects.serializers import ProjectTitleSerializer, TagSerializer


class AssemblySerializer(serializers.ModelSerializer):

    markdown_notes = MarkdownTextSerializer()
    tags = TagSerializer(many=True)

    class Meta:
        model = Assembly
        fields = '__all__'


class AssemblyTableSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True)

    class Meta:
        model = Assembly
        fields = (
            "id",
            "part_number",
            "full_part_number",
            "display_name",
            "revision",
            "release_state",
            "released_date",
            "last_updated",
            "thumbnail",
            "project",
            "tags"
        )


class AssemblyReleaseStateManagementSerializer(serializers.ModelSerializer):

    class Meta:
        model = Assembly
        fields = (
            "id",
            "release_state",
            "released_date",
            "part_number",
            "full_part_number",
            "display_name",
            "revision"
        )


class AssemblySerializerWithProject(serializers.ModelSerializer):
    project = ProjectTitleSerializer()

    class Meta:
        model = Assembly
        fields = (
            "id",
            "part_number",
            "full_part_number",
            "display_name",
            "revision",
            "release_state",
            "is_latest_revision",
            "project",
        )


class AssemblyThumbnailTitleSerializer(serializers.ModelSerializer):
    project = ProjectTitleSerializer()

    class Meta:
        model = Assembly
        fields = [
            "id",
            "display_name",
            "thumbnail",
            "full_part_number",
            "project",
            "revision",
            "serial_number_counter",
            "serial_number_offset",
            "serial_number_prefix",
        ]


class AssemblyBomSerializer(serializers.ModelSerializer):

    class Meta:
        model = Assembly
        fields = [
            "id",
            "part_number",
            "full_part_number",
            "display_name",
            "revision",
            "release_state",
            "released_date",
            "last_updated",
            "thumbnail",
            "current_total_stock",
            "minimum_stock_level",
        ]
