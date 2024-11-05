from django.db import models
from django.contrib.auth.models import User
from django.core.validators import validate_comma_separated_integer_list
from django.contrib.postgres.fields import ArrayField
# Create your models here.


class SalesOpportunity(models.Model):
    """Used to document potential customers and sales. Currently deprecated.
    """

    # Basic data fields
    name = models.CharField(max_length=50, blank=True, null=True)
    description = models.TextField(max_length=50000, blank=True)
    state = models.CharField(max_length=50, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    # Assignee reference.
    assignee = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    last_updated = models.DateTimeField(auto_now=True)
    interest_level = models.IntegerField(blank=True, null=True)
    comment_content = ArrayField(
        models.TextField(max_length=5000,  blank=True), default=list, null=True)
    comment_user = ArrayField(
        models.IntegerField(blank=True, null=True), default=list, null=True)
    comment_date = ArrayField(
        models.DateField(blank=True, null=True), default=list, null=True)
