from django.db import migrations, transaction
from django.db.models import Sum, F


def set_current_total_stock(apps, schema_editor):
    try:
        Inventory = apps.get_model('inventory', 'Inventory')
        Part = apps.get_model('parts', 'Part')

        # Step 1: Calculate total quantities for each part at each location
        part_totals = Inventory.objects.values('part', 'location').annotate(
            total_quantity=Sum('quantity')
        ).filter(part__isnull=False, location__isnull=False)

        new_inventories = []
        batch_size = 500

        # Step 2: Process each aggregated result to create new inventory entries
        with transaction.atomic():
            for total in part_totals:
                try:
                    new_inventories.append(Inventory(
                        part_id=total['part'],
                        location_id=total['location'],
                        quantity=0,
                        current_total_stock=total['total_quantity'],
                        is_latest=True
                    ))

                    # Bulk create in batches
                    if len(new_inventories) >= batch_size:
                        Inventory.objects.bulk_create(new_inventories)
                        new_inventories = []
                except Exception as e:
                    pass

            # Create any remaining new inventories
            if new_inventories:
                Inventory.objects.bulk_create(new_inventories)
    except Exception as e:
        pass  # Make sure this doesnt crash following migrations


class Migration(migrations.Migration):
    dependencies = [
        ('inventory', '0016_inventory_current_total_stock_inventory_is_latest'),
    ]

    operations = [
        migrations.RunPython(set_current_total_stock),
    ]
