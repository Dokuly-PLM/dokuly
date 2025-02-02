# Generated by Django 4.1.5 on 2023-02-10 11:18

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    replaces = [('inventory', '0001_initial'), ('inventory', '0002_auto_20200525_2100'), ('inventory', '0003_auto_20200526_2220'), ('inventory', '0004_auto_20200527_1534'), ('inventory', '0005_locationtypes'), ('inventory', '0006_locationtypes_archived'), ('inventory', '0007_location_archived'), ('inventory', '0008_location_location_type_id'), ('inventory', '0009_auto_20220905_1426'), ('inventory', '0010_locationtypes_has_row_or_col'), ('inventory', '0011_location_container_placement_number')]

    initial = True

    dependencies = [
        ('parts', '0007_part_price_qty'),
        ('customers', '0002_auto_20200412_0030'),
        ('assemblies', '0009_auto_20200518_1027'),
    ]

    operations = [
        migrations.CreateModel(
            name='Location',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(blank=True, max_length=150, null=True)),
                ('room', models.CharField(blank=True, max_length=150, null=True)),
                ('location_type', models.CharField(blank=True, max_length=150, null=True)),
                ('container_type', models.CharField(blank=True, max_length=150, null=True)),
                ('container_number', models.CharField(blank=True, max_length=150, null=True)),
                ('container_column', models.CharField(blank=True, max_length=150, null=True)),
                ('capacity_full', models.CharField(blank=True, max_length=5, null=True)),
                ('container_row', models.CharField(blank=True, max_length=150, null=True)),
                ('location_column', models.CharField(blank=True, max_length=150, null=True)),
                ('location_row', models.CharField(blank=True, max_length=150, null=True)),
                ('archived', models.IntegerField(blank=True, default=0)),
                ('location_type_id', models.IntegerField(blank=True, default=-1)),
                ('archived_date', models.DateField(blank=True, null=True)),
                ('container_placement_number', models.CharField(blank=True, default='', max_length=50)),
            ],
        ),
        migrations.CreateModel(
            name='Inventory',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.IntegerField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('assembly', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='assemblies.assembly')),
                ('location', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='inventory.location')),
                ('owner', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='customers.customer')),
                ('part', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='parts.part')),
            ],
        ),
        migrations.CreateModel(
            name='LocationTypes',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('display_name', models.CharField(blank=True, max_length=50, null=True)),
                ('description', models.CharField(blank=True, max_length=1000, null=True)),
                ('archived', models.IntegerField(blank=True, default=0)),
                ('archived_date', models.DateField(blank=True, null=True)),
                ('has_row_or_col', models.IntegerField(blank=True, default=0)),
            ],
        ),
    ]
