from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField, JSONField
from tenants.azure_storage import CustomAzureStorage
from django_cryptography.fields import encrypt
from rest_framework_api_key.models import AbstractAPIKey
from projects.models import Project


class Organization(models.Model):
    """For customer use.
    An instance describing the customer organization using SDP.
    """

    # Fields avialiable for the customer org
    org_number = models.CharField(
        unique=True, default="-1", blank=True, max_length=50)
    name = models.CharField(null=True, blank=True, max_length=50)
    num_employees = models.IntegerField(default=0, blank=True)
    description = models.CharField(default="", max_length=500, blank=True)
    logo = models.ImageField(
        storage=CustomAzureStorage, upload_to="images", null=True, blank=True
    )
    file_ids = ArrayField(
        models.IntegerField(default=-1, blank=True), null=True, blank=True
    )

    max_allowed_active_viewer_users = models.IntegerField(default=3, blank=True)

    # ND managed fields, for customer and cost management
    stripe_subscription_ids = ArrayField(
        models.CharField(null=True, blank=True, max_length=500), null=True, blank=True
    )
    current_system_cost = models.IntegerField(null=True, blank=True)
    max_allowed_active_users = models.IntegerField(default=1, blank=True)
    current_storage_size = models.BigIntegerField(
        blank=True, default=1
    )  # Saved as bytes
    storage_limit = models.BigIntegerField(
        blank=True, default=5368709120
    )  # 5GB in bytes

    # TODO Document these fields.
    image_ids = ArrayField(
        models.IntegerField(null=True, blank=True), null=True, blank=True
    )
    logo_id = models.IntegerField(null=True, blank=True)

    # The test user boolean grants access to parts of Dokuly that is in development.
    test_user = models.BooleanField(default=False, blank=True)
    tenant_id = models.CharField(null=True, blank=True, max_length=50)

    # 2FA control
    enforce_2fa = models.BooleanField(default=False, blank=True)

    # Currency control
    currency = models.CharField(default="USD", max_length=3, blank=True)
    currency_conversion_rates = models.JSONField(default={}, blank=True)
    currency_update_time = models.DateTimeField(null=True, blank=True)

    # Component Vault
    component_vault_api_key = encrypt(
        models.CharField(null=True, blank=True, max_length=1024)
    )

    # Enabled modules
    time_tracking_is_enabled = models.BooleanField(default=False, blank=True)
    document_is_enabled = models.BooleanField(default=True, blank=True)
    pcba_is_enabled = models.BooleanField(default=True, blank=True)
    assembly_is_enabled = models.BooleanField(default=True, blank=True)
    procurement_is_enabled = models.BooleanField(default=True, blank=True)
    requirement_is_enabled = models.BooleanField(default=True, blank=True)

    delivery_address = models.CharField(max_length=1000, blank=True, null=True)
    postal_code = models.CharField(max_length=1000, blank=True, null=True)
    country = models.CharField(max_length=1000, blank=True, null=True)
    billing_address = models.CharField(max_length=1000, blank=True, null=True)


class Subscription(models.Model):
    organization = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="subscriptions",
    )
    count = models.IntegerField(default=0, blank=True)
    subscription_data = models.JSONField(default=None, blank=True)
    last_updated = models.DateTimeField(auto_now=True)
    checkout_status = models.BooleanField(default=False, blank=True)


class OrganizationAPIKey(AbstractAPIKey):
    """
    An API key model to be used for authentication.
    """
    # Each Organization can have multiple API keys
    organization = models.ForeignKey(
        Organization,
        on_delete=models.SET_NULL,
        related_name="api_keys",
        null=True,
        blank=True
    )

    # Each API key can be associated with multiple projects
    # Empty array value here we be used as a wildcard for all projects
    projects = models.ManyToManyField(
        Project,
        related_name="api_keys",
        blank=True  # Allows the M2M field to be empty, acting as a wildcard
    )

    encrypted_api_key = encrypt(
        models.CharField(null=True, blank=True, max_length=2048)
    )

    # def save(self, *args, **kwargs):
    #     if self.pk:  # This is an update
    #         original = OrganizationAPIKey.objects.get(pk=self.pk)
    #         if original.organization_id != self.organization_id:
    #             raise ValueError(
    #                 "Updating the 'organization' field is not allowed.")
    #         # M2M field check is handled via signals or in view logic because of its nature
    #     super().save(*args, **kwargs)
