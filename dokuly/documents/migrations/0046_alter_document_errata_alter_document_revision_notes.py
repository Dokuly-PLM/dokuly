# Generated by Django 4.2 on 2024-03-27 12:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0045_rename_version_note_document_revision_notes'),
    ]

    operations = [
        migrations.AlterField(
            model_name='document',
            name='errata',
            field=models.TextField(blank=True, max_length=20000, null=True),
        ),
        migrations.AlterField(
            model_name='document',
            name='revision_notes',
            field=models.TextField(blank=True, max_length=20000, null=True),
        ),
    ]