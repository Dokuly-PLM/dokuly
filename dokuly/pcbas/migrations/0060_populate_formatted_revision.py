# Generated migration to populate formatted_revision from deprecated revision field

from django.db import migrations


def populate_formatted_revision(apps, schema_editor):
    """
    Populate formatted_revision field from the deprecated revision field.
    This is a one-time migration to copy existing revision strings.
    """
    Pcba = apps.get_model('pcbas', 'Pcba')
    
    for pcba in Pcba.objects.all():
        if pcba.revision and not pcba.formatted_revision:
            # Copy the old revision string to formatted_revision
            pcba.formatted_revision = pcba.revision
            pcba.save(update_fields=['formatted_revision'])


def reverse_migration(apps, schema_editor):
    """Clear formatted_revision field."""
    Pcba = apps.get_model('pcbas', 'Pcba')
    Pcba.objects.all().update(formatted_revision=None)


class Migration(migrations.Migration):

    dependencies = [
        ('pcbas', '0059_pcba_formatted_revision'),
    ]

    operations = [
        migrations.RunPython(populate_formatted_revision, reverse_migration),
    ]
