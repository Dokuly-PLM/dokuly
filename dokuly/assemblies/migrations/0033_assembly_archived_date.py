# Generated by Django 3.2.15 on 2023-01-17 20:18

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assemblies', '0032_assembly_is_archived'),
    ]

    operations = [
        migrations.AddField(
            model_name='assembly',
            name='archived_date',
            field=models.DateField(blank=True, null=True),
        ),
    ]
