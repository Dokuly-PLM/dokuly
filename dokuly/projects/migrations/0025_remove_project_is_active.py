# Generated by Django 3.2.15 on 2022-12-21 15:27

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0024_remove_project_requiremnt_specification'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='project',
            name='is_active',
        ),
    ]
