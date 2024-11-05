from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField, JSONField

from pcbas.models import Pcba
from parts.models import Part
from assemblies.models import Assembly
from files.models import File


class Lot (models.Model):
    """Production Lot or batch"""
    # Lot information
    lot_number = models.CharField(null=True, blank=True, max_length=50)
    title = models.CharField(max_length=1000, null=True, blank=True)
    quantity = models.IntegerField(null=True, blank=True)
    description = models.ForeignKey('documents.MarkdownText', on_delete=models.SET_NULL, null=True, blank=True)
    planned_production_date = models.DateTimeField(null=True, blank=True)
    serial_number_counter = models.IntegerField(null=True, blank=True)

    # Lot item connection
    pcba = models.ForeignKey(
        Pcba, on_delete=models.SET_NULL, null=True, related_name="lot_item_pcba")
    part = models.ForeignKey(
        Part, on_delete=models.SET_NULL, null=True, related_name="lot_item_part")
    assembly = models.ForeignKey(
        Assembly, on_delete=models.SET_NULL, null=True, related_name="lot_item_assembly")

    # Metadata
    is_archived = models.BooleanField(default=False, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)


class Production (models.Model):
    """Produced item with a unique serial number.
    """

    # The assembled products serial number
    serial_number = models.CharField(max_length=50, null=True)

    # Basic information fields
    assembly_date = models.DateField(null=True)
    state = models.CharField(max_length=20, null=True)

    comment = models.CharField(max_length=800, null=True)

    last_updated = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True)

    # Foreign Key relation to production Lot
    lot = models.ForeignKey(Lot, on_delete=models.SET_NULL,
                            null=True, related_name="production_items")

    pcba = models.ForeignKey(
        Pcba, on_delete=models.SET_NULL, null=True, related_name="serial_numbers")
    part = models.ForeignKey(
        Part, on_delete=models.SET_NULL, null=True, related_name="serial_numbers")
    assembly = models.ForeignKey(
        Assembly, on_delete=models.SET_NULL, null=True, related_name="serial_numbers")

    is_archived = models.BooleanField(default=False, blank=True)
    serial_number_counter = models.IntegerField(null=True, blank=True)

    description = models.ForeignKey('documents.MarkdownText', on_delete=models.SET_NULL, null=True, blank=True)

    # __________________________________________________________________________________________
    # DEPRECATED fields

    # DEPRECATED
    managed = True
    # DEPRECATED
    # Log of software history
    software_history = ArrayField(models.CharField(
        null=True, blank=True, max_length=500), blank=True, null=True)

    # DEPRECATED
    file_ids = ArrayField(models.IntegerField(
        default=-1, blank=True), null=True, blank=True)

    # DEPRECATED
    # Log of edits to basic information fields, saved in a JSON esc format, parsed on frontend.
    edit_history = ArrayField(models.CharField(
        null=True, blank=True, max_length=500), blank=True, null=True)
    internal_software = models.IntegerField(null=True, blank=True)


class TestData(models.Model):
    """Test data or files for a produced item."""

    test_data = models.JSONField()
    creation_date = models.DateTimeField(auto_now_add=True, null=True)
    produced_item = models.ForeignKey(
        'Production', on_delete=models.SET_NULL, null=True, related_name='tests')
    files = models.ManyToManyField(
        File, related_name='test_data', blank=True, null=True)
    step_title = models.CharField(max_length=500, blank=True)
    step_number = models.IntegerField(default=0)
    is_archived = models.BooleanField(default=False, blank=True)
    status = models.CharField(max_length=50, blank=True, null=True)

    class Meta:
        ordering = ['step_number']
