"""
Utility functions for logging traceability events.
These functions should be called from views when events occur.
"""

from django.contrib.auth.models import User
from .models import TraceabilityEvent
from profiles.models import Profile


def _get_user_display_name(user):
    """Return display name for traceability details (e.g. 'Erik' or 'Erik Smith')."""
    if not user:
        return "Unknown"
    try:
        profile = Profile.objects.get(user=user)
        if profile.first_name or profile.last_name:
            return f"{profile.first_name or ''} {profile.last_name or ''}".strip()
    except Profile.DoesNotExist:
        pass
    if user.get_full_name():
        return user.get_full_name()
    return user.username or "Unknown"


def _build_field_change_details(user, field_name, old_value, new_value):
    """Build human-readable details string for a field change."""
    user_name = _get_user_display_name(user)
    old_str = str(old_value).strip() if old_value is not None and str(old_value).strip() else None
    new_str = str(new_value).strip() if new_value is not None and str(new_value).strip() else None
    if old_str:
        return f"{user_name} changed {field_name} from {old_str} to {new_str or ''}"
    return f"{user_name} changed {field_name} to {new_str or ''}"


def log_traceability_event(
    event_type,
    app_type,
    item_id,
    user,
    revision=None,
    details=None,
    bom_id=None,
    field_name=None,
    old_value=None,
    new_value=None,
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
        field_name: Optional field name for structured change
        old_value: Optional old value for structured change
        new_value: Optional new value for structured change

    Returns:
        The created TraceabilityEvent object
    """
    # Build details from structured data if not provided
    if details is None and field_name is not None:
        details = _build_field_change_details(user, field_name, old_value, new_value)

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
        field_name=field_name,
        old_value=old_value,
        new_value=new_value,
    )

    return event


def log_field_change(
    app_type,
    item_id,
    user,
    revision,
    field_name,
    old_value,
    new_value,
    event_type="updated",
):
    """
    Log a single field change as a traceability event with structured data.
    Creates one TraceabilityEvent with field_name, old_value, new_value and
    a human-readable details string (e.g. "Erik changed display_name from x to y").
    """
    return log_traceability_event(
        event_type=event_type,
        app_type=app_type,
        item_id=item_id,
        user=user,
        revision=revision,
        field_name=field_name,
        old_value=old_value,
        new_value=new_value,
    )


def log_field_changes(app_type, item_id, user, revision, changes):
    """
    Log multiple field changes as separate traceability events.
    changes: list of dicts {"field": str, "old": str|None, "new": str|None}.
    Optional keys: "event_type" (default "updated"), "user" (override user for this change).
    """
    for c in changes:
        event_type = c.get("event_type", "updated")
        change_user = c.get("user")
        if change_user is None:
            change_user = user
        log_field_change(
            app_type=app_type,
            item_id=item_id,
            user=change_user,
            revision=revision,
            field_name=c["field"],
            old_value=c.get("old"),
            new_value=c.get("new"),
            event_type=event_type,
        )


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


def log_bom_change(
    app_type,
    item_id,
    user,
    bom_id,
    revision,
    field_name,
    old_value,
    new_value,
    details=None,
    refdes_for_quantity=None,
    event_type=None,
):
    """
    Log a single BOM change with structured field_name / old_value / new_value.
    Builds human-readable details if not provided.
    When refdes_for_quantity is set (for quantity changes), details become:
    "User X changed quantity from A to B on Ref.des: {refdes_for_quantity}".
    Use for: refdes/f/n change, add bom item, remove bom item, linked part/asm/pcba change, quantity change.
    event_type: optional; if None, defaults to "bom_edited". Use "bom_imported" or "bom_cleared" for import/clear.
    """
    if event_type is None:
        event_type = "bom_edited"
    if refdes_for_quantity is not None:
        field_name = f"quantity (Ref.des: {refdes_for_quantity})"
    if details is None:
        user_name = _get_user_display_name(user)
        if refdes_for_quantity is not None:
            details = (
                f"{user_name} changed quantity from {old_value} to {new_value} "
                f"on Ref.des: {refdes_for_quantity}"
            )
        elif old_value and new_value:
            details = f"{user_name} changed {field_name} from {old_value} to {new_value}"
        elif new_value:
            details = f"{user_name} {field_name}: {new_value}"
        elif old_value:
            details = f"{user_name} {field_name}: removed {old_value}"
        else:
            details = f"{user_name} {field_name}"
    return log_traceability_event(
        event_type=event_type,
        app_type=app_type,
        item_id=item_id,
        user=user,
        revision=revision,
        details=details,
        bom_id=bom_id,
        field_name=field_name,
        old_value=old_value,
        new_value=new_value,
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
