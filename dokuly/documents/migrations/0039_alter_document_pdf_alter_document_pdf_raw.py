# Generated by Django 4.2 on 2023-04-13 16:32

from django.db import migrations, models
import tenants.azure_storage


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0038_document_referenced_documents'),
    ]

    operations = [
        migrations.AlterField(
            model_name='document',
            name='pdf',
            field=models.FileField(blank=True, null=True, storage=tenants.azure_storage.CustomAzureStorage, upload_to='documents'),
        ),
        migrations.AlterField(
            model_name='document',
            name='pdf_raw',
            field=models.FileField(blank=True, null=True, storage=tenants.azure_storage.CustomAzureStorage, upload_to='documents'),
        ),
    ]