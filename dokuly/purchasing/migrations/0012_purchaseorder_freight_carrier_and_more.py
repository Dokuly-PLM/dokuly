# Generated by Django 4.2.11 on 2024-07-20 18:45

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('purchasing', '0011_poitem_price'),
    ]

    operations = [
        migrations.AddField(
            model_name='purchaseorder',
            name='freight_carrier',
            field=models.CharField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='purchaseorder',
            name='shipping_cost',
            field=models.DecimalField(blank=True, decimal_places=4, default=0.0, max_digits=12),
        ),
    ]