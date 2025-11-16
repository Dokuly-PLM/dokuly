# Generated migration to populate formatted_revision from deprecated revision field

from django.db import migrations


def populate_formatted_revision(apps, schema_editor):
    """
    Populate formatted_revision field from the deprecated revision field.
    This is a one-time migration to copy existing revision strings.
    """
    Assembly = apps.get_model('assemblies', 'Assembly')
    
    for assembly in Assembly.objects.all():
        if assembly.revision and not assembly.formatted_revision:
            # Copy the old revision string to formatted_revision
            assembly.formatted_revision = assembly.revision
            assembly.save(update_fields=['formatted_revision'])


def reverse_migration(apps, schema_editor):
    """Clear formatted_revision field."""
    Assembly = apps.get_model('assemblies', 'Assembly')
    Assembly.objects.all().update(formatted_revision=None)


class Migration(migrations.Migration):

    dependencies = [
        ('assemblies', '0055_assembly_formatted_revision'),
    ]

    operations = [
        migrations.RunPython(populate_formatted_revision, reverse_migration),
    ]
