# Generated by Django 3.0.4 on 2021-11-07 20:28

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('parts', '0034_auto_20211103_1605'),
    ]

    operations = [
        migrations.AlterField(
            model_name='part',
            name='alternative_parts',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, max_length=20, null=True), blank=True, default=list, null=True, size=None),
        ),
    ]
