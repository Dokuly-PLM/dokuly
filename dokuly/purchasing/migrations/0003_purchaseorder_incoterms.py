# Generated by Django 4.2 on 2023-12-06 20:02

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('purchasing', '0002_purchaseorder_files'),
    ]

    operations = [
        migrations.AddField(
            model_name='purchaseorder',
            name='incoterms',
            field=models.CharField(blank=True, null=True),
        ),
    ]