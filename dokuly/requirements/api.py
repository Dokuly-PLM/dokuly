from rest_framework import viewsets, permissions
from .models import RequirementSet, Requirement
from .serializers import RequirementSetSerializer, RequirementSerializer
from rest_framework.permissions import IsAuthenticated
from knox.auth import TokenAuthentication


class RequirementSetViewSet(viewsets.ModelViewSet):
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = RequirementSet.objects.all()
    serializer_class = RequirementSetSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class RequirementViewSet(viewsets.ModelViewSet):
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Requirement.objects.all()
    serializer_class = RequirementSerializer

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
