# Generated by Django 4.2 on 2023-08-16 08:17

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0001_initial_squashed_0005_rename_created_signupinfo_is_created'),
    ]

    operations = [
        migrations.AddField(
            model_name='signupinfo',
            name='subscription_info',
            field=models.JSONField(blank=True, null=True),
        ),
    ]