# Manual migration for using file table instead of FileFields for document PDFs.

from django.db import migrations


def migrate_document_pdfs(apps, schema_editor):
    """
    Migrate document PDF FileFields to File table ForeignKeys.
    
    This creates File objects that reference the same storage paths
    as the existing FileField data, without copying the actual files.
    """
    Document = apps.get_model('documents', 'Document')
    File = apps.get_model('files', 'File')
    
    total_documents = Document.objects.count()
    
    # Use iterator() with chunk_size to stream through records without loading all into memory
    # Use only() to fetch only the fields we need
    documents = Document.objects.only(
        'id', 'title', 'project', 'pdf_raw', 'pdf', 'pdf_source', 'pdf_print'
    ).iterator(chunk_size=100)
    
    migrated_pdf_raw = 0
    migrated_pdf = 0
    skipped = 0
    errors = 0
    
    for idx, document in enumerate(documents, 1):
        if idx % 100 == 0:
            print(f"Processing document {idx}/{total_documents}...")
        
        try:
            # Migrate pdf_raw to pdf_source
            if document.pdf_raw and document.pdf_raw.name and not document.pdf_source:
                try:
                    # Create a File object that points to the same storage path
                    display_name = f"{document.title} PDF Source" if document.title else "PDF Source"
                    file_obj = File(
                        display_name=display_name,
                        project=document.project,
                    )
                    # Set the file path directly without copying the file
                    file_obj.file.name = document.pdf_raw.name
                    file_obj.save()
                    
                    # Link to document
                    document.pdf_source = file_obj
                    document.save(update_fields=['pdf_source'])
                    migrated_pdf_raw += 1
                    
                except Exception as e:
                    print(f"  Error migrating pdf_raw for document {document.id}: {e}")
                    errors += 1
            
            # Migrate pdf to pdf_print
            if document.pdf and document.pdf.name and not document.pdf_print:
                try:
                    # Create a File object that points to the same storage path
                    display_name = f"{document.title} PDF Print" if document.title else "PDF Print"
                    file_obj = File(
                        display_name=display_name,
                        project=document.project,
                    )
                    # Set the file path directly without copying the file
                    file_obj.file.name = document.pdf.name
                    file_obj.save()
                    
                    # Link to document
                    document.pdf_print = file_obj
                    document.save(update_fields=['pdf_print'])
                    migrated_pdf += 1
                    
                except Exception as e:
                    print(f"  Error migrating pdf for document {document.id}: {e}")
                    errors += 1
            
            # Skip if both already migrated or no files
            if not (document.pdf_raw and document.pdf_raw.name) and not (document.pdf and document.pdf.name):
                skipped += 1
                
        except Exception as e:
            print(f"  Transaction error for document {document.id}: {e}")
            errors += 1
            continue
    
    print("\nMigration complete!")
    print(f"Total documents: {total_documents}")
    print(f"Migrated pdf_raw -> pdf_source: {migrated_pdf_raw}")
    print(f"Migrated pdf -> pdf_print: {migrated_pdf}")
    print(f"Skipped (no files or already migrated): {skipped}")
    print(f"Errors: {errors}")
    
    if errors > 0:
        print("\nWARNING: Some documents failed to migrate. See errors above.")


def reverse_migration(apps, schema_editor):
    """
    Reverse migration - clear pdf_source and pdf_print ForeignKeys and delete the File objects.
    
    Note: This does NOT restore the FileField data, as we didn't copy it.
    The original FileField data remains untouched.
    """
    Document = apps.get_model('documents', 'Document')
    File = apps.get_model('files', 'File')
    
    # Collect all File IDs that are referenced by pdf_source or pdf_print
    file_ids_to_delete = set()
    
    for document in Document.objects.only('pdf_source', 'pdf_print').iterator(chunk_size=100):
        if document.pdf_source_id:
            file_ids_to_delete.add(document.pdf_source_id)
        if document.pdf_print_id:
            file_ids_to_delete.add(document.pdf_print_id)
    
    # Clear the ForeignKey references first
    Document.objects.all().update(pdf_source=None, pdf_print=None)
    
    # Now delete the orphaned File objects
    if file_ids_to_delete:
        deleted_count = File.objects.filter(id__in=file_ids_to_delete).delete()[0]
        print(f"Deleted {deleted_count} File objects created by this migration")


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0063_document_pdf_print_document_pdf_source'),
        ('files', '0013_alter_file_display_name'),
    ]

    operations = [
        migrations.RunPython(migrate_document_pdfs, reverse_migration),
    ]
