from rest_framework import serializers
from projects.models import Project, Task, Gantt, Tag
from customers.serializers import CustomerSerializer
from .models import Issues
from documents.serializers import MarkdownTextSerializer
from accounts.serializers import UserSerializer
from parts.models import Part
from pcbas.models import Pcba
from assemblies.models import Assembly
from documents.models import Document
from profiles.serializers import ProfileSerializer


class TaskTagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name', 'color']


class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = '__all__'


class ProjectSerializerWithCustomer(serializers.ModelSerializer):
    customer = CustomerSerializer(read_only=True)
    project_owner = ProfileSerializer(read_only=True)

    class Meta:
        model = Project
        fields = '__all__'


class ProjectTitleSerializer(serializers.ModelSerializer):
    """Small serializer to include project data in e.g. pcba tables.
    """
    class Meta:
        model = Project
        fields = ('id', 'title',)


class TaskSerializer(serializers.ModelSerializer):
    tags = TaskTagSerializer(many=True)

    class Meta:
        model = Task
        fields = '__all__'


class TasktimereportSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ["id", "title", "project_id", "is_billable", "is_active"]


class GanttSerializer(serializers.ModelSerializer):
    class Meta:
        model = Gantt
        fields = '__all__'


class IssuePartSerializer(serializers.ModelSerializer):
    class Meta:
        model = Part
        fields = ['id', 'revision', 'full_part_number']


class IssuePcbaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pcba
        fields = ['id', 'revision', 'full_part_number']


class IssueAssemblySerializer(serializers.ModelSerializer):
    class Meta:
        model = Assembly
        fields = ['id', 'revision', 'full_part_number']


class IssueDocumentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Document
        fields = ['id', 'revision', 'full_doc_number']


class IssuesSerializer(serializers.ModelSerializer):
    description = MarkdownTextSerializer(read_only=True)
    created_by = UserSerializer(read_only=True)
    closed_by = UserSerializer(read_only=True)

    closed_in_part = IssuePartSerializer(read_only=True)
    closed_in_pcba = IssuePcbaSerializer(read_only=True)
    closed_in_assembly = IssueAssemblySerializer(read_only=True)
    closed_in_document = IssueDocumentSerializer(read_only=True)

    tags = TaskTagSerializer(many=True)

    class Meta:
        model = Issues
        fields = '__all__'


class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ["id", "name", "color", "project"]


class TagSerializerFull(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = '__all__'
