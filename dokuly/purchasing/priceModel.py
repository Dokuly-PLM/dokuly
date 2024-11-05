from django.db import models
from django.contrib.postgres.fields import ArrayField, JSONField

from django.contrib.auth.models import User
from purchasing.suppliermodel import Supplier
from files.models import File
from pcbas.models import Pcba
from parts.models import Part
from assemblies.models import Assembly


class Price(models.Model):
    price = models.DecimalField(max_digits=12, decimal_places=4, blank=True)
    minimum_order_quantity = models.IntegerField(blank=True, default=1, null=True)
    currency = models.CharField(max_length=20, blank=True, default="", null=True)

    supplier = models.ForeignKey(
        Supplier, on_delete=models.SET_NULL, null=True, blank=True
    )

    part = models.ForeignKey(
        "parts.Part",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="prices",
    )
    assembly = models.ForeignKey(
        "assemblies.Assembly",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="prices",
    )
    pcba = models.ForeignKey(
        "pcbas.Pcba",
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name="prices",
    )

    is_latest_price = models.BooleanField(default=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    last_updated = models.DateTimeField(auto_now=True)
