from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField
from django.utils import timezone
from tenants.azure_storage import CustomAzureStorage
from projects.models import Project


class File(models.Model):
    """Generic file table.
    Should make it easier to store files connected to any app.
    """

    # File object for the file instance.
    # Uncertain why the files are stored under 'documents/'?
    file = models.FileField(
        storage=CustomAzureStorage, upload_to="documents/", blank=True, null=True
    )
    last_updated = models.DateTimeField(auto_now=True)

    # File instance metadata.
    display_name = models.CharField(max_length=250, blank=True, null=True)
    # This field is essentially the same as not(archive)?
    # Uncertain why the field is not a boolean?
    active = models.IntegerField(default=1, blank=True)

    download_count = models.IntegerField(default=0, blank=True)

    project = models.ForeignKey(
        Project, on_delete=models.SET_NULL, blank=True, null=True
    )

    # TODO consider moving to a more correct is_archived field.
    archived = models.IntegerField(default=0, blank=True)
    archived_date = models.DateField(null=True, blank=True)


class FileLock(models.Model):
    """Tracks which user is currently editing a file via OnlyOffice."""
    file = models.OneToOneField(File, on_delete=models.CASCADE, related_name="lock")
    locked_by = models.ForeignKey(User, on_delete=models.CASCADE)
    locked_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    session_key = models.CharField(max_length=255, blank=True, default="")

    def is_expired(self):
        return timezone.now() >= self.expires_at

    def __str__(self):
        return f"Lock on File {self.file_id} by {self.locked_by} (expires {self.expires_at})"


class Image(models.Model):
    """Generic image table.
    Should make it easier to store images connected to any app.
    """
    # id field is automatically created by Django as the primary key
    file = models.FileField(
        storage=CustomAzureStorage, blank=True, null=True, upload_to="images/"
    )
    image_compressed = models.FileField(
        storage=CustomAzureStorage, blank=True, null=True, upload_to="images/compressed/"
    )
    last_updated = models.DateTimeField(auto_now=True)
    image_name = models.CharField(max_length=50, blank=True, null=True)
    download_count = models.IntegerField(default=0, blank=True)
    archived = models.IntegerField(default=0, blank=True)
    archived_date = models.DateField(null=True, blank=True)
    project = models.ForeignKey(
        Project, on_delete=models.SET_NULL, blank=True, null=True
    )
