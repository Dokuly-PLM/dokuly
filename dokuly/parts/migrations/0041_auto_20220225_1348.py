# Generated by Django 3.0.4 on 2022-02-25 12:48

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('parts', '0040_auto_20220225_1347'),
    ]

    operations = [
        migrations.AlterField(
            model_name='part',
            name='alternative_parts',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.IntegerField(blank=True), blank=True, default=[], null=True, size=None),
        ),
    ]
