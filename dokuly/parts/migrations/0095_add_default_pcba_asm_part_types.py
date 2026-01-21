# Generated manually

from django.db import migrations


def create_default_part_types_and_assign(apps, schema_editor):
    """Create default PCBA and Assembly part types and assign them to existing records."""
    PartType = apps.get_model('parts', 'PartType')
    Pcba = apps.get_model('pcbas', 'Pcba')
    Assembly = apps.get_model('assemblies', 'Assembly')

    # Create default PCBA part type if it doesn't exist
    pcba_part_type, _ = PartType.objects.get_or_create(
        name='Standard PCBA',
        defaults={
            'description': 'Default part type for Printed Circuit Board Assemblies',
            'default_unit': 'pcs',
            'prefix': 'PCBA',
            'applies_to': 'PCBA',
            'icon_url': '/static/icons/pcb.svg',
        }
    )

    # Create default Assembly part type if it doesn't exist
    asm_part_type, _ = PartType.objects.get_or_create(
        name='Standard Assembly',
        defaults={
            'description': 'Default part type for Assemblies',
            'default_unit': 'pcs',
            'prefix': 'ASM',
            'applies_to': 'Assembly',
            'icon_url': '/static/icons/assembly.svg',
        }
    )

    # Assign PCBA part type to all existing PCBAs that don't have one
    Pcba.objects.filter(part_type__isnull=True).update(part_type=pcba_part_type)

    # Assign Assembly part type to all existing Assemblies that don't have one
    Assembly.objects.filter(part_type__isnull=True).update(part_type=asm_part_type)


class Migration(migrations.Migration):

    dependencies = [
        ('parts', '0094_parttype_applies_to'),
        ('pcbas', '0061_pcba_part_type'),  # Ensure part_type field exists on Pcba
        ('assemblies', '0057_assembly_part_type'),  # Ensure part_type field exists on Assembly
    ]

    operations = [
        migrations.RunPython(create_default_part_types_and_assign),
    ]
