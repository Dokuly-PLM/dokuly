from customers.models import Customer
from rest_framework import viewsets, permissions
from .serializers import CustomerSerializer
from rest_framework.permissions import IsAuthenticated
from knox.auth import TokenAuthentication


class CustomerViewSet(viewsets.ModelViewSet):
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    # Return queryset but only for the selected user
    # def get_queryset(self):

    #     return self.request.user.pcbs.all()

    def perform_create(self, serializer):
        serializer.save()
