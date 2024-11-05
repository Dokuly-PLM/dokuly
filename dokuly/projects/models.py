from django.db import models
from django.contrib.auth.models import User
from profiles.models import Profile
from django.contrib.postgres.fields import ArrayField
from projects.issuesModel import Issues


class Project(models.Model):
    """A Project instance.
    Contains formation about a given project.
    References a customer, a contact user and its contributors.
    """

    # Basic data fields
    title = models.CharField(max_length=500, blank=True)
    description = models.TextField(default="", blank=True)
    project_number = models.IntegerField(blank=True)

    # References
    customer = models.ForeignKey(
        "customers.Customer", on_delete=models.SET_NULL, null=True, blank=True
    )
    project_contact = models.ForeignKey(
        Profile, on_delete=models.SET_NULL, null=True, blank=True
    )

    project_owner = models.ForeignKey(
        Profile, on_delete=models.DO_NOTHING, null=True, blank=True, related_name="owner"
    )

    # Metadata and extra project information
    created_at = models.DateTimeField(auto_now_add=True)

    is_active = models.BooleanField(null=True, default=True)
    project_assignees = ArrayField(
        models.IntegerField(blank=True, null=True), blank=True, default=[]
    )  # DEPRECATED
    project_members = models.ManyToManyField(User, related_name="projects")

    # Date formation, can be used to create burndowns / gantt etc...
    start_date = models.CharField(max_length=20, blank=True, null=True)
    deadline = models.CharField(max_length=20, blank=True, null=True)
    estimated_work_hours = models.IntegerField(blank=True, null=True)

    # Archive
    is_archived = models.BooleanField(null=True, default=False)
    archived_date = models.DateField(null=True, blank=True)

    notify_project_owner_on_issue_creation = models.BooleanField(default=True)
    notify_project_owner_on_issue_close = models.BooleanField(default=True)
    notify_project_owner_on_item_new_revision = models.BooleanField(default=True)
    notify_project_owner_on_item_state_change_to_review = models.BooleanField(default=True)
    notify_project_owner_on_item_passed_review = models.BooleanField(default=True)
    notify_project_owner_on_item_released = models.BooleanField(default=True)


class Gantt(models.Model):
    project_id = models.ForeignKey(
        Project, on_delete=models.DO_NOTHING, null=True, blank=True
    )
    description = models.CharField(null=True, blank=True, max_length=500)
    notes = models.CharField(null=True, blank=True, max_length=1000)
    view_mode = models.CharField(null=True, blank=True, max_length=20)
    # TODO: Find the best solution to dependencies in gantt


class Tag(models.Model):
    """A tag instance.
    Contains formation about a given tag.
    """
    name = models.CharField(max_length=500, blank=True)
    description = models.TextField(default="", blank=True)
    color = models.CharField(max_length=100, blank=True)  # Currently only supporting hex colors
    project = models.ForeignKey(Project, on_delete=models.CASCADE, null=True, blank=True)


class Task(models.Model):
    """Project task.
    Task that can be worked on in a project.
    Will be used for hour reporting.
    Can be used for Gantt, project planning.
    """

    title = models.CharField(max_length=100, blank=True)
    description = models.CharField(max_length=1000, blank=True)
    # The project for which this task is coupled.
    project_id = models.IntegerField(blank=True, default=-1)
    is_billable = models.BooleanField(blank=True, null=True, default=False)
    is_active = models.BooleanField(blank=True, null=True, default=True)
    is_archived = models.BooleanField(blank=True, null=True, default=False)
    last_updated = models.DateTimeField(auto_now=True)
    workload_hours = models.FloatField(blank=True, null=True)
    is_complete = models.BooleanField(blank=True, default=False)

    # Gantt Related fields
    start = models.DateField(blank=True, null=True)  # Start time
    end = models.DateField(blank=True, null=True)  # End time
    gantt_id = models.ForeignKey(
        Gantt, on_delete=models.DO_NOTHING, null=True, blank=True
    )
    progress = models.IntegerField(blank=True, default=0)
    dependencies = models.ManyToManyField("self", blank=True, symmetrical=False, related_name="dependents")

    tags = models.ManyToManyField(Tag, blank=True, symmetrical=False, related_name="task_tags")

    # Subtasks
    parent_task = models.ForeignKey(
        "self", on_delete=models.SET_NULL, null=True, blank=True, related_name="subtasks"
    )

    assignees = models.ManyToManyField(Profile, symmetrical=False, blank=True, related_name="assigned_tasks")
