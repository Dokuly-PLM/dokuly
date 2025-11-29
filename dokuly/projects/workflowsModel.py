from django.db import models
from django.contrib.auth.models import User


class Workflow(models.Model):
    """Workflow model for defining conditional automation rules.
    
    Workflows define triggers (events) and actions to execute when those triggers occur.
    Can be scoped to organization-wide or project-specific.
    """
    
    TRIGGER_CHOICES = [
        ('pcba_created', 'PCBA Created'),
        ('part_created', 'Part Created'),
        ('assembly_created', 'Assembly Created'),
        ('document_created', 'Document Created'),
        ('revision_created', 'Revision Created'),
    ]
    
    ENTITY_TYPE_CHOICES = [
        ('pcbas', 'PCBAs'),
        ('parts', 'Parts'),
        ('assemblies', 'Assemblies'),
        ('documents', 'Documents'),
        ('all', 'All'),
    ]
    
    SCOPE_TYPE_CHOICES = [
        ('organization', 'Organization-wide'),
        ('project', 'Project-specific'),
    ]
    
    # Basic fields
    name = models.CharField(max_length=500, blank=False)
    description = models.TextField(default="", blank=True)
    
    # Trigger configuration
    trigger_type = models.CharField(
        max_length=50,
        choices=TRIGGER_CHOICES,
        blank=False,
        help_text="Event type that triggers this workflow"
    )
    trigger_entity_type = models.CharField(
        max_length=50,
        choices=ENTITY_TYPE_CHOICES,
        default='all',
        help_text="Entity type filter for the trigger"
    )
    
    # Scope configuration
    scope_type = models.CharField(
        max_length=20,
        choices=SCOPE_TYPE_CHOICES,
        blank=False,
        help_text="Whether this workflow applies organization-wide or to a specific project"
    )
    organization = models.ForeignKey(
        'organizations.Organization',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='workflows',
        help_text="Organization for organization-wide workflows"
    )
    project = models.ForeignKey(
        'projects.Project',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='workflows',
        help_text="Project for project-specific workflows"
    )
    
    # Status
    is_enabled = models.BooleanField(default=True, blank=True)
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='created_workflows'
    )
    
    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['trigger_type']),
            models.Index(fields=['scope_type']),
            models.Index(fields=['organization']),
            models.Index(fields=['project']),
            models.Index(fields=['is_enabled']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.get_trigger_type_display()})"


class WorkflowAction(models.Model):
    """Action to execute as part of a workflow.
    
    Each workflow can have multiple actions that execute in order.
    """
    
    ACTION_TYPE_CHOICES = [
        ('create_issue', 'Create Issue'),
        # Future action types can be added here:
        # ('create_task', 'Create Task'),
        # ('assign_user', 'Assign User'),
        # ('send_notification', 'Send Notification'),
        # ('update_field', 'Update Field'),
    ]
    
    workflow = models.ForeignKey(
        Workflow,
        on_delete=models.CASCADE,
        related_name='actions'
    )
    action_type = models.CharField(
        max_length=50,
        choices=ACTION_TYPE_CHOICES,
        blank=False,
        help_text="Type of action to execute"
    )
    action_config = models.JSONField(
        default=dict,
        blank=True,
        help_text="Configuration data for the action (e.g., issue template, title, criticality)"
    )
    order = models.IntegerField(
        default=0,
        help_text="Execution order for multiple actions"
    )
    is_enabled = models.BooleanField(
        default=True,
        blank=True,
        help_text="Enable/disable this specific action"
    )
    
    class Meta:
        ordering = ['order', 'id']
        indexes = [
            models.Index(fields=['workflow', 'order']),
        ]
    
    def __str__(self):
        return f"{self.workflow.name} - {self.get_action_type_display()}"


class WorkflowExecution(models.Model):
    """Tracks execution of workflows for audit and visibility.
    
    Each time a workflow is triggered and executed, a WorkflowExecution record
    is created. This provides a complete audit trail of automated actions.
    """
    
    STATUS_CHOICES = [
        ('success', 'Success'),
        ('partial', 'Partial Success'),
        ('failed', 'Failed'),
    ]
    
    # Workflow reference
    workflow = models.ForeignKey(
        Workflow,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='executions',
        help_text="The workflow that was executed"
    )
    
    # Trigger information
    trigger_type = models.CharField(
        max_length=50,
        help_text="Type of trigger that caused this execution"
    )
    entity_type = models.CharField(
        max_length=50,
        help_text="Type of entity that triggered the workflow"
    )
    entity_id = models.IntegerField(
        help_text="ID of the entity that triggered the workflow"
    )
    
    # Execution metadata
    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='success',
        help_text="Overall status of the workflow execution"
    )
    executed_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the workflow was executed"
    )
    executed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='workflow_executions',
        help_text="User who triggered the event (not necessarily the workflow creator)"
    )
    
    # Results
    actions_executed = models.JSONField(
        default=list,
        blank=True,
        help_text="List of actions that were executed and their results"
    )
    errors = models.JSONField(
        default=list,
        blank=True,
        help_text="List of any errors that occurred during execution"
    )
    
    class Meta:
        ordering = ['-executed_at']
        indexes = [
            models.Index(fields=['workflow', '-executed_at']),
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['trigger_type', '-executed_at']),
            models.Index(fields=['status']),
        ]
    
    def __str__(self):
        return f"{self.workflow.name if self.workflow else 'Deleted Workflow'} - {self.get_status_display()} - {self.executed_at}"


class WorkflowAuditLog(models.Model):
    """Audit trail for workflow CRUD operations.
    
    Tracks all changes to workflows including creation, updates, deletions, and views.
    """
    
    ACTION_CHOICES = [
        ('created', 'Created'),
        ('updated', 'Updated'),
        ('deleted', 'Deleted'),
        ('viewed', 'Viewed'),
        ('enabled', 'Enabled'),
        ('disabled', 'Disabled'),
    ]
    
    # Workflow reference (null if workflow was deleted)
    workflow = models.ForeignKey(
        Workflow,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='audit_logs',
        help_text="The workflow that was changed (null if deleted)"
    )
    
    # Action information
    action = models.CharField(
        max_length=20,
        choices=ACTION_CHOICES,
        help_text="Type of action performed"
    )
    performed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='workflow_audit_logs',
        help_text="User who performed the action"
    )
    performed_at = models.DateTimeField(
        auto_now_add=True,
        help_text="When the action was performed"
    )
    
    # Change details
    changes = models.JSONField(
        default=dict,
        blank=True,
        help_text="Details of what changed (field name -> old value, new value)"
    )
    workflow_name = models.CharField(
        max_length=500,
        blank=True,
        help_text="Name of workflow at time of action (for deleted workflows)"
    )
    # Note: workflow_id is automatically created by Django from the ForeignKey 'workflow'
    # We don't need to define it explicitly
    
    # Additional context
    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        help_text="IP address of the user (if available)"
    )
    user_agent = models.TextField(
        blank=True,
        help_text="User agent string (if available)"
    )
    
    class Meta:
        ordering = ['-performed_at']
        indexes = [
            models.Index(fields=['workflow', '-performed_at'], name='wf_audit_workflow_perf_idx'),
            models.Index(fields=['action', '-performed_at'], name='wf_audit_action_perf_idx'),
            models.Index(fields=['performed_by', '-performed_at'], name='wf_audit_performed_by_idx'),
        ]
    
    def __str__(self):
        # Use workflow_id from the ForeignKey (auto-generated field)
        workflow_id = self.workflow_id if hasattr(self, 'workflow_id') else (self.workflow.id if self.workflow else None)
        workflow_ref = self.workflow_name or (f"Workflow #{workflow_id}" if workflow_id else "Unknown")
        return f"{self.get_action_display()} - {workflow_ref} - {self.performed_at}"

