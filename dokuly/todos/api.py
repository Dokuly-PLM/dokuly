from .models import Todo
from rest_framework import viewsets, permissions
from .serializers import TodoSerializer
from rest_framework.permissions import IsAuthenticated
from knox.auth import TokenAuthentication


class TodoViewSet(viewsets.ModelViewSet):
    pauthetiation_classis = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Todo.objects.all()
    serializer_class = TodoSerializer

    def perform_create(self, serializer):
        serializer.save()
