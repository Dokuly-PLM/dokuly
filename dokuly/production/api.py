from .models import Production
from rest_framework import viewsets, permissions
from .serializers import ProductionSerializer
from rest_framework.permissions import IsAuthenticated
from knox.auth import TokenAuthentication


class ProductionViewSet(viewsets.ModelViewSet):
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Production.objects.all()
    serializer_class = ProductionSerializer

    def perform_create(self, serializer):
        serializer.save()
