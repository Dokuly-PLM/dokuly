from django.db import migrations
from decimal import Decimal, InvalidOperation


def migrate_price_data(apps, schema_editor):
    # Get the model classes
    Pcba = apps.get_model("pcbas", "Pcba")
    Part = apps.get_model("parts", "Part")
    Assembly = apps.get_model("assemblies", "Assembly")
    Price = apps.get_model("purchasing", "Price")

    # Iterate over each model and create Price instances
    for model_class in [Pcba, Part, Assembly]:
        for obj in model_class.objects.all():
            # Check if there's a price to migrate
            if obj.price is not None:
                try:
                    price_value = Decimal(str(obj.price))
                    Price.objects.create(
                        price=price_value,
                        currency=(obj.currency if obj.currency else None),
                        supplier=getattr(
                            obj, "supplier", None
                        ),  # Only Part has supplier, others will return None
                        part=obj if isinstance(obj, Part) else None,
                        assembly=obj if isinstance(obj, Assembly) else None,
                        pcba=obj if isinstance(obj, Pcba) else None,
                        is_latest_price=True,
                    )
                except InvalidOperation:
                    # Handle the case where the price cannot be converted to Decimal
                    print(
                        f"Skipping for {model_class.__name__} with ID {obj.id} due to invalid price: {obj.price}"
                    )
                except ValueError:
                    # Handle error for invalid price values
                    print(
                        f"Skipping invalid price for {model_class.__name__} with ID {obj.id}"
                    )
                except Exception as e:
                    print(
                        f"Skipping for {model_class.__name__} with ID {obj.id} due to error: {e}"
                    )


class Migration(migrations.Migration):

    dependencies = [
        ("purchasing", "0004_price"),
    ]

    operations = [
        migrations.RunPython(migrate_price_data),
    ]
