# Generated migration to populate formatted_revision from deprecated revision field

from django.db import migrations


def populate_formatted_revision(apps, schema_editor):
    """
    Populate formatted_revision field from the deprecated revision field.
    This is a one-time migration to copy existing revision strings.
    """
    Part = apps.get_model('parts', 'Part')
    
    for part in Part.objects.all():
        if part.revision and not part.formatted_revision:
            # Copy the old revision string to formatted_revision
            part.formatted_revision = part.revision
            part.save(update_fields=['formatted_revision'])



def reverse_migration(apps, schema_editor):
    """Clear formatted_revision field."""
    Part = apps.get_model('parts', 'Part')
    Part.objects.all().update(formatted_revision=None)


class Migration(migrations.Migration):

    dependencies = [
        ('parts', '0089_part_formatted_revision'),
    ]

    operations = [
        migrations.RunPython(populate_formatted_revision, reverse_migration),
    ]
