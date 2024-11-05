from .models import File
from rest_framework import viewsets, permissions
from .serializers import FileSerializer
from rest_framework.permissions import IsAuthenticated
from knox.auth import TokenAuthentication


class FileViewSet(viewsets.ModelViewSet):
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = File.objects.all()
    serializer_class = FileSerializer

    def perform_create(self, serializer):
        serializer.save()
