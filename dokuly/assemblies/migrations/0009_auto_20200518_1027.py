# Generated by Django 3.0.4 on 2020-05-18 08:27

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assemblies', '0008_auto_20200516_1800'),
    ]

    operations = [
        migrations.AddField(
            model_name='assembly',
            name='assembly_used_qty',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, default='', max_length=10), default=list, null=True, size=None),
        ),
        migrations.AddField(
            model_name='assembly',
            name='part_used_qty',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, default='', max_length=10), default=list, null=True, size=None),
        ),
    ]