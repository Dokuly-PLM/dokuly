# Manual migration for moving document_file and zip_file to File table ManyToMany field.

from django.db import migrations


def migrate_document_and_zip_files(apps, schema_editor):
    """
    Migrate document_file and zip_file FileFields to File table and add to files ManyToMany.
    
    This creates File objects that reference the same storage paths
    as the existing FileField data, without copying the actual files.
    """
    Document = apps.get_model('documents', 'Document')
    File = apps.get_model('files', 'File')
    
    total_documents = Document.objects.count()
    
    # Use iterator() with chunk_size to stream through records without loading all into memory
    # Use only() to fetch only the fields we need
    documents = Document.objects.only(
        'id', 'title', 'project', 'document_file', 'zip_file'
    ).prefetch_related('files').iterator(chunk_size=100)
    
    migrated_document_file = 0
    migrated_zip_file = 0
    skipped = 0
    errors = 0
    
    for idx, document in enumerate(documents, 1):
        if idx % 100 == 0:
            print(f"Processing document {idx}/{total_documents}...")
        
        try:
            # Migrate document_file to files ManyToMany
            if document.document_file and document.document_file.name:
                try:
                    # Check if this file path already exists in the ManyToMany
                    existing_file = None
                    for f in document.files.all():
                        if f.file and f.file.name == document.document_file.name:
                            existing_file = f
                            break
                    
                    if not existing_file:
                        # Create a File object that points to the same storage path
                        display_name = f"{document.title} Document File" if document.title else "Document File"
                        file_obj = File(
                            display_name=display_name,
                            project=document.project,
                        )
                        # Set the file path directly without copying the file
                        file_obj.file.name = document.document_file.name
                        file_obj.save()
                        
                        # Add to ManyToMany field
                        document.files.add(file_obj)
                        migrated_document_file += 1
                    
                except Exception as e:
                    print(f"  Error migrating document_file for document {document.id}: {e}")
                    errors += 1
            
            # Migrate zip_file to files ManyToMany
            if document.zip_file and document.zip_file.name:
                try:
                    # Check if this file path already exists in the ManyToMany
                    existing_file = None
                    for f in document.files.all():
                        if f.file and f.file.name == document.zip_file.name:
                            existing_file = f
                            break
                    
                    if not existing_file:
                        # Create a File object that points to the same storage path
                        display_name = f"{document.title} ZIP File" if document.title else "ZIP File"
                        file_obj = File(
                            display_name=display_name,
                            project=document.project,
                        )
                        # Set the file path directly without copying the file
                        file_obj.file.name = document.zip_file.name
                        file_obj.save()
                        
                        # Add to ManyToMany field
                        document.files.add(file_obj)
                        migrated_zip_file += 1
                    
                except Exception as e:
                    print(f"  Error migrating zip_file for document {document.id}: {e}")
                    errors += 1
            
            # Skip if both already migrated or no files
            if not (document.document_file and document.document_file.name) and not (document.zip_file and document.zip_file.name):
                skipped += 1
                
        except Exception as e:
            print(f"  Transaction error for document {document.id}: {e}")
            errors += 1
            continue
    
    print("\nMigration complete!")
    print(f"Total documents: {total_documents}")
    print(f"Migrated document_file to files: {migrated_document_file}")
    print(f"Migrated zip_file to files: {migrated_zip_file}")
    print(f"Skipped (no files or already migrated): {skipped}")
    print(f"Errors: {errors}")
    
    if errors > 0:
        print("\nWARNING: Some documents failed to migrate. See errors above.")


def reverse_migration(apps, schema_editor):
    """
    Reverse migration - remove File objects from files ManyToMany and delete them.
    
    Note: This does NOT restore the FileField data, as we didn't copy it.
    The original FileField data remains untouched.
    
    This is a cautious reverse that only removes files with specific display names
    to avoid deleting unrelated files.
    """
    Document = apps.get_model('documents', 'Document')
    File = apps.get_model('files', 'File')
    
    # Collect all File IDs that look like they were created by this migration
    file_ids_to_delete = set()
    
    for document in Document.objects.prefetch_related('files').iterator(chunk_size=100):
        for file_obj in document.files.all():
            # Only delete files that match the naming pattern we used
            if file_obj.display_name and (
                'Document File' in file_obj.display_name or
                'ZIP File' in file_obj.display_name
            ):
                file_ids_to_delete.add(file_obj.id)
                # Remove from ManyToMany
                document.files.remove(file_obj)
    
    # Now delete the orphaned File objects
    if file_ids_to_delete:
        deleted_count = File.objects.filter(id__in=file_ids_to_delete).delete()[0]
        print(f"Deleted {deleted_count} File objects created by this migration")


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0064_migrate_pdfs_to_file_table'),
        ('files', '0013_alter_file_display_name'),
    ]

    operations = [
        migrations.RunPython(migrate_document_and_zip_files, reverse_migration),
    ]
