# Generated by Django 4.2 on 2023-11-15 19:33

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('production', '0003_lot_remove_production_asm_serial_id_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name='production',
            name='serial_number_counter',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
