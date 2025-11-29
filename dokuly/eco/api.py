from rest_framework import viewsets, permissions
from .models import Eco
from .serializers import EcoSerializer


class EcoViewSet(viewsets.ModelViewSet):
    queryset = Eco.objects.all()
    permission_classes = [permissions.IsAuthenticated]
    serializer_class = EcoSerializer
