from django.db import migrations, transaction

def migrate_file_references(apps, schema_editor):
    Assembly = apps.get_model('assemblies', 'Assembly')
    File = apps.get_model('files', 'File')
    
    # Use a transaction to ensure database integrity
    with transaction.atomic():
        for assembly in Assembly.objects.all():
            # Proceed only if 'files' field is empty
            if not assembly.files.exists():
                file_ids_to_add = []

                # Collect 'assembly_drawing_raw' and 'assembly_drawing' fields if they have valid IDs
                for field_name in ['assembly_drawing_raw', 'assembly_drawing']:
                    file_id = getattr(assembly, field_name)
                    if file_id and file_id != -1:  # Assuming -1 is used for 'no file'
                        file_ids_to_add.append(file_id)

                # Collect non-zero 'generic_file_ids'
                file_ids_to_add.extend([file_id for file_id in getattr(assembly, 'generic_file_ids', []) if file_id])

                # Add the file IDs to the 'files' ManyToManyField
                assembly.files.add(*file_ids_to_add)

class Migration(migrations.Migration):

    dependencies = [
        ('assemblies', '0036_assembly_files'),
    ]

    operations = [
        migrations.RunPython(migrate_file_references),
    ]
