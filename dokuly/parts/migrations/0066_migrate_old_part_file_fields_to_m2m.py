from django.db import migrations, models, transaction

def migrate_part_file_references(apps, schema_editor):
    Part = apps.get_model('parts', 'Part')
    File = apps.get_model('files', 'File')
    
    with transaction.atomic():
        for part in Part.objects.all():
            file_ids_to_add = []

            # Collect 'part_drawing_raw' and 'part_drawing' fields if they have valid IDs
            for field_name in ['part_drawing_raw', 'part_drawing']:
                file_id = getattr(part, field_name)
                if file_id and file_id != -1:  # Assuming -1 is used for 'no file'
                    file_ids_to_add.append(file_id)

            # Collect non-zero 'generic_file_ids'
            file_ids_to_add.extend([file_id for file_id in getattr(part, 'generic_file_ids', []) if file_id])

            # Add the file instances to the 'files' ManyToManyField
            part.files.add(*file_ids_to_add)

class Migration(migrations.Migration):

    dependencies = [
        ('parts', '0065_part_files'),
    ]

    operations = [
        migrations.RunPython(migrate_part_file_references),
    ]
