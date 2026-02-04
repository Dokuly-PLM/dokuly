from django.db import models
from django.contrib.auth.models import User
from profiles.models import Profile


class TraceabilityEvent(models.Model):
    """
    Tracks traceability events for parts, PCBAs, assemblies, and documents.
    Records who made what changes and when.
    """

    # Event types
    EVENT_TYPE_CHOICES = [
        ("created", "Created"),
        ("revision_created", "Revision Created"),
        ("bom_edited", "BOM Edited"),
        ("bom_imported", "BOM Import"),
        ("bom_cleared", "Clear BOM"),
        ("approved", "Approved for Release"),
        ("released", "Released"),
        ("updated", "Updated"),
    ]

    # App types (which module this event relates to)
    APP_TYPE_CHOICES = [
        ("parts", "Parts"),
        ("pcbas", "PCBAs"),
        ("assemblies", "Assemblies"),
        ("documents", "Documents"),
    ]

    # The type of event
    event_type = models.CharField(
        max_length=50, choices=EVENT_TYPE_CHOICES, blank=False
    )

    # Which app/module this event relates to
    app_type = models.CharField(
        max_length=50, choices=APP_TYPE_CHOICES, blank=False
    )

    # ID of the item in the related app (e.g., part.id, pcba.id, etc.)
    item_id = models.IntegerField(blank=False)

    # The revision of the item when the event occurred
    revision = models.CharField(max_length=20, blank=True, null=True)

    # User who performed the action
    user = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="traceability_events"
    )

    # Profile of the user (for easier access to user details)
    profile = models.ForeignKey(
        Profile,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="traceability_events",
    )

    # Timestamp of when the event occurred
    timestamp = models.DateTimeField(auto_now_add=True)

    # Additional details about the event (e.g., revision notes, change description)
    details = models.TextField(max_length=20000, blank=True, null=True)

    # For BOM edits, we can store which BOM was edited (BOM ID)
    bom_id = models.IntegerField(blank=True, null=True)

    # Structured change data for "X changed Y from A to B" display
    field_name = models.CharField(max_length=255, blank=True, null=True)
    old_value = models.TextField(blank=True, null=True)
    new_value = models.TextField(blank=True, null=True)

    class Meta:
        ordering = ["-timestamp"]
        indexes = [
            models.Index(fields=["app_type", "item_id"]),
            models.Index(fields=["event_type"]),
            models.Index(fields=["timestamp"]),
        ]

    def __str__(self):
        return f"{self.event_type} - {self.app_type} #{self.item_id} by {self.user}"
