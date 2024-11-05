from .models import SerialNumber
from rest_framework import viewsets, permissions
from .serializers import SerialNumberSerializer
from rest_framework.permissions import IsAuthenticated
from knox.auth import TokenAuthentication


class SerialNumberViewSet(viewsets.ModelViewSet):
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = SerialNumber.objects.all()
    serializer_class = SerialNumberSerializer

    def perform_create(self, serializer):
        serializer.save()
