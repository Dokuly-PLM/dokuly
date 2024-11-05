from django.db import models
from django.contrib.auth.models import User


class Todo(models.Model):
    """Instance that describes a daily work task.
    """

    # Basic data fields.
    title = models.CharField(max_length=200)
    due_date = models.DateField(blank=True, null=True)
    comment = models.TextField(max_length=500, blank=True)
    status = models.CharField(max_length=20, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE)
