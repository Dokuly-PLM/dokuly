from assemblies.models import Assembly
from rest_framework import viewsets, permissions
from .serializers import AssemblySerializer
from rest_framework.permissions import IsAuthenticated
from knox.auth import TokenAuthentication


class AssemblyViewSet(viewsets.ModelViewSet):
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Assembly.objects.all()
    serializer_class = AssemblySerializer

    def perform_create(self, serializer):
        serializer.save()
