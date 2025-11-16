# Generated migration to populate formatted_revision from deprecated revision field

from django.db import migrations


def populate_formatted_revision(apps, schema_editor):
    """
    Populate formatted_revision field from the deprecated revision field.
    This is a one-time migration to copy existing revision strings.
    """
    Document = apps.get_model('documents', 'Document')
    
    for document in Document.objects.all():
        if document.revision and not document.formatted_revision:
            # Copy the old revision string to formatted_revision
            document.formatted_revision = document.revision
            document.save(update_fields=['formatted_revision'])


def reverse_migration(apps, schema_editor):
    """Clear formatted_revision field."""
    Document = apps.get_model('documents', 'Document')
    Document.objects.all().update(formatted_revision=None)


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0057_document_formatted_revision'),
    ]

    operations = [
        migrations.RunPython(populate_formatted_revision, reverse_migration),
    ]
