from django.db import migrations

def create_bom_item(apps, mpn_fn_str, item_type, bom):
    Bom_item = apps.get_model('assembly_bom', 'Bom_item')
    Part = apps.get_model('parts', 'Part') 
    Pcba = apps.get_model('pcbas', 'Pcba')
    Assembly = apps.get_model('assemblies', 'Assembly')


    try:
        # Parse the string
        parts = mpn_fn_str.split(',')

        if len(parts) < 4 or len(parts) > 5:
            return # Invalid format

        item_id, designator = parts[0], parts[1]
        mpn = None
        dnm = None
        quantity = 1


        try:
            item_id = int(item_id)
        except:
            item_id = None

        # Handling different lengths of the parts list
        if len(parts) == 4: # Format: id, f/n, dnm, quantity
            dnm, quantity = parts[2], parts[3]
        elif len(parts) == 5: # Format: id, f/n, mpn, dnm, quantity
            mpn, dnm, quantity = parts[2], parts[3], parts[4]

        try:
            quantity = float(quantity)
        except:
            quantity = 1.0

        # Create Bom_item instance
        bom_item = Bom_item(
            bom=bom,
            designator=designator,
            quantity=quantity,
        )

        # Associate with the correct model based on item_type
        if item_type == 'part':
            bom_item.part = Part.objects.get(id=item_id)
        elif item_type == 'pcba':
            bom_item.pcba = Pcba.objects.get(id=item_id)
        elif item_type == 'assembly':
            bom_item.assembly = Assembly.objects.get(id=item_id)

        bom_item.save()
    except ValueError as e:
        # Handle the error or log it
        print(f"Error processing BOM item: {mpn_fn_str} - {e}")



def migrate_bom_content(apps, schema_editor):
    Assembly_bom = apps.get_model('assembly_bom', 'Assembly_bom')

    for bom in Assembly_bom.objects.all():
        if bom.mpn_fn_part:
            for mpn_fn in bom.mpn_fn_part:
                create_bom_item(apps, mpn_fn, 'part', bom)

        if bom.mpn_fn_pcba:
            for mpn_fn in bom.mpn_fn_pcba:
                create_bom_item(apps, mpn_fn, 'pcba', bom)

        if bom.mpn_fn_asm:
            for mpn_fn in bom.mpn_fn_asm:
                create_bom_item(apps, mpn_fn, 'assembly', bom)

class Migration(migrations.Migration):
    dependencies = [
        ('assembly_bom', '0015_remove_assembly_bom_bom_content'),
    ]

    operations = [
        migrations.RunPython(migrate_bom_content),
    ]