from documents.serializers import MarkdownTextSerializer
from rest_framework import serializers


from parts.models import Part, PartType
from pcbas.models import Pcba
from assemblies.models import Assembly
from projects.serializers import ProjectTitleSerializer, TagSerializer

# PartType ------------------------------------------------------------------------


class PartTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = PartType
        fields = "__all__"


# Part ----------------------------------------------------------------------------
class AlternativePartSerializer(serializers.ModelSerializer):
    """
    Serializer for the alternative_parts ManyToManyField of the Part model.
    Serializes the mpn, full_part_number, and display_name fields of the alternative parts.
    """

    id = serializers.IntegerField()
    mpn = serializers.CharField()
    full_part_number = serializers.CharField()
    image_url = serializers.CharField()
    display_name = serializers.CharField()

    class Meta:
        model = Part
        fields = ("id", "mpn", "image_url", "full_part_number", "display_name")


class PartSerializer(serializers.ModelSerializer):
    """
    Serializer for the Part model. Also adds the supplier_name field to the
    serialized data.
    Serializes all fields of a Part object and includes the serialized data of the
    alternative parts using the AlternativePartSerializer.
    """

    part_type = PartTypeSerializer()
    alternative_parts_v2 = AlternativePartSerializer(many=True)
    supplier_name = serializers.CharField(source="supplier.name", read_only=True)
    organization = serializers.SerializerMethodField()
    thumbnail_uri = serializers.CharField(source="image.uri", read_only=True)
    markdown_notes = MarkdownTextSerializer()
    tags = TagSerializer(many=True)

    def get_organization(self, obj):
        """Get organization revision settings for the current user."""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            try:
                from profiles.models import Profile
                profile = Profile.objects.get(user=request.user)
                if profile.organization_id:
                    from organizations.models import Organization
                    org = Organization.objects.get(id=profile.organization_id)
                    return {
                        'use_number_revisions': org.use_number_revisions,
                        'revision_format': org.revision_format,
                    }
            except:
                pass
        return None

    class Meta:
        model = Part
        fields = "__all__"


class PartSerializerNoAlternate(serializers.ModelSerializer):
    """All part info, not loading alternate parts."""
    organization = serializers.SerializerMethodField()

    class Meta:
        model = Part
        fields = [
            "id",
            "part_number",
            "full_part_number",
            "display_name",
            "formatted_revision",
            "revision_count_major",
            "revision_count_minor",
            "part_type",
            "release_state",
            "released_date",
            "revision_notes",
            "description",
            "unit",
            "currency",
            "is_latest_revision",
            "mpn",
            "image_url",
            "thumbnail",
            "manufacturer",
            "datasheet",
            "is_archived",
            "project",
            "part_information",
            "price_history",
            "stock",
            "price",
            "organization",
        ]

    def get_organization(self, obj):
        """Get organization revision settings for the current user."""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            try:
                from profiles.models import Profile
                profile = Profile.objects.get(user=request.user)
                if profile.organization_id:
                    from organizations.models import Organization
                    org = Organization.objects.get(id=profile.organization_id)
                    return {
                        'use_number_revisions': org.use_number_revisions,
                        'revision_format': org.revision_format,
                    }
            except:
                pass
        return None


class PartTableSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True)
    organization = serializers.SerializerMethodField()

    class Meta:
        model = Part
        fields = [
            "id",
            "part_number",
            "full_part_number",
            "mpn",
            "image_url",
            "thumbnail",
            "display_name",
            "part_type",
            "release_state",
            "released_date",
            "project",
            "last_updated",
            "formatted_revision",
            "revision_count_major",
            "revision_count_minor",
            "is_latest_revision",
            "is_archived",
            "manufacturer",
            "current_total_stock",
            "external_part_number",
            "tags",
            "organization",
        ]

    def get_organization(self, obj):
        """Get organization revision settings for the current user."""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            try:
                from profiles.models import Profile
                profile = Profile.objects.get(user=request.user)
                if profile.organization_id:
                    from organizations.models import Organization
                    org = Organization.objects.get(id=profile.organization_id)
                    return {
                        'use_number_revisions': org.use_number_revisions,
                        'revision_format': org.revision_format,
                    }
            except:
                pass
        return None


class PartSerializerWithProject(serializers.ModelSerializer):
    project = ProjectTitleSerializer()

    class Meta:
        model = Part
        fields = [
            "id",
            "part_number",
            "full_part_number",
            "display_name",
            "formatted_revision",
            "revision_count_major",
            "revision_count_minor",
            "release_state",
            "is_latest_revision",
            "mpn",
            "image_url",
            "thumbnail",
            "unit",
            "part_type",
            "thumbnail",
            "project",
        ]


class PartThumbnailTitleSerializer(serializers.ModelSerializer):
    project = ProjectTitleSerializer()

    class Meta:
        model = Part
        fields = [
            "id",
            "display_name",
            "thumbnail",
            "full_part_number",
            "project",
            "formatted_revision",
            "revision_count_major",
            "revision_count_minor",
            "serial_number_counter",
            "serial_number_offset",
            "serial_number_prefix",
        ]


class PartBomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Part
        fields = [
            "id",
            "part_number",
            "full_part_number",
            "display_name",
            "formatted_revision",
            "revision_count_major",
            "revision_count_minor",
            "release_state",
            "is_latest_revision",
            "mpn",
            "image_url",
            "unit",
            "part_type",
            "manufacturer",
            "thumbnail",
            "current_total_stock",
            "minimum_stock_level",
        ]

# For ASM BOM ------------------------------------------------------------------------


class SimplePcbaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pcba
        fields = (
            "id",
            "part_number",
            "full_part_number",
            "display_name",
            "formatted_revision",
            "revision_count_major",
            "revision_count_minor",
            "release_state",
            "is_latest_revision",
            "thumbnail",
        )  # Only the necessary fields


class SimplePartSerializer(serializers.ModelSerializer):
    class Meta:
        model = Part
        fields = (
            "id",
            "part_number",
            "full_part_number",
            "display_name",
            "formatted_revision",
            "revision_count_major",
            "revision_count_minor",
            "release_state",
            "is_latest_revision",
            "mpn",
            "image_url",
            "thumbnail",
            "unit",
            "part_type",
            "thumbnail",
        )


class BomPartSerializer(serializers.ModelSerializer):
    class Meta:
        model = Part
        fields = (
            "id",
            "part_number",
            "full_part_number",
            "part_type",
            "display_name",
            "formatted_revision",
            "revision_count_major",
            "revision_count_minor",
            "release_state",
            "is_latest_revision",
            "mpn",
            "image_url",
            "unit",
            "git_link",
            "manufacturer",
            "datasheet",
            "part_information",
            "thumbnail",
            "is_rohs_compliant",
        )


class SimpleAsmSerializer(serializers.ModelSerializer):
    class Meta:
        model = Assembly
        fields = (
            "id",
            "part_number",
            "full_part_number",
            "display_name",
            "formatted_revision",
            "revision_count_major",
            "revision_count_minor",
            "is_latest_revision",
            "release_state",
            "price",
            "model_url",
            "thumbnail",
        )


# For global part search ------------------------------------------------------------------------


class GlobalSearchPartSerializer(serializers.ModelSerializer):
    item_type = serializers.SerializerMethodField()
    project_title = serializers.ReadOnlyField(source="project.title")

    def get_item_type(self, obj):
        return "Part"

    class Meta:
        model = Part
        fields = [
            "id",
            "full_part_number",
            "mpn",
            "formatted_revision",
            "revision_count_major",
            "revision_count_minor",
            "display_name",
            "description",
            "manufacturer",
            "project",
            "project_title",
            "is_latest_revision",
            "item_type",
            "serial_number_counter",
            "serial_number_offset",
            "serial_number_prefix",
        ]


class GlobalSearchPcbaSerializer(serializers.ModelSerializer):
    item_type = serializers.SerializerMethodField()
    project_title = serializers.ReadOnlyField(source="project.title")

    def get_item_type(self, obj):
        return "PCBA"

    class Meta:
        model = Pcba
        fields = [
            "id",
            "full_part_number",
            "formatted_revision",
            "revision_count_major",
            "revision_count_minor",
            "display_name",
            "description",
            "project",
            "project_title",
            "is_latest_revision",
            "item_type",
            "serial_number_counter",
            "serial_number_offset",
            "serial_number_prefix",
        ]


class GlobalSearchAssemblySerializer(serializers.ModelSerializer):
    item_type = serializers.SerializerMethodField()
    project_title = serializers.ReadOnlyField(source="project.title")

    def get_item_type(self, obj):
        return "Assembly"

    class Meta:
        model = Assembly
        fields = [
            "id",
            "full_part_number",
            "formatted_revision",
            "revision_count_major",
            "revision_count_minor",
            "display_name",
            "description",
            "project",
            "project_title",
            "is_latest_revision",
            "item_type",
            "serial_number_counter",
            "serial_number_offset",
            "serial_number_prefix",
        ]
