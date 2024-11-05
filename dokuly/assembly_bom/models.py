from django.db import models
from django.contrib.postgres.fields import ArrayField

from django.contrib.auth.models import User
from parts.models import Part
from pcbas.models import Pcba
from assemblies.models import Assembly
from django.core.validators import validate_comma_separated_integer_list


# Create your models here.
class Assembly_bom(models.Model):
    """Collection of parts / asms / pcbas.
    Describes the materials needed to assemble an assembly.
    """

    # This field specifies which assembly this BOM variant belongs to.
    assembly_id = models.IntegerField(null=True, blank=True)
    # This field specifies which PCBA this BOM variant belongs to.
    pcba = models.ForeignKey(Pcba, on_delete=models.SET_NULL, blank=True, null=True)

    # Basic assembly_bom data
    bom_name = models.TextField(null=True, blank=True, max_length=50)
    comments = models.CharField(max_length=500, null=True, blank=True)


class Bom_item(models.Model):
    """An ingoing item in a bill of materials."""

    bom = models.ForeignKey(
        Assembly_bom, on_delete=models.CASCADE, blank=True, null=True
    )

    # Reference Designator or Find Number
    designator = models.CharField(max_length=1000, blank=True, null=True)
    quantity = models.FloatField(blank=True, default=1.0)
    # If a component has property Do Not Mound (DNM), is_mounted is set to false.
    is_mounted = models.BooleanField(default=True, blank=True)

    # For bom import. Before parts are matched, a temporary MPN and manufacturer is used.
    temporary_mpn = models.CharField(max_length=100, blank=True, null=True)
    temporary_manufacturer = models.CharField(max_length=100, blank=True, null=True)
    comment = models.CharField(max_length=1000, blank=True, null=True)

    # Assuming Part, Pcba, and Assembly are other models you have defined
    part = models.ForeignKey(
        Part, on_delete=models.SET_NULL, blank=True, null=True, related_name="bom_item"
    )
    pcba = models.ForeignKey(
        Pcba, on_delete=models.SET_NULL, blank=True, null=True, related_name="bom_item"
    )
    assembly = models.ForeignKey(
        Assembly,
        on_delete=models.SET_NULL,
        blank=True,
        null=True,
        related_name="bom_item",
    )
