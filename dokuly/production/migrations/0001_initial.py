# Generated by Django 3.0.4 on 2022-06-15 11:12

import django.contrib.postgres.fields
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='Production',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('serial_number', models.CharField(max_length=50, null=True)),
                ('assembly_date', models.DateField(null=True)),
                ('state', models.CharField(max_length=20, null=True)),
                ('revision', models.CharField(max_length=2, null=True)),
                ('linked_assemblies', django.contrib.postgres.fields.ArrayField(base_field=models.IntegerField(null=True), blank=True, null=True, size=None)),
                ('linked_pcbas', django.contrib.postgres.fields.ArrayField(base_field=models.IntegerField(null=True), blank=True, null=True, size=None)),
                ('sub_production', models.BooleanField(default=False, null=True)),
                ('pcba_part_number', models.CharField(max_length=50, null=True)),
                ('asm_serial_id', models.IntegerField(null=True)),
                ('comment', models.CharField(max_length=200, null=True)),
                ('next_prod', django.contrib.postgres.fields.ArrayField(base_field=models.IntegerField(null=True), blank=True, null=True, size=None)),
                ('prev_prod', django.contrib.postgres.fields.ArrayField(base_field=models.IntegerField(null=True), blank=True, null=True, size=None)),
                ('customer_id', models.IntegerField(blank=True, null=True)),
                ('edit_history', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, max_length=500, null=True), blank=True, null=True, size=None)),
                ('internal_software', models.IntegerField(blank=True, null=True)),
                ('software_history', django.contrib.postgres.fields.ArrayField(base_field=models.CharField(blank=True, max_length=500, null=True), blank=True, null=True, size=None)),
                ('last_updated', models.DateField(blank=True, null=True)),
            ],
        ),
    ]