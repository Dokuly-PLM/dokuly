# Generated by Django 3.2.15 on 2023-01-10 18:34

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('customers', '0011_alter_customer_contact_phone_number'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customer',
            name='name',
            field=models.CharField(blank=True, max_length=50),
        ),
    ]
