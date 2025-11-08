from rest_framework import serializers
from profiles.models import Notification, Profile, TableView
# from .models import Employee

# User Serializer


class ProfileSerializer(serializers.ModelSerializer):

    class Meta:
        model = Profile
        fields = (
            'id', 'first_name', 'last_name',
            'birth_date', 'personal_phone_number', 'personal_email',
            'work_email', 'bio', 'profile_image', 'address', 'zip_code',
            'position', 'position_percentage', 'contract', 'location',
            'is_active', 'role', 'organization_id', 'user', 'mfa_validated',
            'allowed_apps', 'notify_user_on_issue_creation', 'notify_user_on_issue_close',
            'notify_user_on_item_new_revision', 'notify_user_on_item_passed_review',
            'notify_user_on_item_released', 'notify_user_on_added_to_project',
            'notify_user_on_became_project_owner'
        )


class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'message', 'uri', 'app', 'created_at', 'is_viewed_by_user', 'is_project_notification']


class ProfileSerializerSmall(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ('id', 'first_name', 'last_name', 'profile_image')


class TableViewSerializer(serializers.ModelSerializer):
    """Serializer for TableView model"""
    
    class Meta:
        model = TableView
        fields = [
            "id",
            "table_name",
            "name",
            "user",
            "is_shared",
            "columns",
            "filters",
            "sorted_column",
            "sort_order",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "user", "created_at", "updated_at"]
    
    def create(self, validated_data):
        # Set the user from the request
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
