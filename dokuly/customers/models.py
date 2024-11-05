from django.db import models
from django.contrib.auth.models import User


class Customer (models.Model):
    """Describes a Customer object.
    Connected with a User object as contact.
    """
    # Basic information fields
    name = models.CharField(max_length=50, blank=True)
    contact_name = models.CharField(max_length=50, blank=True, null=True)
    contact_email = models.CharField(max_length=75, blank=True, null=True)
    contact_phone_number = models.CharField(max_length=20, blank=True, null=True)
    description = models.TextField(max_length=500, blank=True, null=True)

    # Special customer id, formatted as NNN and should be unique. (currently frontend checks for this)
    customer_id = models.IntegerField(null=True)

    # The customer contact user.
    customer_contact = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True)

    # Metadata fields
    created_at = models.DateTimeField(auto_now_add=True)
    # Inactive objects should be filtered in views.
    is_active = models.BooleanField(null=True, default=True)

    favorite_project = models.CharField(max_length=3, null=True, blank=True)
    favorite_task = models.CharField(max_length=30, blank=True, null=True)

    # Object management fields
    is_archived = models.BooleanField(default=False, blank=True)
