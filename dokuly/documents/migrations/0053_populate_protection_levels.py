# Generated migration for populating initial protection levels

from django.db import migrations


def create_initial_protection_levels(apps, schema_editor):
    """Create the two initial protection levels based on the old internal field."""
    Protection_Level = apps.get_model('documents', 'Protection_Level')
    
    # Create the two protection levels matching the old classification system
    externally_shareable = Protection_Level.objects.create(
        name='Externally Shareable',
        description='Documents that can be shared externally with customers or partners',
        level=0
    )
    
    company_protected = Protection_Level.objects.create(
        name='Company Protected',
        description='Internal documents not suitable for external distribution',
        level=1
    )


def reverse_create_protection_levels(apps, schema_editor):
    """Remove the initial protection levels."""
    Protection_Level = apps.get_model('documents', 'Protection_Level')
    Protection_Level.objects.filter(
        name__in=['Externally Shareable', 'Company Protected']
    ).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0052_protection_level_document_protection_level'),
    ]

    operations = [
        migrations.RunPython(
            create_initial_protection_levels,
            reverse_create_protection_levels
        ),
    ]
