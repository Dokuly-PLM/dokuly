from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("organizations", "0058_integrationsettings_currency_api_key"),
    ]

    operations = [
        migrations.AddField(
            model_name="rules",
            name="require_image_on_assembly",
            field=models.BooleanField(
                blank=True,
                default=False,
                help_text="Require an image to be uploaded before releasing an Assembly",
            ),
        ),
        migrations.AddField(
            model_name="rules",
            name="require_image_on_part",
            field=models.BooleanField(
                blank=True,
                default=False,
                help_text="Require an image to be uploaded before releasing a Part",
            ),
        ),
        migrations.AddField(
            model_name="rules",
            name="require_image_on_pcba",
            field=models.BooleanField(
                blank=True,
                default=False,
                help_text="Require an image to be uploaded before releasing a PCBA",
            ),
        ),
    ]
