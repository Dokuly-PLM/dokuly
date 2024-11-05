from django.db import migrations, models
import json


def migrate_po_items(apps, schema_editor):
    return True


class Migration(migrations.Migration):
    dependencies = [
        ('purchasing', '0013_purchaseorder_po_currency'),
        ('organizations', '0026_organization_requirement_is_enabled'),
    ]

    operations = [
        migrations.RunPython(migrate_po_items),
    ]
