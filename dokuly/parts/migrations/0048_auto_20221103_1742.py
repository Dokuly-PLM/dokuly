# Generated by Django 3.2.15 on 2022-11-03 17:42

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('parts', '0047_part_unit'),
    ]

    operations = [
        migrations.AddField(
            model_name='part',
            name='generic_file_ids',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.IntegerField(blank=True, default=0), blank=True, default=list, size=None),
        ),
        migrations.AddField(
            model_name='part',
            name='part_drawing',
            field=models.IntegerField(blank=True, default=-1),
        ),
        migrations.AddField(
            model_name='part',
            name='part_drawing_raw',
            field=models.IntegerField(blank=True, default=-1),
        ),
    ]