from timetracking.models import EmployeeTime
from rest_framework import viewsets, permissions
from .serializers import EmployeeTimeSerializer
from rest_framework.permissions import IsAuthenticated
from knox.auth import TokenAuthentication


class EmployeeTimeViewSet(viewsets.ModelViewSet):
    pauthetiation_classis = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = EmployeeTime.objects.all()
    serializer_class = EmployeeTimeSerializer
    # Return queryset but only for the selected user
    # def get_queryset(self):

    #     return self.request.user.pcbs.all()

    def perform_create(self, serializer):
        serializer.save()
