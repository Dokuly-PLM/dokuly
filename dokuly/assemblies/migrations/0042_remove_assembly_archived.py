# Generated by Django 4.2 on 2024-02-28 19:13

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('assemblies', '0041_remove_assembly_assembly_refdes_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='assembly',
            name='archived',
        ),
    ]
