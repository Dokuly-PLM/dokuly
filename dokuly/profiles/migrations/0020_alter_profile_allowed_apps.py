# Generated by Django 4.2 on 2024-04-23 19:02

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('profiles', '0019_profile_allowed_apps'),
    ]

    operations = [
        migrations.AlterField(
            model_name='profile',
            name='allowed_apps',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(max_length=50), blank=True, default=['timesheet', 'customers', 'projects', 'requirements', 'documents', 'parts', 'assemblies', 'pcbas', 'production', 'procurement'], size=None),
        ),
    ]