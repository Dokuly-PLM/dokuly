from part_numbers.models import PartNumber
from rest_framework import viewsets, permissions
from rest_framework.permissions import IsAuthenticated
from knox.auth import TokenAuthentication
from .serializers import PartNumberSerializer

# This class is used for the basic GET, PUT, POST, DELETE methods, using all objects stored in the database as the queryset.


class PartNumberViewSet(viewsets.ModelViewSet):
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = PartNumber.objects.all()
    serializer_class = PartNumberSerializer

    def perform_create(self, serializer):
        serializer.save()
