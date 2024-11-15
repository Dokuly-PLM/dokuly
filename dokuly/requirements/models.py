from django.db import models

from django.contrib.auth.models import User
from documents.models import Reference_List
from profiles.models import Profile
from projects.models import Project, Tag


class RequirementSet(models.Model):
    """A group of requirements that are related"""

    display_name = models.CharField(max_length=400)
    description = models.TextField(blank=True, null=True)

    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    tags = models.ManyToManyField(Tag, blank=True, symmetrical=False, related_name="requirement_sets_tags")


class Requirement(models.Model):
    # requirement_set is configured for every requirement.
    requirement_set = models.ForeignKey(
        RequirementSet, on_delete=models.CASCADE, related_name="requirements", null=True
    )
    # Subrequirements have a parent, in addition to the requirement_set
    parent_requirement = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="children",
    )

    derived_from = models.ManyToManyField(
        "self",
        symmetrical=False,
        related_name="derived_requirements",
        blank=True
    )

    # This relation is used to mark a requirement as superseded by another requirement.
    superseded_by = models.ForeignKey(
        "self",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="superseded_requirements",
    )

    state = models.CharField(max_length=100, default="", blank=True, null=True)
    quality_assurance = models.ForeignKey(
        Profile, on_delete=models.SET_NULL, null=True
    )  # The person that did the review.

    # This field is for documentation of: Why is this requirement needed? Why is it derived etc.
    rationale = models.TextField(default="", blank=True, null=True)

    # This field has never been used.
    reference_list = models.ForeignKey(
        Reference_List, on_delete=models.SET_NULL, null=True
    )

    # "Shall", "Should"
    obligation_level = models.CharField(
        max_length=25, default="", blank=True, null=True
    )

    tags = models.ManyToManyField(Tag, blank=True, symmetrical=False, related_name="requirements_tags")

    # SEBoK: Functional, Performance, Usability, Interface, Operational, Mode and State, Adaptability, Physical Constraint, Design Constraint, Environmental, Logistical, Policy and Regulation, Cost and Schedule Constraints, Reliability, Safety, Security
    type = models.CharField(max_length=100, default="", blank=True, null=True)

    # The actual requirement
    statement = models.TextField(default="", blank=True, null=True)

    # SEBoK: Inspection, Analysis, Analogy or Similarity, Demonstration, Test, Sampling
    verification_class = models.CharField(
        max_length=25, default="", blank=True, null=True
    )
    # Describe in detail how the requirement is verified.
    verification_method = models.TextField(default="", blank=True, null=True)
    # Document the results of the verification
    verification_results = models.TextField(default="", blank=True, null=True)
    is_verified = models.BooleanField(default=False)

    verified_by = models.ForeignKey(
        Profile, on_delete=models.SET_NULL, null=True, related_name="verified_by")

    created_at = models.DateTimeField(auto_now_add=True)
    last_updated = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    # __________________________________________________________________________________________
    # DEPRECATED fields

    old_tags = models.CharField(max_length=400, default="", blank=True, null=True)
