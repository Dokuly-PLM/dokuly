from django.db import models
from django_tenants.models import TenantMixin, DomainMixin


class Tenant(TenantMixin):
    name = models.CharField(max_length=100)
    paid_until = models.DateField(blank=True, null=True)
    on_trial = models.BooleanField(blank=True, default=False)
    created_on = models.DateField(auto_now_add=True)
    max_allowed_active_users = models.IntegerField(default=1, blank=True)
    auto_create_schema = True


class Domain(DomainMixin):
    pass


class SignupInfo(models.Model):
    email = models.CharField(max_length=200, blank=True)
    full_name = models.CharField(max_length=200, blank=True)
    username = models.CharField(max_length=200, blank=True)
    domain = models.CharField(max_length=50, blank=True)
    userid_username = models.CharField(max_length=500, blank=True)
    is_created = models.BooleanField(default=False, blank=True)
    token_created = models.DateTimeField(blank=True, null=True)
    subscription_info = models.JSONField(blank=True, null=True)
