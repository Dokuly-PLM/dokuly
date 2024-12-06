from django.db import models
from django.contrib.postgres.fields import ArrayField, JSONField
from django.contrib.auth.models import User

from parts.models import Part
from purchasing.suppliermodel import Supplier
from purchasing.priceModel import Price
from files.models import File

from parts.models import Part
from pcbas.models import Pcba
from assemblies.models import Assembly
from production.models import Lot
from projects.models import Tag


class PurchaseOrder(models.Model):
    purchase_order_number = models.IntegerField()
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True, blank=True
    )
    supplier = models.ForeignKey(
        Supplier, on_delete=models.SET_NULL, null=True, blank=True
    )
    status = models.CharField(null=True, blank=True, max_length=1000, default="Draft")
    order_date = models.DateField(null=True, blank=True)
    estimated_delivery_date = models.DateField(null=True, blank=True)
    actual_delivery_date = models.DateField(null=True, blank=True)
    is_completed = models.BooleanField(null=True, blank=True, default=False)
    # Shall include part_id, quantity, price

    po_currency = models.CharField(null=True, blank=True)
    freight_carrier = models.CharField(null=True, blank=True)
    shipping_cost = models.DecimalField(max_digits=12, decimal_places=4, blank=True, default=0.0)
    total_price = models.FloatField(null=True, blank=True)

    notes = models.TextField(null=True, blank=True)
    payment_terms_in_days = models.IntegerField(null=True, default=0)
    incoterms = models.CharField(null=True, blank=True)

    # PO metadata
    delivery_address = models.CharField(max_length=1000, blank=True, null=True)
    postal_code = models.CharField(max_length=1000, blank=True, null=True)
    country = models.CharField(max_length=1000, blank=True, null=True)
    billing_address = models.CharField(max_length=1000, blank=True, null=True)
    name_of_purchaser = models.CharField(max_length=1000, blank=True, null=True)
    purchasing_reference = models.CharField(max_length=1000, blank=True, null=True)
    payment_terms = models.CharField(max_length=1000, blank=True, null=True)
    tracking_number = models.CharField(max_length=1000, blank=True, null=True)
    vat = models.FloatField(blank=True, null=True, default=0.0)

    # Connected Lot
    lot = models.ForeignKey(Lot, on_delete=models.SET_NULL, null=True, blank=True)

    # Any files related to PO. Deleted files, have their archived field set to true.
    files = models.ManyToManyField(File, blank=True)

    tags = models.ManyToManyField(Tag, blank=True, symmetrical=False, related_name="po_tags")

    # DEPRECSATED
    order_items = models.JSONField(null=False, blank=True)
    parts_array = models.ManyToManyField(Part, blank=True)


class PoItem(models.Model):
    """An ingoing item in a purchase order."""

    po = models.ForeignKey(
        PurchaseOrder, on_delete=models.CASCADE, blank=True, null=True
    )

    quantity = models.FloatField(blank=True, default=1.0)
    # Price per unit
    price = models.DecimalField(max_digits=12, decimal_places=4, blank=True, default=0.0)
    comment = models.CharField(max_length=1000, blank=True, null=True)
    designator = models.CharField(max_length=1000, blank=True, null=True)

    part = models.ForeignKey(
        Part, on_delete=models.SET_NULL, blank=True, null=True, related_name="po_item"
    )
    pcba = models.ForeignKey(
        Pcba, on_delete=models.SET_NULL, blank=True, null=True, related_name="po_item"
    )
    assembly = models.ForeignKey(
        Assembly,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="po_item",
    )

    # For csv import. Before parts are matched, a temporary MPN/PN and manufacturer is used.
    temporary_mpn = models.CharField(max_length=100, blank=True, null=True)
    temporary_manufacturer = models.CharField(max_length=100, blank=True, null=True)

    item_received = models.BooleanField(null=True, blank=True, default=False)

    quantity_received = models.IntegerField(blank=True, default=0)
