# Generated by Django 3.2.15 on 2023-01-17 20:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pcbas', '0030_pcba_is_latest_revision'),
    ]

    operations = [
        migrations.AddField(
            model_name='pcba',
            name='is_archived',
            field=models.BooleanField(blank=True, default=False),
        ),
    ]