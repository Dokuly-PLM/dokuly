from datetime import timedelta
from datetime import datetime
from profiles.views import check_permissions_ownership, check_permissions_standard
from accounts.serializers import UserSerializer
from django.contrib.auth.models import User
from django.contrib.postgres.search import SearchVector
from django.db.models import Q
from profiles.serializers import ProfileSerializer
from profiles.models import Profile
from customers.serializers import CustomerSerializer
from customers.models import Customer
from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from .models import Project, Gantt
from .models import Task

from .serializers import TasktimereportSerializer, ProjectSerializer, TaskSerializer, GanttSerializer
from profiles.views import check_user_auth_and_app_permission
from projects.viewsTags import check_for_and_create_new_tags


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
def get_unarchived_tasks(request):
    """Return all unarchived tasks
    """
    permission, response = check_user_auth_and_app_permission(request, "projects")
    if not permission:
        return response

    try:
        tasks = Task.objects.exclude(is_archived=True)
        if len(tasks) == 0:
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(f"get_tasks failed: {e}", status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
def get_unarchived_tasks_enhanced(request):
    """Return all unarchived tasks
    """
    permission, response = check_user_auth_and_app_permission(request, "projects")
    if not permission:
        return response

    try:
        tasks = Task.objects.exclude(is_archived=True).only("id", "title", "project_id", "is_billable", "is_active")
        if len(tasks) == 0:
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = TasktimereportSerializer(tasks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(f"get_tasks failed: {e}", status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
def get_project_tasks(request, project_id):
    """Return the tasks for a project.
    To get archived tasks, set the "show_archived_tasks" field to true.
    """
    permission, response = check_user_auth_and_app_permission(request, "projects")
    if not permission:
        return response
    try:
        tasks = None
        if "show_archived_tasks" in request.data:
            if request.data['show_archived_tasks'] == True:
                tasks = Task.objects.filter(project_id=project_id).prefetch_related("tags")
            else:
                tasks = Task.objects.filter(
                    project_id=project_id).exclude(is_archived=True).prefetch_related("tags")
        else:
            tasks = Task.objects.filter(
                project_id=project_id).exclude(is_archived=True).prefetch_related("tags")

        if len(tasks) == 0:
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except:
        return Response("No project found", status=status.HTTP_204_NO_CONTENT)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
def get_active_project_tasks(request, project_id):
    """Return the tasks for a project.
    """
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "projects")
    if not permission:
        return response

    try:
        tasks = Task.objects.filter(
            project_id=project_id, is_active=True).exclude(is_archived=True)
        if len(tasks) == 0:
            return Response(status=status.HTTP_204_NO_CONTENT)
        serializer = TaskSerializer(tasks, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except:
        return Response("No project found", status=status.HTTP_204_NO_CONTENT)


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
def new_project_task(request, project_id):
    """Return the tasks for a project.
    """
    permission, response = check_user_auth_and_app_permission(request, "projects")
    if not permission:
        return response

    data = request.data
    try:
        # existing_project_tasks = Tasks.objects.get(project_id=project_id)
        new_task = Task()
        new_task.title = data['name']
        new_task.description = data['description']
        new_task.project_id = project_id
        new_task.is_billable = data['is_billable']
        new_task.is_active = True
        new_task.is_archived = False
        if 'parent_task_id' in data and 'subtask_id' in data:
            if data['parent_task_id'] == -1:
                new_task.parent_task = None
            else:
                parent_task = Task.objects.get(pk=data['parent_task_id'])
                new_task.parent_task = parent_task

        project = Project.objects.get(id=project_id)
        if 'is_gantt' in data:
            if data['is_gantt']:
                try:
                    gantt = Gantt.objects.get(project_id=project)
                except Gantt.DoesNotExist:
                    gantt = Gantt()
                    gantt.project_id = project
                    gantt.description = "New Gantt Chart",  # Example default description
                    gantt.notes = "Automatically created",  # Example note
                    gantt.view_mode = "Week"  # Default view mode
                    gantt.save()

                new_task.gantt_id = gantt
                new_task.start = data['start']
                new_task.end = data['end']

        new_task.save()  # Need to save before adding tags, as m2m requires a primary key

        if "tags" in data:
            error, message, tag_ids = check_for_and_create_new_tags(project, data["tags"])
            if error:
                return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)
            new_task.tags.set(tag_ids)

        if "assignees" in data:
            profile_ids = Profile.objects.filter(id__in=data["assignees"])
            new_task.assignees.set(profile_ids)

        new_task.save()  # Save again after adding tags

        return Response(status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
def edit_project_task(request, task_id):
    """Edit a single task.
    """
    permission, response = check_user_auth_and_app_permission(request, "projects")
    if not permission:
        return response

    data = request.data

    # Archive/Unarchive
    if "is_archived" in data:
        task = Task.objects.get(pk=task_id)
        task.is_archived = data["is_archived"]
        # Remove task from gantts if found
        task.gantt_id = None
        task.save()
        return Response("Archived task.", status=status.HTTP_200_OK)

    try:
        task = Task.objects.get(pk=task_id)
        if 'name' in data:
            task.title = data['name']
        if 'description' in data:
            task.description = data['description']
        if 'is_billable' in data:
            task.is_billable = data['is_billable']
        if 'is_active' in data:
            task.is_active = data['is_active']
        if 'new_start' in data:
            task.start = data['new_start']
        if 'new_end' in data:
            task.end = data['new_end']

        if 'parent_task_id' in data and 'subtask_id' in data:
            if data['parent_task_id'] == -1:
                task.parent_task = None
            else:
                parent_task = Task.objects.get(pk=data['parent_task_id'])
                task.parent_task = parent_task

        if 'new_progress' in data:
            task.progress = data['new_progress']
        if 'workload_hours' in data:
            task.workload_hours = data['workload_hours']
        if "is_complete" in data:
            task.is_complete = data["is_complete"]

        if "tags" in data:
            project = Project.objects.get(id=task.project_id)
            error, message, tag_ids = check_for_and_create_new_tags(project, data["tags"])
            if error:
                return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)
            task.tags.set(tag_ids)

        if 'is_gantt' in data:
            if data['is_gantt']:  # Add task to gantt
                project = Project.objects.get(id=data['project_id'])
                try:
                    gantt = Gantt.objects.get(project_id=project)
                except Gantt.DoesNotExist:
                    gantt = Gantt()
                    gantt.project_id = project
                    gantt.description = "New Gantt Chart",  # Example default description
                    gantt.notes = "Automatically created",  # Example note
                    gantt.view_mode = "week"  # Default view mode
                    gantt.save()
                task.gantt_id = gantt
                if 'start_time' not in data:
                    task.start = datetime.now()
                else:
                    task.start = data['start_time']
                if 'end_time' not in data:
                    task.end = datetime.now() + timedelta(days=7)
                else:
                    task.end = data['end_time']

            else:  # Remove task from gantt
                task.gantt_id = None

        if "assignees" in data:
            try:
                # Fetch only the profiles that exist in the provided assignees list
                profile_ids = Profile.objects.filter(id__in=data["assignees"])
                if not profile_ids.exists():
                    return Response({"error": "No valid assignees found"}, status=status.HTTP_400_BAD_REQUEST)

                # Set the task assignees in bulk (clears old ones and assigns the new ones)
                task.assignees.set(profile_ids)
            except Profile.DoesNotExist:
                return Response({"error": "Some assignees could not be found"}, status=status.HTTP_404_NOT_FOUND)

        task.save()
        return Response(status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
@permission_classes((IsAuthenticated, ))
def add_subtask(request):
    """Add a subtask to a task.
    """
    permission, response = check_user_auth_and_app_permission(request, "projects")
    if not permission:
        return response

    data = request.data
    try:
        task = Task.objects.get(pk=data['task_id'])
        subtask = Task.objects.get(pk=data['subtask_id'])
        subtask.parent_task = task
        subtask.save()
        return Response(status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
@permission_classes((IsAuthenticated, ))
def remove_subtask(request):
    """Remove a subtask from a task.
    """
    permission, response = check_user_auth_and_app_permission(request, "projects")
    if not permission:
        return response

    data = request.data
    try:
        subtask = Task.objects.get(pk=data['subtask_id'])
        subtask.parent_task = None
        subtask.save()
        return Response(status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


def update_parent_task_times_recursive(task):
    # Base case: if there is no parent, we have reached the root task
    if task.parent_task is None:
        return

    # Find all tasks that share the same parent (siblings)
    parent_task = task.parent_task
    child_tasks = Task.objects.filter(parent_task=parent_task)

    # Exclude tasks with None for 'start' and 'end'
    child_tasks_with_start = child_tasks.exclude(start__isnull=True)
    child_tasks_with_end = child_tasks.exclude(end__isnull=True)

    # Initialize variables
    earliest_start = None
    latest_end = None

    if child_tasks_with_start.exists():
        # Find the earliest start time among the child tasks
        earliest_start = child_tasks_with_start.earliest('start').start

    if child_tasks_with_end.exists():
        # Find the latest end time among the child tasks
        latest_end = child_tasks_with_end.latest('end').end

    # Update the parent task's start and end times if they are not None
    if earliest_start is not None:
        parent_task.start = earliest_start
    if latest_end is not None:
        parent_task.end = latest_end

    if parent_task.gantt_id is None:
        parent_task.gantt_id = task.gantt_id
    parent_task.save()

    # Recur to update the next parent task
    update_parent_task_times_recursive(parent_task)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
@permission_classes((IsAuthenticated, ))
def get_task_assignees(request, task_id):
    """Get the assignees for a task.
    """
    permission, response = check_user_auth_and_app_permission(request, "projects")
    if not permission:
        return response

    try:
        task = Task.objects.get(pk=task_id)
        assignees = task.assignees.all()
        serializer = ProfileSerializer(assignees, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)
