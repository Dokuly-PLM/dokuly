# Generated by Django 3.0.4 on 2022-03-24 13:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assemblies', '0021_auto_20220324_0908'),
    ]

    operations = [
        migrations.AddField(
            model_name='assembly',
            name='bom_id',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
