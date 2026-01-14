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

    # Enabled modules
    time_tracking_is_enabled = models.BooleanField(default=False, blank=True)
    document_is_enabled = models.BooleanField(default=True, blank=True)
    pcba_is_enabled = models.BooleanField(default=True, blank=True)
    assembly_is_enabled = models.BooleanField(default=True, blank=True)
    procurement_is_enabled = models.BooleanField(default=True, blank=True)
    requirement_is_enabled = models.BooleanField(default=True, blank=True)
    production_is_enabled = models.BooleanField(default=False, blank=True)
    customer_is_enabled = models.BooleanField(default=True, blank=True)
    supplier_is_enabled = models.BooleanField(default=True, blank=True)
    inventory_is_enabled = models.BooleanField(default=True, blank=True)
    eco_is_enabled = models.BooleanField(default=True, blank=True)

    # Part numbering and revision settings
    full_part_number_template = models.CharField(
        max_length=100,
        default="<prefix><part_number><revision>",
        blank=True,
        help_text="Template for formatting full part numbers. Use <prefix>, <part_number>, <major_revision>, <minor_revision>"
    )
    formatted_revision_template = models.CharField(
        max_length=100,
        default="<major_revision>",
        blank=True,
    )
    use_number_revisions = models.BooleanField(default=False, blank=True)
    revision_format = models.CharField(
        max_length=20, 
        default="major-minor", 
        choices=[
            ("major-only", "Major Only"),
            ("major-minor", "Major-Minor")
        ],
        blank=True,
        help_text="Format for revisions. Applies to both letter (A, B vs A-0, A-1) and number systems. For number systems, the starting value (0 or 1) is controlled by start_major_revision_at_one setting."
    )
    start_major_revision_at_one = models.BooleanField(
        default=False, 
        blank=True,
        help_text="When enabled and using number-based revisions, display major revisions starting at 1 instead of 0 (e.g., 1, 2, 3... instead of 0, 1, 2...). Minor revisions always start at 0 regardless of this setting (e.g., 1-0, 1-1, 1-2, 2-0...). Does not affect how revisions are stored in the database."
    )
    
    # Document numbering settings
    full_document_number_template = models.CharField(
        max_length=100,
        default="<prefix><project_number>-<document_number><revision>",
        blank=True,
        help_text="Template for formatting full document numbers. Use <prefix>, <project_number>, <part_number>, <document_number>, <major_revision>, <minor_revision>, <revision>, <day>, <month>, <year>"
    )
    document_use_number_revisions = models.BooleanField(
        default=False, 
        blank=True,
        help_text="When enabled, documents will use number-based revisions instead of letters (0, 1, 2... instead of A, B, C...)"
    )
    document_revision_format = models.CharField(
        max_length=20, 
        default="major-minor", 
        choices=[
            ("major-only", "Major Only"),
            ("major-minor", "Major-Minor")
        ],
        blank=True,
        help_text="Format for document revisions. Major-only uses single revisions (A, B, C or 0, 1, 2), while major-minor allows sub-revisions (A-0, A-1 or 0-0, 0-1)"
    )
    document_start_major_revision_at_one = models.BooleanField(
        default=False, 
        blank=True,
        help_text="When enabled and using number-based revisions for documents, display major revisions starting at 1 instead of 0 (e.g., 1, 2, 3... instead of 0, 1, 2...). Minor revisions always start at 0 regardless of this setting."
    )
    
    delivery_address = models.CharField(max_length=1000, blank=True, null=True)
    postal_code = models.CharField(max_length=1000, blank=True, null=True)
    country = models.CharField(max_length=1000, blank=True, null=True)
    billing_address = models.CharField(max_length=1000, blank=True, null=True)

    #-----------------------------------------------------------------------------------------------------------------------
    #DEPRECATED

    # DEPRECATED: Storage tracking fields - kept for backwards compatibility
    # Storage limits are no longer enforced since its open source
    current_storage_size = models.BigIntegerField(
        blank=True, default=1
    )  # Saved as bytes
    storage_limit = models.BigIntegerField(
        blank=True, default=5368709120
    )  # 5GB in bytes (DEPRECATED - not enforced)

    # Component Vault
    component_vault_api_key = encrypt(  
        models.CharField(null=True, blank=True, max_length=1024) # DEPRECATED #TODO delete field
    )

    stripe_subscription_ids = ArrayField(
        models.CharField(null=True, blank=True, max_length=500), null=True, blank=True  # DEPRECATED
    )
    revision_separator = models.CharField(  # DEPRECATED
        max_length=5,
        default="-",
        choices=[
            ("-", "Dash"),
            (".", "Dot")
        ],
        blank=True,
        help_text="Separator between major and minor revisions (e.g., A-0 or A.0, 1-0 or 1.0)"
    )
    current_system_cost = models.IntegerField(null=True, blank=True)  # DEPRECATED
    max_allowed_active_users = models.IntegerField(default=1, blank=True)  # DEPRECATED



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


class Rules(models.Model):
    """
    Release rules configuration for an organization or project.
    Controls what requirements must be met before releasing assemblies and PCBAs.
    """
    
    # Link to organization (required) or project (optional for project-specific overrides)
    organization = models.OneToOneField(
        Organization,
        on_delete=models.CASCADE,
        related_name="rules",
        null=True,
        blank=True
    )
    
    project = models.OneToOneField(
        Project,
        on_delete=models.CASCADE,
        related_name="rules",
        null=True,
        blank=True
    )
    
    # Release requirements
    require_released_bom_items_assembly = models.BooleanField(
        default=False,
        blank=True,
        help_text="Require all BOM items to be released before releasing an Assembly"
    )
    
    require_released_bom_items_pcba = models.BooleanField(
        default=False,
        blank=True,
        help_text="Require all BOM items to be released before releasing a PCBA"
    )
    
    require_matched_bom_items_assembly = models.BooleanField(
        default=False,
        blank=True,
        help_text="Require all BOM items to be matched to a Part, PCBA, or Assembly before releasing an Assembly"
    )
    
    require_matched_bom_items_pcba = models.BooleanField(
        default=False,
        blank=True,
        help_text="Require all BOM items to be matched to a Part, PCBA, or Assembly before releasing a PCBA"
    )
    
    # Review requirements
    require_review_on_part = models.BooleanField(
        default=False,
        blank=True,
        help_text="Require review approval before releasing a Part"
    )
    
    require_review_on_pcba = models.BooleanField(
        default=False,
        blank=True,
        help_text="Require review approval before releasing a PCBA"
    )
    
    require_review_on_assembly = models.BooleanField(
        default=False,
        blank=True,
        help_text="Require review approval before releasing an Assembly"
    )
    
    require_review_on_document = models.BooleanField(
        default=False,
        blank=True,
        help_text="Require review approval before releasing a Document"
    )
    
    # ECO-specific rules
    require_review_on_eco = models.BooleanField(
        default=False,
        blank=True,
        help_text="Require review approval before releasing an ECO"
    )
    
    require_all_affected_items_reviewed_for_eco = models.BooleanField(
        default=False,
        blank=True,
        help_text="Require all affected items to be reviewed before releasing an ECO"
    )
    
    require_bom_items_released_or_in_eco = models.BooleanField(
        default=False,
        blank=True,
        help_text="Require BOM items of affected assemblies/PCBAs to be released or included in the ECO"
    )
    
    require_bom_items_matched_for_eco_assembly = models.BooleanField(
        default=False,
        blank=True,
        help_text="Require all BOM items of affected Assemblies to be matched to a Part, PCBA, or Assembly before releasing an ECO"
    )
    
    require_bom_items_matched_for_eco_pcba = models.BooleanField(
        default=False,
        blank=True,
        help_text="Require all BOM items of affected PCBAs to be matched to a Part, PCBA, or Assembly before releasing an ECO"
    )
    
    require_revision_notes_on_affected_items = models.BooleanField(
        default=False,
        blank=True,
        help_text="Require all affected items in an ECO to have revision notes before releasing"
    )
    
    # Override permissions - choices: Owner, Admin, User, Project Owner
    PERMISSION_CHOICES = [
        ('Owner', 'Owner'),
        ('Admin', 'Admin'),
        ('Project Owner', 'Project Owner'),
        ('User', 'User'),
    ]
    
    override_permission = models.CharField(
        max_length=20,
        choices=PERMISSION_CHOICES,
        default='Admin',
        blank=True,
        help_text="Minimum role required to override release rules"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Release Rules"
        verbose_name_plural = "Release Rules"
        # Ensure either organization or project is set, but not both
        constraints = [
            models.CheckConstraint(
                check=models.Q(organization__isnull=False, project__isnull=True) | 
                      models.Q(organization__isnull=True, project__isnull=False),
                name='release_rules_org_or_project'
            )
        ]
    
    def __str__(self):
        if self.organization:
            return f"Release Rules for {self.organization.name}"
        elif self.project:
            return f"Release Rules for Project {self.project.title}"
        return "Release Rules"


class IntegrationSettings(models.Model):
    """
    Integration settings for external APIs (DigiKey, Nexar, etc.)
    Stores API credentials and field mapping configurations per organization.
    """
    
    organization = models.OneToOneField(
        Organization,
        on_delete=models.CASCADE,
        related_name="integration_settings",
        null=True,
        blank=True
    )
    
    # DigiKey API credentials (plain text, no encryption)
    digikey_client_id = models.CharField(max_length=500, blank=True, null=True)
    digikey_client_secret = models.CharField(max_length=500, blank=True, null=True)
    
    # DigiKey locale settings for API queries
    digikey_locale_site = models.CharField(
        max_length=10,
        default="US",
        blank=True,
        help_text="DigiKey locale site code (e.g., US, CA, UK, DE). Default: US"
    )
    digikey_locale_currency = models.CharField(
        max_length=10,
        default="USD",
        blank=True,
        help_text="DigiKey locale currency code (e.g., USD, EUR, GBP). Default: USD"
    )
    digikey_locale_language = models.CharField(
        max_length=10,
        default="en",
        blank=True,
        help_text="DigiKey locale language code (e.g., en, de, fr). Default: en"
    )
    
    # Field mapping configuration - maps DigiKey API response fields to part model fields
    # Example: {"rohs": "is_rohs_compliant", "ul": "is_ul_compliant", "datasheet": "datasheet"}
    digikey_field_mapping = models.JSONField(
        default=dict,
        blank=True,
        help_text="Maps DigiKey API response fields to part model fields"
    )
    
    # DigiKey supplier selection - user selects which supplier to use for DigiKey prices
    digikey_supplier = models.ForeignKey(
        'purchasing.Supplier',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='digikey_integration_settings',
        help_text="Supplier to use when creating prices from DigiKey parts"
    )
    
    # Nexar API credentials (plain text, no encryption)
    nexar_client_id = models.CharField(max_length=500, blank=True, null=True)
    nexar_client_secret = models.CharField(max_length=500, blank=True, null=True)
    
    # Odoo API credentials and settings
    odoo_enabled = models.BooleanField(default=False, help_text="Enable Odoo integration")
    odoo_url = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Odoo instance URL (e.g., https://mycompany.odoo.com)"
    )
    odoo_database = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Odoo database name"
    )
    odoo_username = models.CharField(
        max_length=200,
        blank=True,
        null=True,
        help_text="Odoo username (required for API key authentication)"
    )
    odoo_api_key = models.CharField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Odoo API key for authentication"
    )
    odoo_auto_push_on_release = models.BooleanField(
        default=False,
        help_text="Automatically push to Odoo when items are released"
    )
    odoo_default_product_category_id = models.IntegerField(
        blank=True,
        null=True,
        help_text="Default Odoo product category ID"
    )
    odoo_default_uom_id = models.IntegerField(
        blank=True,
        null=True,
        help_text="Default Odoo unit of measure ID"
    )
    odoo_default_product_type = models.CharField(
        max_length=50,
        default='consu',
        blank=True,
        choices=[
            ('consu', 'Goods'),
            ('service', 'Service'),
            ('combo', 'Combo')
        ],
        help_text="Default product type in Odoo"
    )
    
    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Integration Settings"
        verbose_name_plural = "Integration Settings"
    
    def __str__(self):
        if self.organization:
            return f"Integration Settings for {self.organization.name}"
        return "Integration Settings"
