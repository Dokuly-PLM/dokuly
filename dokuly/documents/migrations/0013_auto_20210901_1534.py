# Generated by Django 3.0.4 on 2021-09-01 13:34

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0012_document_intenal'),
    ]

    operations = [
        migrations.RenameField(
            model_name='document',
            old_name='intenal',
            new_name='internal',
        ),
    ]
