# Generated by Django 4.2 on 2024-04-23 12:34

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0046_alter_document_errata_alter_document_revision_notes'),
    ]

    operations = [
        migrations.AlterField(
            model_name='document',
            name='title',
            field=models.CharField(max_length=1000),
        ),
    ]