from django.db import models
from parts.models import Part
from assemblies.models import Assembly
from customers.models import Customer
from pcbas.models import Pcba
from production.models import Lot


class Location(models.Model):
    """Describes the physical storage of parts.
    Each location has a type both of location and container.
    Used together with the inventory log to create the parts inventar.
    """
    # Basic data fields
    name = models.CharField(max_length=150, blank=True, null=True)
    # The physical room the location is found
    room = models.CharField(max_length=150, blank=True, null=True)

    # Deprecated
    location_type = models.CharField(
        max_length=150, blank=True, null=True)
    # Row and columns if the location type requires a grid system.
    location_row = models.CharField(
        max_length=150, blank=True, null=True)
    location_column = models.CharField(
        max_length=150, blank=True, null=True)
    location_number = models.CharField(blank=True, null=True)
    location_type_v2 = models.ForeignKey(
        "LocationTypes", on_delete=models.SET_NULL, null=True, blank=True)

    capacity_full = models.CharField(max_length=5, blank=True, null=True)

    notes = models.CharField(blank=True, null=True)

    archived = models.IntegerField(blank=True, default=0)
    archived_date = models.DateField(null=True, blank=True)

    # Legacy data fields
    location_type_id = models.IntegerField(blank=True, default=-1)
    # Deprecated
    container_type = models.CharField(
        max_length=150, blank=True, null=True)
    container_number = models.CharField(max_length=150, blank=True, null=True)
    container_row = models.CharField(
        max_length=150, blank=True, null=True)
    container_column = models.CharField(
        max_length=150, blank=True, null=True)
    container_placement_number = models.CharField(max_length=50, blank=True, default="")


class Inventory(models.Model):
    """The inventory log.
    Each entry tracks inventar transactions.
    The sum of all entries for a part equals the current inventar for that part.
    """
    # Reference to part / asm
    part = models.ForeignKey(
        Part, on_delete=models.SET_NULL, null=True, blank=True)

    assembly = models.ForeignKey(
        Assembly, on_delete=models.SET_NULL, null=True, blank=True)

    pcba = models.ForeignKey(
        Pcba, on_delete=models.SET_NULL, null=True, blank=True)

    lot = models.ForeignKey(
        Lot, on_delete=models.SET_NULL, null=True, blank=True)

    # Owner of the transaction
    owner = models.ForeignKey(
        Customer, on_delete=models.SET_NULL, null=True, blank=True)

    # Reference to the location
    location = models.ForeignKey(
        Location, on_delete=models.SET_NULL, null=True, blank=True)

    # Transaction quantity
    quantity = models.IntegerField(null=True, blank=True)

    # Transaction metadata
    created_at = models.DateTimeField(auto_now_add=True)

    is_latest = models.BooleanField(default=False, blank=True)
    current_total_stock = models.IntegerField(null=True, blank=True)


class LocationTypes(models.Model):
    """Defines the location type.
    Contains the name and other metadata.
    """
    display_name = models.CharField(blank=True, max_length=50, null=True)
    description = models.CharField(blank=True, null=True, max_length=1000)
    # Using integerfield here as boolean types in Python causes some typing issues in dataflow.
    archived = models.IntegerField(blank=True, default=0)  # 0 is unarchived, 1 is archived
    archived_date = models.DateField(null=True, blank=True)

    # Boolean to mark if the container contains rows and cols. E.g. A Matrix has rows / cols, a box does not
    has_row_or_col = models.IntegerField(blank=True, default=0)
