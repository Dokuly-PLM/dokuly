# Generated by Django 4.2 on 2024-02-29 18:42

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('pcbas', '0044_remove_pcba_archived'),
    ]

    operations = [
        migrations.RenameField(
            model_name='pcba',
            old_name='comments_for_next_revision',
            new_name='errata',
        ),
    ]
