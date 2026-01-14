# Generated migration for Odoo username field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('organizations', '0052_add_odoo_integration_settings'),
    ]

    operations = [
        migrations.AddField(
            model_name='integrationsettings',
            name='odoo_username',
            field=models.CharField(blank=True, help_text='Odoo username (required for API key authentication)', max_length=200, null=True),
        ),
    ]
