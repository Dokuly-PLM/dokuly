from .models import Image
from rest_framework import viewsets, permissions
from .serializers import ImageSerializer
from rest_framework.permissions import IsAuthenticated
from knox.auth import TokenAuthentication


class ImageViewSet(viewsets.ModelViewSet):
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Image.objects.all()
    serializer_class = ImageSerializer

    def perform_create(self, serializer):
        serializer.save()
