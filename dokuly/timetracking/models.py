from django.db import models
from django.contrib.auth.models import User
from projects.models import Project
from projects.models import Task


class EmployeeTime(models.Model):
    """Used for User work time management.
    References a user, with a task, date and time.
    """

    # Reference to user.
    user = models.ForeignKey(
        User, on_delete=models.CASCADE, null=True)

    # Metadata for instance. 
    date = models.DateField()
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True)

    # Deprecated field. Moving over to using task_id
    task = models.CharField(max_length=100)
    task_id = models.ForeignKey(Task, on_delete=models.SET_NULL, null=True)
    
    start_time = models.TimeField(null=True, blank=True)
    stop_time = models.TimeField(null=True, blank=True)
    hour = models.CharField(max_length=5, null=True, blank=True)
    comment = models.TextField(max_length=200, blank=True)
