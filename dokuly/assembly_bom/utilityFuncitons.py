from django.db import transaction
from .models import Assembly_bom, Bom_item

@transaction.atomic
def cloneBom(assembly_bom_id: int, target_id: int, app="Assembly") -> Assembly_bom:
    """Create a clone of a bom, and clona all bom items. """
    try:
        # Retrieve the original Assembly_bom
        original_bom = Assembly_bom.objects.get(id=assembly_bom_id)

        if app == "Assembly":
            # Create a copy of the Assembly_bom
            new_bom = Assembly_bom.objects.create(
                assembly_id=target_id,
                bom_name=original_bom.bom_name,
                comments=original_bom.comments
            )
        else: # app == "Pcba"
            # Create a copy of the Assembly_bom
            new_bom = Assembly_bom.objects.create(
                pcba_id=target_id,  # Set the pcba foreign key by ID
                bom_name=original_bom.bom_name,
                comments=original_bom.comments
            )

        # Copy related Bom_item instances
        for bom_item in Bom_item.objects.filter(bom=original_bom):
            Bom_item.objects.create(
                bom=new_bom,
                designator=bom_item.designator,
                quantity=bom_item.quantity,
                is_mounted=bom_item.is_mounted,
                comment=bom_item.comment,
                temporary_mpn=bom_item.temporary_mpn,
                temporary_manufacturer=bom_item.temporary_manufacturer,
                part=bom_item.part,
                pcba=bom_item.pcba,
                assembly=bom_item.assembly
            )

        return new_bom
    except Exception as e:
        print(f"cloneBom failed with exception: {e}")