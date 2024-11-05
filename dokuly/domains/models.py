from django.db import models

# Create your models here.

class DomainNames(models.Model):
  schema_name = models.CharField(max_length=50, default="", blank=True)