# Generated migration for Odoo integration settings

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('organizations', '0051_rules_require_revision_notes_on_affected_items'),
    ]

    operations = [
        migrations.AddField(
            model_name='integrationsettings',
            name='odoo_enabled',
            field=models.BooleanField(default=False, help_text='Enable Odoo integration'),
        ),
        migrations.AddField(
            model_name='integrationsettings',
            name='odoo_url',
            field=models.CharField(blank=True, help_text='Odoo instance URL (e.g., https://mycompany.odoo.com)', max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='integrationsettings',
            name='odoo_database',
            field=models.CharField(blank=True, help_text='Odoo database name', max_length=200, null=True),
        ),
        migrations.AddField(
            model_name='integrationsettings',
            name='odoo_api_key',
            field=models.CharField(blank=True, help_text='Odoo API key for authentication', max_length=500, null=True),
        ),
        migrations.AddField(
            model_name='integrationsettings',
            name='odoo_auto_push_on_release',
            field=models.BooleanField(default=False, help_text='Automatically push to Odoo when items are released'),
        ),
        migrations.AddField(
            model_name='integrationsettings',
            name='odoo_default_product_category_id',
            field=models.IntegerField(blank=True, help_text='Default Odoo product category ID', null=True),
        ),
        migrations.AddField(
            model_name='integrationsettings',
            name='odoo_default_uom_id',
            field=models.IntegerField(blank=True, help_text='Default Odoo unit of measure ID', null=True),
        ),
        migrations.AddField(
            model_name='integrationsettings',
            name='odoo_default_product_type',
            field=models.CharField(blank=True, choices=[('product', 'Storable Product'), ('consu', 'Consumable'), ('service', 'Service')], default='product', help_text='Default product type in Odoo', max_length=50),
        ),
    ]
