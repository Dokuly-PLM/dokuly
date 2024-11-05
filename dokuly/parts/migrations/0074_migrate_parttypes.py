from django.db import migrations


def upgrade_part_type_str(apps, schema_editor):
    Part = apps.get_model("parts", "Part")
    PartType = apps.get_model("parts", "PartType")

    for part in Part.objects.all():
        try:
            if part.part_type_str:
                part_type, created = PartType.objects.get_or_create(
                    name=part.part_type_str,
                    defaults={"created_by": None, "default_unit": "pcs"},
                )

                part.part_type = part_type
                part.save()
        except Exception as e:
            print(f"Error migrating part {part.id}: {e}")


class Migration(migrations.Migration):

    dependencies = [
        (
            "parts",
            "0073_parttype_icon_url",
        ),
    ]

    operations = [
        migrations.RunPython(upgrade_part_type_str),
    ]
