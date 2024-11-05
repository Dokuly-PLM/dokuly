from django.db import migrations


# The modified migrate_to_assembly_bom function that does nothing.
def migrate_to_assembly_bom(pcba_id):
    # This function now immediately returns without doing anything.
    return


class Migration(migrations.Migration):
    dependencies = [
        ("pcbas", "0041_pcba_quality_assurance"),
    ]

    def migrate_all_pcbas_to_assembly_bom(apps, schema_editor):
        # This function now does nothing but is required for the migration structure.
        pass

    operations = [
        migrations.RunPython(
            migrate_all_pcbas_to_assembly_bom, reverse_code=migrations.RunPython.noop
        ),
    ]
