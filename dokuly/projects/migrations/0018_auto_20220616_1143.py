# Generated by Django 3.0.4 on 2022-06-16 11:43

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0017_auto_20220602_1447'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='project_assignees',
            field=django.contrib.postgres.fields.ArrayField(base_field=models.IntegerField(blank=True, null=True), blank=True, default=[], size=None),
        ),
    ]
