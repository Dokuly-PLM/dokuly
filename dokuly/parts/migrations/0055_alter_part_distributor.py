# Generated by Django 4.1.5 on 2023-01-25 08:27

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('parts', '0054_alter_part_archived_alter_part_datasheet_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='part',
            name='distributor',
            field=models.CharField(blank=True, max_length=100, null=True),
        ),
    ]
