from documents.models import Document
from rest_framework import viewsets, permissions
from .serializers import DocumentSerializer
from documents.serializers import DocumentPrefixSerializer
from documents.models import Document_Prefix
from rest_framework.permissions import IsAuthenticated
from knox.auth import TokenAuthentication


class DocumentViewSet(viewsets.ModelViewSet):
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Document.objects.all()
    serializer_class = DocumentSerializer

    def perform_create(self, serializer):
        serializer.save()


class DocumentPrefixViewSet(viewsets.ModelViewSet):
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Document_Prefix.objects.all()
    serializer_class = DocumentPrefixSerializer

    def perform_create(self, serializer):
        serializer.save()
