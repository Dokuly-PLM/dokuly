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
                  'full_doc_number', 'release_state',
                  'released_date', 'project',
                  'last_updated',
                  'formatted_revision',
                  'revision_count_major',
                  'revision_count_minor',
                  'is_latest_revision', 'is_archived', 'tags']


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
