from profiles.models import Profile
from rest_framework import viewsets, permissions
from .serializers import ProfileSerializer
from rest_framework.permissions import IsAuthenticated
from knox.auth import TokenAuthentication


class ProfileViewSet(viewsets.ModelViewSet):
    authetiation_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer

    def perform_create(self, serializer):
        serializer.save()
