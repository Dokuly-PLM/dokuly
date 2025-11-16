from rest_framework import serializers
from assemblies.models import Assembly
from documents.serializers import MarkdownTextSerializer
from projects.serializers import ProjectTitleSerializer, TagSerializer


class AssemblySerializer(serializers.ModelSerializer):

    markdown_notes = MarkdownTextSerializer()
    tags = TagSerializer(many=True)
    organization = serializers.SerializerMethodField()

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
        model = Assembly
        fields = '__all__'


class AssemblyTableSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True)
    organization = serializers.SerializerMethodField()

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
            "release_state",
            "released_date",
            "last_updated",
            "thumbnail",
            "project",
            "tags",
            "organization"
        )

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
