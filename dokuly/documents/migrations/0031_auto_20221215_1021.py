# Generated by Django 3.2.15 on 2022-12-15 10:21

from django.db import migrations, models
import tenants.storage_config


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0030_document_shared_document_link'),
    ]

    operations = [
        migrations.AlterField(
            model_name='document',
            name='pdf',
            field=models.FileField(blank=True, null=True, storage=tenants.storage_config.GoogleCloudMediaStorage, upload_to='documents'),
        ),
        migrations.AlterField(
            model_name='document',
            name='pdf_raw',
            field=models.FileField(blank=True, null=True, storage=tenants.storage_config.GoogleCloudMediaStorage, upload_to='documents'),
        ),
    ]