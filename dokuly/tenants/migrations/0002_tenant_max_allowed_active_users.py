# Generated by Django 4.1.5 on 2023-01-23 10:07

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='tenant',
            name='max_allowed_active_users',
            field=models.IntegerField(blank=True, default=1),
        ),
    ]