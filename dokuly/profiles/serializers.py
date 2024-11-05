from rest_framework import serializers
from profiles.models import Notification, Profile
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
