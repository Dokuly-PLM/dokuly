# Generated by Django 4.2 on 2023-04-24 13:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pcbas', '0035_pcba_released_date'),
    ]

    operations = [
        migrations.AddField(
            model_name='pcba',
            name='pcb_layers',
            field=models.JSONField(blank=True, default={'board outline': '', 'copper bot': '', 'copper top': '', 'drill': '', 'silkscreen bot': '', 'silkscreen top': '', 'solder paste bot': '', 'solder paste top': '', 'soldermask bot': '', 'soldermask top': ''}),
        ),
    ]