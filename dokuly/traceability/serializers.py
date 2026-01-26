from rest_framework import serializers
from .models import TraceabilityEvent
from profiles.serializers import ProfileSerializer


class TraceabilityEventSerializer(serializers.ModelSerializer):
    """Full serializer for TraceabilityEvent (single event / detail)."""

    # Include user details
    user_first_name = serializers.CharField(
        source="user.first_name", read_only=True
    )
    user_last_name = serializers.CharField(source="user.last_name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)

    # Include profile details if available
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = TraceabilityEvent
        fields = [
            "id",
            "event_type",
            "app_type",
            "item_id",
            "revision",
            "user",
            "user_first_name",
            "user_last_name",
            "user_email",
            "profile",
            "timestamp",
            "details",
            "bom_id",
            "field_name",
            "old_value",
            "new_value",
        ]
        read_only_fields = ["id", "timestamp"]


class TraceabilityEventTableSerializer(serializers.ModelSerializer):
    """Serializer for traceability table: same as full but excludes revision (table is per item/revision)."""

    user_first_name = serializers.CharField(
        source="user.first_name", read_only=True
    )
    user_last_name = serializers.CharField(source="user.last_name", read_only=True)
    user_email = serializers.CharField(source="user.email", read_only=True)
    profile = ProfileSerializer(read_only=True)

    class Meta:
        model = TraceabilityEvent
        fields = [
            "id",
            "event_type",
            "app_type",
            "item_id",
            "user",
            "user_first_name",
            "user_last_name",
            "user_email",
            "profile",
            "timestamp",
            "details",
            "bom_id",
            "field_name",
            "old_value",
            "new_value",
        ]
        read_only_fields = ["id", "timestamp"]
