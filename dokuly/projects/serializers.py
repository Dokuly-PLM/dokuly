from rest_framework import serializers
from projects.models import Project, Task, Gantt, Tag
from customers.serializers import CustomerSerializer
from .models import Issues
from .workflowsModel import Workflow, WorkflowAction, WorkflowExecution, WorkflowAuditLog
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
    
    # Workflow tracking fields
    created_by_workflow_name = serializers.CharField(source='created_by_workflow.name', read_only=True)
    workflow_execution_id = serializers.IntegerField(source='workflow_execution.id', read_only=True)

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


class WorkflowActionSerializer(serializers.ModelSerializer):
    """Serializer for WorkflowAction model."""
    class Meta:
        model = WorkflowAction
        fields = '__all__'
        extra_kwargs = {
            'workflow': {'required': False}  # Workflow is set in create/update methods
        }


class WorkflowSerializer(serializers.ModelSerializer):
    """Serializer for Workflow model with nested actions."""
    actions = WorkflowActionSerializer(many=True, read_only=True)
    created_by = UserSerializer(read_only=True)
    organization_name = serializers.CharField(source='organization.name', read_only=True)
    project_title = serializers.CharField(source='project.title', read_only=True)
    
    class Meta:
        model = Workflow
        fields = '__all__'


class WorkflowCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating workflows with actions."""
    actions = WorkflowActionSerializer(many=True, required=False)
    
    class Meta:
        model = Workflow
        fields = '__all__'
    
    def create(self, validated_data):
        actions_data = validated_data.pop('actions', [])
        workflow = Workflow.objects.create(**validated_data)
        
        # Create actions without workflow field (it's set automatically)
        for action_data in actions_data:
            # Convert to dict if needed and remove workflow field
            if isinstance(action_data, dict):
                action_dict = dict(action_data)
            else:
                action_dict = dict(action_data)
            action_dict.pop('workflow', None)
            WorkflowAction.objects.create(workflow=workflow, **action_dict)
        
        return workflow
    
    def update(self, instance, validated_data):
        actions_data = validated_data.pop('actions', None)
        
        # Update workflow fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        
        # Update actions if provided
        if actions_data is not None:
            # Delete existing actions
            instance.actions.all().delete()
            # Create new actions without workflow field (it's set automatically)
            for action_data in actions_data:
                # Convert to dict if needed and remove workflow field
                if isinstance(action_data, dict):
                    action_dict = dict(action_data)
                else:
                    action_dict = dict(action_data)
                action_dict.pop('workflow', None)
                WorkflowAction.objects.create(workflow=instance, **action_dict)
        
        return instance


class WorkflowExecutionSerializer(serializers.ModelSerializer):
    """Serializer for WorkflowExecution model."""
    workflow_name = serializers.CharField(source='workflow.name', read_only=True)
    executed_by_username = serializers.CharField(source='executed_by.username', read_only=True)
    
    class Meta:
        model = WorkflowExecution
        fields = '__all__'


class WorkflowAuditLogSerializer(serializers.ModelSerializer):
    """Serializer for WorkflowAuditLog model."""
    performed_by_username = serializers.CharField(source='performed_by.username', read_only=True)
    workflow_name_display = serializers.SerializerMethodField()
    
    class Meta:
        model = WorkflowAuditLog
        fields = '__all__'
    
    def get_workflow_name_display(self, obj):
        """Return workflow name or fallback if workflow is deleted."""
        # workflow_id is auto-generated from ForeignKey
        workflow_id = obj.workflow_id if hasattr(obj, 'workflow_id') else (obj.workflow.id if obj.workflow else None)
        return obj.workflow_name or (f"Workflow #{workflow_id}" if workflow_id else "Unknown")
