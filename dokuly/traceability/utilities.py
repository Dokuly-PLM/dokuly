"""
Utility functions for logging traceability events.
These functions should be called from views when events occur.
"""

from django.contrib.auth.models import User
from .models import TraceabilityEvent
from profiles.models import Profile


def log_traceability_event(
    event_type,
    app_type,
    item_id,
    user,
    revision=None,
    details=None,
    bom_id=None,
):
    """
    Log a traceability event.

    Args:
        event_type: One of the EVENT_TYPE_CHOICES (created, revision_created, bom_edited, approved, released, updated)
        app_type: One of the APP_TYPE_CHOICES (parts, pcbas, assemblies, documents)
        item_id: The ID of the item
        user: The User object who performed the action
        revision: Optional revision string
        details: Optional details about the event
        bom_id: Optional BOM ID (for BOM edit events)

    Returns:
        The created TraceabilityEvent object
    """
    # Get or create profile for the user
    profile = None
    if user:
        try:
            profile = Profile.objects.get(user=user)
        except Profile.DoesNotExist:
            pass

    event = TraceabilityEvent.objects.create(
        event_type=event_type,
        app_type=app_type,
        item_id=item_id,
        user=user,
        profile=profile,
        revision=revision,
        details=details,
        bom_id=bom_id,
    )

    return event


def log_created_event(app_type, item_id, user, revision=None, details=None):
    """Log a 'created' event."""
    return log_traceability_event(
        event_type="created",
        app_type=app_type,
        item_id=item_id,
        user=user,
        revision=revision,
        details=details,
    )


def log_revision_created_event(
    app_type, item_id, user, revision=None, details=None
):
    """Log a 'revision_created' event."""
    return log_traceability_event(
        event_type="revision_created",
        app_type=app_type,
        item_id=item_id,
        user=user,
        revision=revision,
        details=details,
    )


def log_bom_edited_event(app_type, item_id, user, bom_id, revision=None, details=None):
    """Log a 'bom_edited' event."""
    return log_traceability_event(
        event_type="bom_edited",
        app_type=app_type,
        item_id=item_id,
        user=user,
        revision=revision,
        details=details,
        bom_id=bom_id,
    )


def log_approved_event(app_type, item_id, user, revision=None, details=None):
    """Log an 'approved' event."""
    return log_traceability_event(
        event_type="approved",
        app_type=app_type,
        item_id=item_id,
        user=user,
        revision=revision,
        details=details,
    )


def log_released_event(app_type, item_id, user, revision=None, details=None):
    """Log a 'released' event."""
    return log_traceability_event(
        event_type="released",
        app_type=app_type,
        item_id=item_id,
        user=user,
        revision=revision,
        details=details,
    )


def log_updated_event(app_type, item_id, user, revision=None, details=None):
    """Log an 'updated' event."""
    return log_traceability_event(
        event_type="updated",
        app_type=app_type,
        item_id=item_id,
        user=user,
        revision=revision,
        details=details,
    )
