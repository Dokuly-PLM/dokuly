# Generated by Django 4.2 on 2023-04-30 13:01

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('parts', '0059_part_supplier'),
    ]

    operations = [
        migrations.AddField(
            model_name='part',
            name='alternative_parts_v2',
            field=models.ManyToManyField(blank=True, null=True, to='parts.part'),
        ),
    ]
