# Generated by Django 4.2.11 on 2024-07-19 16:57

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('organizations', '0025_organization_max_allowed_active_viewer_users'),
    ]

    operations = [
        migrations.AddField(
            model_name='organization',
            name='requirement_is_enabled',
            field=models.BooleanField(blank=True, default=True),
        ),
    ]
