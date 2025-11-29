from rest_framework import serializers
from documents.models import Document, MarkdownText
from documents.models import Document_Prefix, Protection_Level
from documents.models import Reference_List
from projects.models import Project, Tag
# from .models import Employee

# User Serializer


class DocumentTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "color", "project"]


class ProtectionLevelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Protection_Level
        fields = '__all__'


class DocumentSerializer(serializers.ModelSerializer):
    tags = DocumentTagSerializer(many=True)
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
        model = Document
        fields = '__all__'


class MarkdownTextSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarkdownText
        fields = ['text', 'created_at', 'last_updated', 'created_by']


class MarkdownTabSerializer(serializers.ModelSerializer):
    class Meta:
        model = MarkdownText
        fields = ['id', 'title', 'text', 'last_updated', 'created_by']


class DocumentTableSerializer(serializers.ModelSerializer):
    """This serializer is used to only send the fields that are needed for the table view of documents.
    """
    tags = DocumentTagSerializer(many=True)

    class Meta:
        model = Document
        fields = ['id', 'title',
                  'part_number',
                  'full_doc_number', 'release_state',
                  'released_date', 'project',
                  'last_updated',
                  'formatted_revision',
                  'revision_count_major',
                  'revision_count_minor',
                  'is_latest_revision', 'is_archived', 'tags',
                  'thumbnail']


class DocumentPrefixSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document_Prefix
        fields = '__all__'


class ReferenceListSerializer(serializers.ModelSerializer):
    """This serializer is used to transmit a list of documents with the added field of specificeiton, which is stored in the reference list model.
    """
    class Meta:
        model = Document
        fields = '__all__'
        # Additional field to be added:
        # extra_kwargs = 'is_specificaiton'


class ProjectTitleSerializerForDocuments(serializers.ModelSerializer):
    """Small serializer to include project data in e.g. pcba tables.
    """
    class Meta:
        model = Project
        fields = ('id', 'title',)


class DocumentSerializerWithProject(serializers.ModelSerializer):
    project = ProjectTitleSerializerForDocuments()

    class Meta:
        model = Document
        fields = [
            "id",
            "title",
            "full_doc_number",
            "revision",
            "release_state",
            "is_latest_revision",
            "released_date",
            "project",
            "last_updated",
            "is_archived",
            "project",
        ]


class GlobalSearchDocumentSerializer(serializers.ModelSerializer):
    """Serializer for global search that includes documents."""
    item_type = serializers.SerializerMethodField()
    project_title = serializers.ReadOnlyField(source="project.title")
    full_part_number = serializers.ReadOnlyField(source="full_doc_number")
    display_name = serializers.ReadOnlyField(source="title")

    def get_item_type(self, obj):
        return "Document"

    class Meta:
        model = Document
        fields = [
            "id",
            "part_number",
            "full_part_number",
            "full_doc_number",
            "formatted_revision",
            "revision_count_major",
            "revision_count_minor",
            "display_name",
            "title",
            "description",
            "project",
            "project_title",
            "is_latest_revision",
            "item_type",
            "thumbnail",
            "release_state",
        ]
