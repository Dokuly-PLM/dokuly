# Generated by Django 3.0.4 on 2021-08-25 15:05

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('customers', '0004_auto_20201206_2216'),
    ]

    operations = [
        migrations.AlterField(
            model_name='customer',
            name='contact_phone_number',
            field=models.IntegerField(max_length=20, null=True),
        ),
    ]