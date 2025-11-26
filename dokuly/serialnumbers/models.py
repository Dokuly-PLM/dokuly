from django.db import models
from django.contrib.auth.models import User
from assemblies.models import Assembly
from django.db.models import Case, F, Value, When, DecimalField


# DEPRECATED
class SerialNumber(models.Model):
    """Instance of Assemblies that have been produced.
    Similar to production class.
    """

    # Basic data fields
    assembly = models.ForeignKey(
        Assembly, on_delete=models.SET_NULL, null=True)
    revision = models.CharField(max_length=2, blank=True, null=True)    #TODO this must be updated to support custom revision formats
    
    # Custom serial identifier
    serial_number = models.CharField(max_length=6, blank=True, null=True)
    
    # Metadata fields
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    state = models.CharField(max_length=50, blank=True, null=True)
    comment = models.TextField(max_length=500, blank=True, null=True)
    test_document = models.FileField(
        upload_to='test_documents', blank=True, null=True)
    firmware_version = models.CharField(max_length=10, blank=True, null=True)
    last_updated = models.DateTimeField(auto_now=True)

    # Set production finished, case dependent on state.
    construction_finished = models.BooleanField(Case(
        When(state="Delivered", then=Value(True))), default=False, blank=True
    )
