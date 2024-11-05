from django.db import models
from django.contrib.auth.models import User
from django.contrib.postgres.fields import ArrayField

from django.utils import timezone


class Profile(models.Model):
    """An extension of the User instance.
    Provides additional datafields that is connected to a Django User instance. 
    No information is stored here that is critical to the Django User, however a Profile's access role is stored here.
    """

    # A reference to the connected User instance provided by Django.
    # Each profile instance is an extended instance of the user, providing additional information for a given user.
    # The Django user model only stores some set values like password, username etc. and is not very customizable.
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True)

    # Many basic information fields
    first_name = models.CharField(max_length=50, null=True, blank=True)
    last_name = models.CharField(max_length=50, null=True, blank=True)
    birth_date = models.DateField(null=True, blank=True)

    personal_phone_number = models.CharField(
        max_length=50, blank=True, null=True)

    personal_email = models.EmailField(null=True, blank=True)
    work_email = models.EmailField(null=True, blank=True)

    bio = models.TextField(max_length=500, blank=True)
    profile_image = models.ImageField(
        upload_to='profile_images', blank=True, null=True)

    address = models.CharField(blank=True, max_length=100)
    zip_code = models.CharField(max_length=6, null=True, blank=True)

    position = models.CharField(max_length=50, null=True, blank=True)
    position_percentage = models.CharField(
        max_length=3, null=True, blank=True)
    contract = models.FileField(null=True, blank=True)
    location = models.CharField(null=True, max_length=30, blank=True)

    is_active = models.BooleanField(null=True, default=True)

    # The role field defines the access level of a profile. The possible fields are:
    # 'Viewer', 'User', 'Admin', 'Owner'
    # 'Viewer' is essentially a read-only account.
    role = models.CharField(max_length=50, blank=True, default="User")

    # Current apps "timesheet","customers","projects","requirements","documents","parts","assemblies","pcbas","production","procurement"
    allowed_apps = ArrayField(models.CharField(max_length=50), default=['timesheet', 'customers', 'projects', 'requirements',
                              'documents', 'parts', 'assemblies', 'pcbas', 'production', 'procurement'], blank=True)

    # The current organization the user is in.
    # For most cases, this would be the same as the customer organization / company.
    organization_id = models.IntegerField(default=-1, blank=True)

    # For 2FA
    mfa_hash = models.CharField(max_length=513, blank=True, null=True)
    mfa_validated = models.BooleanField(default=False, blank=True)

    # Notification settings
    notify_user_on_issue_creation = models.BooleanField(default=True)
    notify_user_on_issue_close = models.BooleanField(default=True)
    notify_user_on_item_new_revision = models.BooleanField(default=True)
    notify_user_on_item_passed_review = models.BooleanField(default=True)
    notify_user_on_item_released = models.BooleanField(default=True)
    notify_user_on_added_to_project = models.BooleanField(default=True)
    notify_user_on_became_project_owner = models.BooleanField(default=True)


class Notification(models.Model):
    # The user that receives the Notification.
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    # This is rendered as markdown.
    message = models.CharField(max_length=800, blank=True, null=True)

    # The uri to navigate the user to when pressing the notification.
    uri = models.CharField(max_length=2097152, blank=True, null=True)

    # This field is used to select an icon to show with the notification.
    # Pcba, Assemblies, Part, Document, Project
    app = models.CharField(max_length=25, blank=True, null=True)

    # Metadata for filtering.
    created_at = models.DateTimeField(default=timezone.now)
    is_viewed_by_user = models.BooleanField(
        default=False, null=True, blank=True)

    is_project_notification = models.BooleanField(default=False, null=True, blank=True)
