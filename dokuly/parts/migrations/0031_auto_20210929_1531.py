# Generated by Django 3.0.4 on 2021-09-29 13:31

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('parts', '0030_part_part_documents'),
    ]

    operations = [
        migrations.RenameField(
            model_name='part',
            old_name='part_documents',
            new_name='part_files',
        ),
    ]