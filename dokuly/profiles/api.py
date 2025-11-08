from profiles.models import Profile, TableView
from rest_framework import viewsets, permissions, serializers
from .serializers import ProfileSerializer, TableViewSerializer
from rest_framework.permissions import IsAuthenticated
from knox.auth import TokenAuthentication
from django.db.models import Q


class ProfileViewSet(viewsets.ModelViewSet):
    authetiation_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    queryset = Profile.objects.all()
    serializer_class = ProfileSerializer

    def perform_create(self, serializer):
        serializer.save()


class TableViewViewSet(viewsets.ModelViewSet):
    """
    ViewSet for managing table views.
    Users can see their personal views and shared views.
    """
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    serializer_class = TableViewSerializer
    
    def get_queryset(self):
        """
        Return views for the current user:
        - All personal views (user's own views)
        - All shared views (is_shared=True)
        Filtered by table_name if provided as query parameter
        """
        user = self.request.user
        table_name = self.request.query_params.get("table_name", None)
        
        queryset = TableView.objects.filter(
            Q(user=user) | Q(is_shared=True)
        )
        
        if table_name:
            queryset = queryset.filter(table_name=table_name)
        
        return queryset.order_by("-updated_at")
    
    def perform_create(self, serializer):
        """Set the user when creating a view"""
        serializer.save(user=self.request.user)
    
    def perform_update(self, serializer):
        """Only allow users to update their own views or shared views they created"""
        instance = serializer.instance
        if instance.user != self.request.user:
            # Allow updating shared views if user is the owner
            if not instance.is_shared or instance.user != self.request.user:
                raise serializers.ValidationError("You can only update your own views.")
        serializer.save()
    
    def perform_destroy(self, instance):
        """Only allow users to delete their own views"""
        if instance.user != self.request.user:
            raise serializers.ValidationError("You can only delete your own views.")
        instance.delete()
