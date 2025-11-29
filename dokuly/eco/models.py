from django.db import models
from django.contrib.auth.models import User
from profiles.models import Profile


class Eco(models.Model):
    """Engineering Change Order (ECO) model.
    Used to track and manage engineering changes.
    """

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="eco_created_by"
    )
    responsible = models.ForeignKey(
        Profile, on_delete=models.SET_NULL, null=True, related_name="eco_responsible"
    )

    release_state = models.CharField(max_length=50, blank=True)
    released_date = models.DateTimeField(null=True, blank=True)
    released_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, related_name="eco_released_by"
    )
