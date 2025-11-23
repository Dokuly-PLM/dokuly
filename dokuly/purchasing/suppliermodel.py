from django.db import models
from django.contrib.auth.models import User
from files.models import Image


class Supplier(models.Model):
    name = models.CharField(null=True, blank=True, max_length=1000)
    supplier_id = models.IntegerField(null=True)
    website = models.CharField(null=True, blank=True, max_length=1000)
    address = models.CharField(null=True, blank=True, max_length=1000)
    contact = models.CharField(null=True, blank=True, max_length=1000)
    phone = models.CharField(null=True, blank=True, max_length=1000)
    email = models.CharField(null=True, blank=True, max_length=1000)
    notes = models.CharField(null=True, blank=True, max_length=100000)
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True)
    is_archived = models.BooleanField(null=True, blank=True, default=False)
    is_active = models.BooleanField(blank=True, default=True)
    thumbnail = models.ForeignKey(Image, on_delete=models.SET_NULL, null=True)
    default_currency = models.CharField(null=True, blank=True, max_length=1000)
    default_payment_terms = models.CharField(null=True, blank=True, max_length=1000)
    default_shipping_terms = models.CharField(null=True, blank=True, max_length=1000)
    default_vat = models.FloatField(null=True, blank=True)
    
    # Nexar API integration - maps this supplier to a Nexar seller ID
    # Allows automatic price/stock syncing from Nexar for this supplier
    # See: https://octopart.com/api/v4/values#sellers for available IDs
    nexar_seller_id = models.IntegerField(
        blank=True, 
        null=True,
        help_text="Nexar seller ID from the Octopart API (e.g., 459 for DigiKey)"
    )
