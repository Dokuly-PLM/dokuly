# Generated by Django 3.2.15 on 2022-11-07 15:10

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assemblies', '0029_assembly_project'),
    ]

    operations = [
        migrations.AddField(
            model_name='assembly',
            name='generic_files_used',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.IntegerField(blank=True, default=0), blank=True, default=list, size=None),
        ),
    ]
