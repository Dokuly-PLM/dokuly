# Generated migration for mapping existing documents to protection levels

from django.db import migrations
from django.db.models import Q


def migrate_internal_field_to_protection_level(apps, schema_editor):
    """
    Map existing documents from the old 'internal' boolean field 
    to the new protection_level foreign key.
    
    internal=True  -> 'Company Protected'
    internal=False -> 'Externally Shareable'
    internal=None  -> 'Externally Shareable' (default)
    """
    Document = apps.get_model('documents', 'Document')
    Protection_Level = apps.get_model('documents', 'Protection_Level')
    
    # Get the protection levels
    try:
        company_protected = Protection_Level.objects.get(name='Company Protected')
        externally_shareable = Protection_Level.objects.get(name='Externally Shareable')
    except Protection_Level.DoesNotExist:
        # If protection levels don't exist, skip migration
        print("Warning: Protection levels not found. Skipping document migration.")
        return
    
    # Update documents where internal=True -> Company Protected
    documents_company_protected = Document.objects.filter(internal=True)
    count_protected = documents_company_protected.count()
    documents_company_protected.update(protection_level=company_protected)
    #print(f"Migrated {count_protected} documents to 'Company Protected'")
    
    # Update documents where internal=False or internal=None -> Externally Shareable
    documents_externally_shareable = Document.objects.filter(
        Q(internal=False) | Q(internal__isnull=True)
    )
    count_shareable = documents_externally_shareable.count()
    documents_externally_shareable.update(protection_level=externally_shareable)
    #print(f"Migrated {count_shareable} documents to 'Externally Shareable'")


def reverse_migration(apps, schema_editor):
    """
    Reverse the migration by setting protection_level back to None.
    The internal field is deprecated but still exists, so we don't need to restore it.
    """
    Document = apps.get_model('documents', 'Document')
    Document.objects.all().update(protection_level=None)
    #print("Cleared protection_level for all documents")


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0053_populate_protection_levels'),
    ]

    operations = [
        migrations.RunPython(
            migrate_internal_field_to_protection_level,
            reverse_migration
        ),
    ]
