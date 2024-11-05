from django.db import models
from django.contrib.auth.models import User


# Create your models here.

# DEPRECATED
class Image(models.Model):
    """Generic image table.
    Should be used when multiple images are needed for one entity.
    THIS TABLE IS DEPRECATED; Dokuly uses the subtable Image in Files app
    """

    # Basic metadata
    title = models.CharField(max_length=100)
    image = models.ImageField(upload_to='static_images')
    created_at = models.DateTimeField(auto_now_add=True)
    created_by = models.ForeignKey(
        User, on_delete=models.SET_NULL, null=True)
