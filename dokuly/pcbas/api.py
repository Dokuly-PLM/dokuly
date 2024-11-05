from .models import Pcba
from rest_framework import viewsets, permissions
from .serializers import PcbaSerializer
from rest_framework.permissions import IsAuthenticated
from knox.auth import TokenAuthentication


class PcbaViewSet(viewsets.ModelViewSet):
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Pcba.objects.all()
    serializer_class = PcbaSerializer

    def perform_create(self, serializer):
        serializer.save()
