from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from .models import Project, Task, Gantt
from.serializers import ProjectSerializer, TaskSerializer, GanttSerializer
from customers.models import Customer
from profiles.models import Profile
from profiles.views import check_permissions_standard
from profiles.serializers import ProfileSerializer
from django.db.models import Q
from django.contrib.postgres.search import SearchVector
from django.contrib.auth.models import User
from accounts.serializers import UserSerializer
from profiles.views import check_permissions_ownership, check_permissions_standard, check_user_auth_and_app_permission
from django.contrib.auth.decorators import login_required


@api_view(('GET',))
@renderer_classes((JSONRenderer, ))
def fetch_gantt(request, project_id):
    permission, response = check_user_auth_and_app_permission(request, "projects")
    if not permission:
        return response
    try:
        gantt = Gantt.objects.get(project_id=project_id)
        tasks = Task.objects.filter(gantt_id=gantt).order_by('start')
        return Response({'gantt': GanttSerializer(gantt, many=False).data, 'tasks': TaskSerializer(tasks, many=True).data}, status=status.HTTP_200_OK)
    except Gantt.DoesNotExist:
        return Response(f"Gantt does not exist for project with id {project_id}", status=status.HTTP_204_NO_CONTENT)

@api_view(('POST',))
@renderer_classes((JSONRenderer, ))
def create_gantt(request):
    permission, response = check_user_auth_and_app_permission(request, "projects")
    if not permission:
        return response
    if request.method == 'POST':
        d = request.data
        if 'project_id' not in d:
          return Response("Invalid server parameters", status=status.HTTP_400_BAD_REQUEST)
        try:
          project = Project.objects.get(id=d['project_id'])
          if Gantt.objects.filter(project_id=project).exists():
            return Response("Cannot have 2 Gantt's per project!", status=status.HTTP_409_CONFLICT)
          new_gantt = Gantt(
            project_id=project
          )
          new_gantt.save()
          return Response(GanttSerializer(new_gantt, many=False).data, status=status.HTTP_200_OK)
        except Project.DoesNotExist:
          return Response("Project does not exist, id error", status=status.HTTP_400_BAD_REQUEST)
 

@api_view(('PUT',))
@renderer_classes((JSONRenderer, ))
def update_gantt(request, gantt_id):
    permission, response = check_user_auth_and_app_permission(request, "projects")
    if not permission:
        return response
  
    data = request.data

    gantt = Gantt.objects.get(id=gantt_id)
    gantt.view_mode = data['view_mode']
    gantt.save()
    return Response(status=status.HTTP_200_OK)