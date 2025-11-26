"""
Workflow execution engine for Dokuly workflows.

This module handles finding and executing workflows based on trigger events.
"""
import re
from typing import Dict, List, Optional, Any
from django.contrib.auth.models import User
from django.db.models import Q
from .workflowsModel import Workflow, WorkflowAction, WorkflowExecution
from .issuesModel import Issues
from documents.models import MarkdownText
from profiles.utilityFunctions import (
    APP_TO_MODEL,
    MODEL_TO_MODEL_STRING,
    send_issue_creation_notifications
)
from .viewsIssues import (
    connect_issue_status_to_related_object,
    add_issue_to_object
)


class WorkflowExecutor:
    """Executes workflows based on trigger events."""
    
    # Map trigger types to entity type mappings
    TRIGGER_TO_ENTITY_MAP = {
        'pcba_created': 'pcbas',
        'part_created': 'parts',
        'assembly_created': 'assemblies',
        'document_created': 'documents',
        'revision_created': None,  # Can be any entity type
    }
    
    @classmethod
    def execute_workflows(
        cls,
        trigger_type: str,
        entity_type: str,
        entity_id: int,
        entity_data: Any,
        user: User
    ) -> List[Dict[str, Any]]:
        """
        Find and execute matching workflows for a trigger event.
        
        Args:
            trigger_type: Type of trigger (e.g., 'pcba_created', 'revision_created')
            entity_type: Type of entity (e.g., 'pcbas', 'parts', 'assemblies', 'documents')
            entity_id: ID of the entity that triggered the workflow
            entity_data: The entity object instance
            user: User who triggered the event
        
        Returns:
            List of workflow execution results
        """
        results = []
        
        try:
            # Find matching workflows
            matching_workflows = cls._find_matching_workflows(
                trigger_type=trigger_type,
                entity_type=entity_type,
                entity_id=entity_id,
                entity_data=entity_data,
                user=user
            )
            
            # Execute each matching workflow
            for workflow in matching_workflows:
                if not workflow.is_enabled:
                    continue
                
                workflow_result = {
                    'workflow_id': workflow.id,
                    'workflow_name': workflow.name,
                    'actions_executed': [],
                    'errors': []
                }
                
                # Create workflow execution record for audit trail
                execution = WorkflowExecution.objects.create(
                    workflow=workflow,
                    trigger_type=trigger_type,
                    entity_type=entity_type,
                    entity_id=entity_id,
                    executed_by=user,
                    status='success'  # Will update if errors occur
                )
                
                # Execute actions in order
                actions = workflow.actions.filter(is_enabled=True).order_by('order', 'id')
                for action in actions:
                    try:
                        action_result = cls._execute_action(
                            action=action,
                            entity_type=entity_type,
                            entity_data=entity_data,
                            user=user,
                            workflow_execution=execution  # Pass execution to link created items
                        )
                        workflow_result['actions_executed'].append(action_result)
                    except Exception as e:
                        error_msg = f"Error executing action {action.id}: {str(e)}"
                        workflow_result['errors'].append(error_msg)
                        execution.status = 'partial' if execution.status == 'success' else 'failed'
                
                # Update execution record with results
                execution.actions_executed = workflow_result['actions_executed']
                execution.errors = workflow_result['errors']
                if workflow_result['errors']:
                    execution.status = 'failed' if not workflow_result['actions_executed'] else 'partial'
                execution.save()
                
                results.append(workflow_result)
        
        except Exception as e:
            # Return error result
            import traceback
            error_message = f"Error executing workflows: {str(e)}\n{traceback.format_exc()}"
            results.append({
                'error': error_message
            })
        
        return results
    
    @classmethod
    def _find_matching_workflows(
        cls,
        trigger_type: str,
        entity_type: str,
        entity_id: int,
        entity_data: Any,
        user: User
    ) -> List[Workflow]:
        """
        Find workflows that match the trigger event.
        
        Args:
            trigger_type: Type of trigger
            entity_type: Type of entity
            entity_id: ID of entity
            entity_data: Entity object instance
        
        Returns:
            List of matching Workflow objects
        """
        # Get organization from entity
        organization_id = None
        project = None
        
        # Try to get organization from project first
        if hasattr(entity_data, 'project') and entity_data.project:
            project = entity_data.project
            if hasattr(project, 'organization') and project.organization:
                organization_id = project.organization.id
                print(f"Got organization_id={organization_id} from project.organization")
            elif hasattr(project, 'organization_id') and project.organization_id:
                organization_id = project.organization_id
                print(f"Got organization_id={organization_id} from project.organization_id")
            else:
                print(f"Project {project.id} has no organization set")
        
        # If no organization from project, try to get from user's profile
        if not organization_id and user:
            try:
                from profiles.models import Profile
                user_profile = Profile.objects.get(user=user)
                if user_profile.organization_id and user_profile.organization_id != -1:
                    organization_id = user_profile.organization_id
                    print(f"Got organization_id={organization_id} from user profile for user {user.username}")
            except Profile.DoesNotExist:
                print(f"Profile not found for user {user.username if user else 'None'}")
            except Exception as e:
                print(f"Error getting organization from user profile: {str(e)}")
        
        # Build query for matching workflows
        query = Q(
            trigger_type=trigger_type,
            is_enabled=True
        )
        
        # Filter by entity type if specified
        query &= Q(
            Q(trigger_entity_type='all') | Q(trigger_entity_type=entity_type)
        )
        
        # Filter by scope
        scope_queries = []
        if organization_id:
            scope_queries.append(
                Q(scope_type='organization', organization_id=organization_id)
            )
        if project:
            scope_queries.append(
                Q(scope_type='project', project=project)
            )
        
        if scope_queries:
            # Combine scope queries with OR
            from functools import reduce
            from operator import or_
            scope_query = reduce(or_, scope_queries)
            query &= scope_query
        else:
            # If no scope matches, return empty queryset
            return []
        
        # Get matching workflows
        workflows = Workflow.objects.filter(query).prefetch_related('actions')
        
        workflows_list = list(workflows)
        
        # Debug logging (can be removed later)
        if workflows_list:
            print(f"Found {len(workflows_list)} matching workflows for trigger {trigger_type}, entity {entity_type}, org_id={organization_id}")
        else:
            print(f"No matching workflows found for trigger {trigger_type}, entity {entity_type}, org_id={organization_id}, project={project.id if project else None}")
            # Debug: print all workflows to see what exists
            all_workflows = Workflow.objects.filter(is_enabled=True, trigger_type=trigger_type)
            print(f"Total enabled workflows with trigger {trigger_type}: {all_workflows.count()}")
            for wf in all_workflows:
                print(f"  - {wf.name}: scope={wf.scope_type}, org_id={wf.organization_id if wf.organization else None}, project_id={wf.project_id if wf.project else None}")
        
        return workflows_list
    
    @classmethod
    def _execute_action(
        cls,
        action: WorkflowAction,
        entity_type: str,
        entity_data: Any,
        user: User,
        workflow_execution: Optional[WorkflowExecution] = None
    ) -> Dict[str, Any]:
        """
        Execute a single workflow action.
        
        Args:
            action: WorkflowAction to execute
            entity_type: Type of entity
            entity_data: Entity object instance
            user: User who triggered the event
            workflow_execution: WorkflowExecution record for audit trail
        
        Returns:
            Dictionary with action execution result
        """
        action_type = action.action_type
        action_config = action.action_config or {}
        
        if action_type == 'create_issue':
            return cls._create_issue_from_workflow(
                action_config=action_config,
                entity_type=entity_type,
                entity_data=entity_data,
                user=user,
                workflow=action.workflow,
                workflow_execution=workflow_execution
            )
        else:
            raise ValueError(f"Unknown action type: {action_type}")
    
    @classmethod
    def _create_issue_from_workflow(
        cls,
        action_config: Dict[str, Any],
        entity_type: str,
        entity_data: Any,
        user: User,
        workflow: Optional[Workflow] = None,
        workflow_execution: Optional[WorkflowExecution] = None
    ) -> Dict[str, Any]:
        """
        Create an issue from a workflow action.
        
        Args:
            action_config: Configuration for the create_issue action
            entity_type: Type of entity
            entity_data: Entity object instance
            user: User who triggered the event
            workflow: Workflow that created this issue (for tracking)
            workflow_execution: WorkflowExecution record (for audit trail)
        
        Returns:
            Dictionary with issue creation result
        """
        # Get model and model_string
        model = APP_TO_MODEL.get(entity_type)
        if not model:
            raise ValueError(f"Unknown entity type: {entity_type}")
        
        model_string = MODEL_TO_MODEL_STRING.get(model)
        if not model_string:
            raise ValueError(f"Unknown model: {model}")
        
        # Get issue configuration
        issue_title = cls._substitute_template_variables(
            action_config.get('title', ''),
            entity_data,
            user
        )
        issue_template = cls._substitute_template_variables(
            action_config.get('template_text', ''),
            entity_data,
            user
        )
        criticality = action_config.get('criticality', 'Low')
        
        # Create markdown text for issue description
        markdown_text = None
        if issue_template:
            markdown_text = MarkdownText.objects.create(text=issue_template)
        
        # Create issue
        issue = Issues()
        issue.title = issue_title or None
        issue.description = markdown_text
        issue.criticality = criticality
        issue.created_by = user
        
        # Link issue to workflow for visibility
        if workflow:
            issue.created_by_workflow = workflow
        if workflow_execution:
            issue.workflow_execution = workflow_execution
        
        # Connect issue to entity
        connect_issue_status_to_related_object(
            issue,
            f'opened_in_{model_string}',
            entity_data
        )
        
        issue.save()
        
        # Add issue to entity's M2M field
        add_issue_to_object(issue, entity_type, entity_data)
        
        # Send notifications
        try:
            send_issue_creation_notifications(
                issue,
                entity_data,
                entity_type,
                entity_data.id,
                user=user
            )
        except Exception as e:
            # Log error but don't fail the workflow
            print(f"Error sending issue notifications: {str(e)}")
        
        return {
            'action_type': 'create_issue',
            'issue_id': issue.id,
            'issue_title': issue_title,
            'success': True
        }
    
    @classmethod
    def _substitute_template_variables(
        cls,
        template: str,
        entity_data: Any,
        user: User
    ) -> str:
        """
        Substitute template variables in a string.
        
        Supported variables:
        - {{entity.display_name}}
        - {{entity.full_part_number}}
        - {{entity.description}}
        - {{entity.project.title}}
        - {{user.first_name}}
        - {{user.last_name}}
        - {{user.username}}
        
        Args:
            template: Template string with variables
            entity_data: Entity object instance
            user: User object
        
        Returns:
            String with variables substituted
        """
        if not template:
            return template
        
        result = template
        
        # Entity variables
        entity_vars = {
            'entity.display_name': getattr(entity_data, 'display_name', ''),
            'entity.full_part_number': getattr(entity_data, 'full_part_number', ''),
            'entity.description': getattr(entity_data, 'description', ''),
            'entity.revision': getattr(entity_data, 'revision', ''),
            'entity.formatted_revision': getattr(entity_data, 'formatted_revision', ''),
        }
        
        # Project variables
        if hasattr(entity_data, 'project') and entity_data.project:
            entity_vars['entity.project.title'] = entity_data.project.title or ''
            entity_vars['entity.project.full_project_number'] = str(entity_data.project.full_project_number) if entity_data.project.full_project_number else ''
        
        # User variables
        user_vars = {
            'user.first_name': user.first_name if hasattr(user, 'first_name') else '',
            'user.last_name': user.last_name if hasattr(user, 'last_name') else '',
            'user.username': user.username if hasattr(user, 'username') else '',
        }
        
        # Combine all variables
        all_vars = {**entity_vars, **user_vars}
        
        # Substitute variables using regex
        for var_name, var_value in all_vars.items():
            pattern = r'\{\{' + re.escape(var_name) + r'\}\}'
            result = re.sub(pattern, str(var_value), result)
        
        return result

