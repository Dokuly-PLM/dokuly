# Generated by Django 3.0.4 on 2020-05-16 15:36

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assemblies', '0006_auto_20200516_1733'),
    ]

    operations = [
        migrations.AlterField(
            model_name='assembly',
            name='assembly_used',
            field=models.CharField(blank=True, max_length=7, null=True),
        ),
        migrations.AlterField(
            model_name='assembly',
            name='part_used',
            field=models.CharField(blank=True, max_length=7, null=True),
        ),
    ]
