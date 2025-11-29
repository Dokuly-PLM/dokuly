from django.db import models
from django.contrib.auth.models import User
from profiles.models import Profile
from parts.models import Part
from pcbas.models import Pcba
from assemblies.models import Assembly
from documents.models import Document


class Eco(models.Model):
    """Engineering Change Order (ECO) model.
    Used to track and manage engineering changes.
    """

    # Display name / title of the ECO
    display_name = models.CharField(max_length=150, blank=True, default="")

    # Description field using markdown
    description = models.ForeignKey(
        'documents.MarkdownText', on_delete=models.SET_NULL, null=True, blank=True
    )

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="eco_created_by"
    )
    responsible = models.ForeignKey(
        Profile, on_delete=models.SET_NULL, null=True, related_name="eco_responsible"
    )

    release_state = models.CharField(max_length=50, blank=True)
    quality_assurance = models.ForeignKey(
        Profile, on_delete=models.SET_NULL, null=True, related_name="eco_quality_assurance"
    )  # The person that did the review/approval
    released_date = models.DateTimeField(null=True, blank=True)
    released_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="eco_released_by"
    )


class AffectedItem(models.Model):
    """An item affected by an ECO.
    Links the ECO to the new (changed) revision of a part, pcba, assembly or document.
    """

    eco = models.ForeignKey(
        Eco, on_delete=models.CASCADE, related_name="affected_items"
    )

    # Only one of these should be set at a time
    part = models.ForeignKey(
        Part, on_delete=models.SET_NULL, blank=True, null=True, related_name="eco_affected_items"
    )
    pcba = models.ForeignKey(
        Pcba, on_delete=models.SET_NULL, blank=True, null=True, related_name="eco_affected_items"
    )
    assembly = models.ForeignKey(
        Assembly, on_delete=models.SET_NULL, blank=True, null=True, related_name="eco_affected_items"
    )
    document = models.ForeignKey(
        Document, on_delete=models.SET_NULL, blank=True, null=True, related_name="eco_affected_items"
    )

    # Optional comment about what changed
    description = models.CharField(max_length=500, blank=True, null=True)

    created_at = models.DateTimeField(auto_now_add=True)