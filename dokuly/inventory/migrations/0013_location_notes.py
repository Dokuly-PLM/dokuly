# Generated by Django 4.2 on 2023-05-07 21:49

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('inventory', '0012_location_location_type_v2'),
    ]

    operations = [
        migrations.AddField(
            model_name='location',
            name='notes',
            field=models.CharField(blank=True, null=True),
        ),
    ]
