from rest_framework import status
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db.models import Q
from .workflowsModel import Workflow, WorkflowAction, WorkflowExecution, WorkflowAuditLog
from .serializers import WorkflowSerializer, WorkflowCreateSerializer, WorkflowActionSerializer
from profiles.views import check_user_auth_and_app_permission
from organizations.models import Organization
from projects.models import Project
from profiles.models import Profile


def log_workflow_audit(request, workflow, action, changes=None, workflow_id=None, workflow_name=None):
    """Helper function to log workflow audit events."""
    try:
        # Get IP address and user agent from request
        ip_address = None
        user_agent = ""
        if hasattr(request, 'META'):
            ip_address = request.META.get('REMOTE_ADDR')
            user_agent = request.META.get('HTTP_USER_AGENT', '')
        
        # Use provided workflow info or get from workflow object
        if workflow:
            workflow_id = workflow.id
            workflow_name = workflow.name
        elif workflow_id:
            # If workflow is None but we have workflow_id, use it
            workflow_name = workflow_name or f"Workflow #{workflow_id}"
        
        WorkflowAuditLog.objects.create(
            workflow=workflow,  # This will auto-create workflow_id field
            workflow_name=workflow_name or '',
            action=action,
            performed_by=request.user if hasattr(request, 'user') and request.user.is_authenticated else None,
            changes=changes or {},
            ip_address=ip_address,
            user_agent=user_agent
        )
    except Exception as e:
        # Don't fail the request if audit logging fails
        print(f"Error logging workflow audit: {str(e)}")


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def get_workflows(request):
    """Get all workflows for the user's organization or projects."""
    try:
        permission, response = check_user_auth_and_app_permission(request, "projects")
        if not permission:
            return response
        
        user = request.user
        try:
            user_profile = Profile.objects.get(user=user)
            organization_id = user_profile.organization_id
        except Profile.DoesNotExist:
            return Response("User profile not found", status=status.HTTP_404_NOT_FOUND)
        
        # Build query for workflows
        query = Q()
        
        # Add organization workflows if organization exists
        if organization_id and organization_id != -1:
            query |= Q(organization_id=organization_id)
        
        # Add project-specific workflows
        query |= Q(project__project_members=user)
        
        # Get workflows for user's organization and projects
        workflows = Workflow.objects.filter(query).select_related('organization', 'project', 'created_by').prefetch_related('actions').distinct()
        
        # Log view action for each workflow (optional - can be expensive for many workflows)
        # For now, we'll log a single "viewed" action for the list view
        # Individual workflow views are logged in get_workflow
        
        serializer = WorkflowSerializer(workflows, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        import traceback
        error_message = f"Error loading workflows: {str(e)}\n{traceback.format_exc()}"
        print(error_message)
        return Response(error_message, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def get_workflow(request, workflow_id):
    """Get a single workflow by ID."""
    try:
        permission, response = check_user_auth_and_app_permission(request, "projects")
        if not permission:
            return response
        
        user = request.user
        try:
            user_profile = Profile.objects.get(user=user)
            organization_id = user_profile.organization_id
        except Profile.DoesNotExist:
            return Response("User profile not found", status=status.HTTP_404_NOT_FOUND)
        
        # Build query
        query = Q()
        if organization_id and organization_id != -1:
            query |= Q(organization_id=organization_id)
        query |= Q(project__project_members=user)
        
        workflow = get_object_or_404(
            Workflow.objects.filter(query).select_related('organization', 'project', 'created_by').prefetch_related('actions').distinct(),
            pk=workflow_id
        )
        
        # Log view action
        log_workflow_audit(request, workflow, 'viewed')
        
        serializer = WorkflowSerializer(workflow)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        import traceback
        error_message = f"Error loading workflow: {str(e)}\n{traceback.format_exc()}"
        print(error_message)
        return Response(error_message, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def create_workflow(request):
    """Create a new workflow."""
    try:
        permission, response = check_user_auth_and_app_permission(request, "projects")
        if not permission:
            return response
        
        user = request.user
        try:
            user_profile = Profile.objects.get(user=user)
            organization_id = user_profile.organization_id
        except Profile.DoesNotExist:
            return Response("User profile not found", status=status.HTTP_404_NOT_FOUND)
        
        data = request.data.copy()
        
        # Set organization or project based on scope_type
        if data.get('scope_type') == 'organization':
            if not organization_id or organization_id == -1:
                return Response("User has no organization", status=status.HTTP_400_BAD_REQUEST)
            data['organization'] = organization_id
            data.pop('project', None)
        elif data.get('scope_type') == 'project':
            project_id = data.get('project')
            if project_id:
                # Verify user has access to the project
                project = get_object_or_404(Project.objects.filter(project_members=user), pk=project_id)
                data['project'] = project.id
            data.pop('organization', None)
        
        # Set created_by
        data['created_by'] = user.id
        
        serializer = WorkflowCreateSerializer(data=data)
        if serializer.is_valid():
            try:
                workflow = serializer.save()
                # Log creation
                log_workflow_audit(request, workflow, 'created', changes={'name': workflow.name})
                response_serializer = WorkflowSerializer(workflow)
                return Response(response_serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                import traceback
                error_message = f"Error saving workflow: {str(e)}\n{traceback.format_exc()}"
                print(error_message)
                return Response({"detail": error_message}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        import traceback
        error_message = f"Error creating workflow: {str(e)}\n{traceback.format_exc()}"
        print(error_message)
        return Response(error_message, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def update_workflow(request, workflow_id):
    """Update an existing workflow."""
    try:
        permission, response = check_user_auth_and_app_permission(request, "projects")
        if not permission:
            return response
        
        user = request.user
        try:
            user_profile = Profile.objects.get(user=user)
            organization_id = user_profile.organization_id
        except Profile.DoesNotExist:
            return Response("User profile not found", status=status.HTTP_404_NOT_FOUND)
        
        # Build query
        query = Q()
        if organization_id and organization_id != -1:
            query |= Q(organization_id=organization_id)
        query |= Q(project__project_members=user)
        
        workflow = get_object_or_404(
            Workflow.objects.filter(query).distinct(),
            pk=workflow_id
        )
        
        # Store old values for change tracking
        old_values = {
            'name': workflow.name,
            'description': workflow.description,
            'trigger_type': workflow.trigger_type,
            'trigger_entity_type': workflow.trigger_entity_type,
            'scope_type': workflow.scope_type,
            'is_enabled': workflow.is_enabled,
        }
        
        data = request.data.copy()
        
        # Handle scope changes
        if 'scope_type' in data:
            if data['scope_type'] == 'organization':
                if not organization_id or organization_id == -1:
                    return Response("User has no organization", status=status.HTTP_400_BAD_REQUEST)
                data['organization'] = organization_id
                data.pop('project', None)
            elif data['scope_type'] == 'project':
                project_id = data.get('project')
                if project_id:
                    project = get_object_or_404(Project.objects.filter(project_members=user), pk=project_id)
                    data['project'] = project.id
                data.pop('organization', None)
        
        serializer = WorkflowCreateSerializer(workflow, data=data, partial=True)
        if serializer.is_valid():
            workflow = serializer.save()
            
            # Track changes
            changes = {}
            for field, old_value in old_values.items():
                new_value = getattr(workflow, field, None)
                if old_value != new_value:
                    changes[field] = {'old': old_value, 'new': new_value}
            
            # Check if enabled status changed
            if 'is_enabled' in changes:
                action = 'enabled' if changes['is_enabled']['new'] else 'disabled'
                log_workflow_audit(request, workflow, action, changes=changes)
            else:
                log_workflow_audit(request, workflow, 'updated', changes=changes)
            
            response_serializer = WorkflowSerializer(workflow)
            return Response(response_serializer.data, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        import traceback
        error_message = f"Error updating workflow: {str(e)}\n{traceback.format_exc()}"
        print(error_message)
        return Response(error_message, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def delete_workflow(request, workflow_id):
    """Delete a workflow."""
    try:
        permission, response = check_user_auth_and_app_permission(request, "projects")
        if not permission:
            return response
        
        user = request.user
        try:
            user_profile = Profile.objects.get(user=user)
            organization_id = user_profile.organization_id
        except Profile.DoesNotExist:
            return Response("User profile not found", status=status.HTTP_404_NOT_FOUND)
        
        # Build query
        query = Q()
        if organization_id and organization_id != -1:
            query |= Q(organization_id=organization_id)
        query |= Q(project__project_members=user)
        
        workflow = get_object_or_404(
            Workflow.objects.filter(query).distinct(),
            pk=workflow_id
        )
        
        # Store workflow info before deletion
        workflow_id_val = workflow.id
        workflow_name = workflow.name
        
        workflow.delete()
        
        # Log deletion (workflow will be None)
        log_workflow_audit(request, None, 'deleted', workflow_id=workflow_id_val, workflow_name=workflow_name)
        
        return Response("Workflow deleted", status=status.HTTP_200_OK)
    except Exception as e:
        import traceback
        error_message = f"Error deleting workflow: {str(e)}\n{traceback.format_exc()}"
        print(error_message)
        return Response(error_message, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def get_workflow_triggers(request):
    """Get available trigger types for workflows."""
    try:
        triggers = [
            {'value': 'pcba_created', 'label': 'PCBA Created'},
            {'value': 'part_created', 'label': 'Part Created'},
            {'value': 'assembly_created', 'label': 'Assembly Created'},
            {'value': 'document_created', 'label': 'Document Created'},
            {'value': 'revision_created', 'label': 'Revision Created'},
        ]
        return Response(triggers, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def get_workflow_actions(request):
    """Get available action types for workflows."""
    try:
        actions = [
            {'value': 'create_issue', 'label': 'Create Issue'},
        ]
        return Response(actions, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def execute_workflow(request, workflow_id):
    """Manually execute a workflow (for testing)."""
    try:
        permission, response = check_user_auth_and_app_permission(request, "projects")
        if not permission:
            return response
        
        user = request.user
        try:
            user_profile = Profile.objects.get(user=user)
            organization_id = user_profile.organization_id
        except Profile.DoesNotExist:
            return Response("User profile not found", status=status.HTTP_404_NOT_FOUND)
        
        # Build query
        query = Q()
        if organization_id and organization_id != -1:
            query |= Q(organization_id=organization_id)
        query |= Q(project__project_members=user)
        
        workflow = get_object_or_404(
            Workflow.objects.filter(query).distinct(),
            pk=workflow_id
        )
        
        # This endpoint is for manual testing - actual execution happens in workflow engine
        # For now, just return the workflow details
        serializer = WorkflowSerializer(workflow)
        return Response({
            'workflow': serializer.data,
            'message': 'Workflow execution endpoint - use workflow engine for actual execution'
        }, status=status.HTTP_200_OK)
    except Exception as e:
        import traceback
        error_message = f"Error executing workflow: {str(e)}\n{traceback.format_exc()}"
        print(error_message)
        return Response(error_message, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def get_workflow_executions(request, workflow_id=None):
    """Get workflow execution logs.
    
    If workflow_id is provided, returns executions for that workflow only.
    Otherwise, returns all executions for workflows the user has access to.
    """
    try:
        permission, response = check_user_auth_and_app_permission(request, "projects")
        if not permission:
            return response
        
        user = request.user
        try:
            user_profile = Profile.objects.get(user=user)
            organization_id = user_profile.organization_id
        except Profile.DoesNotExist:
            return Response("User profile not found", status=status.HTTP_404_NOT_FOUND)
        
        # Build query for accessible workflows
        workflow_query = Q()
        if organization_id and organization_id != -1:
            workflow_query |= Q(organization_id=organization_id)
        workflow_query |= Q(project__project_members=user)
        
        # Get executions
        executions_query = WorkflowExecution.objects.filter(
            workflow__in=Workflow.objects.filter(workflow_query)
        ).select_related('workflow', 'executed_by').order_by('-executed_at')
        
        # Filter by specific workflow if provided
        if workflow_id:
            executions_query = executions_query.filter(workflow_id=workflow_id)
        
        # Limit to last 1000 executions
        executions = executions_query[:1000]
        
        # Serialize
        from .serializers import WorkflowExecutionSerializer
        serializer = WorkflowExecutionSerializer(executions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        import traceback
        error_message = f"Error loading workflow executions: {str(e)}\n{traceback.format_exc()}"
        print(error_message)
        return Response(error_message, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def get_workflow_audit_logs(request, workflow_id=None):
    """Get workflow audit logs (CRUD operations).
    
    If workflow_id is provided, returns audit logs for that workflow only.
    Otherwise, returns all audit logs for workflows the user has access to.
    """
    try:
        permission, response = check_user_auth_and_app_permission(request, "projects")
        if not permission:
            return response
        
        user = request.user
        try:
            user_profile = Profile.objects.get(user=user)
            organization_id = user_profile.organization_id
        except Profile.DoesNotExist:
            return Response("User profile not found", status=status.HTTP_404_NOT_FOUND)
        
        # Build query for accessible workflows
        workflow_query = Q()
        if organization_id and organization_id != -1:
            workflow_query |= Q(organization_id=organization_id)
        workflow_query |= Q(project__project_members=user)
        
        accessible_workflow_ids = Workflow.objects.filter(workflow_query).values_list('id', flat=True)
        
        # Get audit logs
        # workflow_id is auto-generated from ForeignKey, so we can use it directly
        audit_query = WorkflowAuditLog.objects.filter(
            Q(workflow_id__in=accessible_workflow_ids) | Q(workflow__isnull=True)
        ).select_related('workflow', 'performed_by').order_by('-performed_at')
        
        # Filter by specific workflow if provided
        if workflow_id:
            audit_query = audit_query.filter(workflow_id=workflow_id)
        
        # Limit to last 1000 audit logs
        audit_logs = audit_query[:1000]
        
        # Serialize
        from .serializers import WorkflowAuditLogSerializer
        serializer = WorkflowAuditLogSerializer(audit_logs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        import traceback
        error_message = f"Error loading workflow audit logs: {str(e)}\n{traceback.format_exc()}"
        print(error_message)
        return Response(error_message, status=status.HTTP_400_BAD_REQUEST)

