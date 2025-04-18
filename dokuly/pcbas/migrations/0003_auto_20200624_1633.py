# Generated by Django 3.0.4 on 2020-06-24 14:33

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pcbas', '0002_auto_20200624_0906'),
    ]

    operations = [
        migrations.AddField(
            model_name='pcba',
            name='dnm',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, default='', max_length=10), default=list, null=True, size=None),
        ),
        migrations.AlterField(
            model_name='pcba',
            name='mpn',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, default='', max_length=100), default=list, null=True, size=None),
        ),
    ]
