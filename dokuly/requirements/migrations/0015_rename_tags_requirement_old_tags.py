# Generated by Django 4.2.11 on 2024-09-13 13:17

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('requirements', '0014_requirement_verified_by'),
    ]

    operations = [
        migrations.RenameField(
            model_name='requirement',
            old_name='tags',
            new_name='old_tags',
        ),
    ]
