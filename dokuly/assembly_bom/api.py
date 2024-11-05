from assembly_bom.models import Assembly_bom
from rest_framework import viewsets, permissions
from rest_framework.permissions import IsAuthenticated
from knox.auth import TokenAuthentication
from .serializers import Assembly_bomSerializer


class Assembly_bomViewset(viewsets.ModelViewSet):
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Assembly_bom.objects.all()
    serializer_class = Assembly_bomSerializer

    def perform_create(self, serializer):
        serializer.save()
