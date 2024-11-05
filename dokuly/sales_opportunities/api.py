from .models import SalesOpportunity
from rest_framework import viewsets, permissions
from .serializers import SalesOpportunitySerializer
from rest_framework.permissions import IsAuthenticated
from knox.auth import TokenAuthentication


class SalesOpportunityViewSet(viewsets.ModelViewSet):
    pauthetiation_classis = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = SalesOpportunity.objects.all()
    serializer_class = SalesOpportunitySerializer

    def perform_create(self, serializer):
        serializer.save()
