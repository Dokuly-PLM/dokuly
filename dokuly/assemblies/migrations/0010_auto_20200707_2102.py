# Generated by Django 3.0.4 on 2020-07-07 19:02

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assemblies', '0009_auto_20200518_1027'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='assembly',
            name='assembly_used_qty',
        ),
        migrations.RemoveField(
            model_name='assembly',
            name='part_used_qty',
        ),
        migrations.RemoveField(
            model_name='assembly',
            name='slug',
        ),
        migrations.RemoveField(
            model_name='assembly',
            name='assembly_used',
        ),
        migrations.AddField(
            model_name='assembly',
            name='assembly_used',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, default='', max_length=100), default=list, null=True, size=None),
        ),
        migrations.RemoveField(
            model_name='assembly',
            name='part_used',
        ),
        migrations.AddField(
            model_name='assembly',
            name='part_used',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, default='', max_length=100), default=list, null=True, size=None),
        ),
    ]