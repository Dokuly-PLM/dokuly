# Generated by Django 3.0.4 on 2022-03-31 11:04

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pcbas', '0021_merge_20220217_1223'),
    ]

    operations = [
        migrations.CreateModel(
            name='Pcba_bom',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('pcba_id', models.IntegerField(blank=True, null=True)),
                ('part_ids', django.contrib.postgres.fields.ArrayField(base_field=models.IntegerField(blank=True, null=True), blank=True, null=True, size=None)),
            ],
        ),
    ]