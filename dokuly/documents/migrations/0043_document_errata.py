# Generated by Django 4.2 on 2023-08-06 17:27

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0042_rename_release_date_document_released_date'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='errata',
            field=models.TextField(blank=True, max_length=2000, null=True),
        ),
    ]