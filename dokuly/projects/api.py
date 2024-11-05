from projects.models import Project
from rest_framework import viewsets, permissions
from .serializers import ProjectSerializer
from rest_framework.permissions import IsAuthenticated
from knox.auth import TokenAuthentication


class ProjectViewSet(viewsets.ModelViewSet):
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Project.objects.all()
    serializer_class = ProjectSerializer

    def perform_create(self, serializer):
        serializer.save()
