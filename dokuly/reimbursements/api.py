from .models import Reimbursement
from rest_framework import viewsets, permissions
from .serializers import ReimbursementSerializer
from rest_framework.permissions import IsAuthenticated
from knox.auth import TokenAuthentication


class ReimbursementViewSet(viewsets.ModelViewSet):
    pauthetiation_classis = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Reimbursement.objects.all()
    serializer_class = ReimbursementSerializer

    def perform_create(self, serializer):
        serializer.save()
