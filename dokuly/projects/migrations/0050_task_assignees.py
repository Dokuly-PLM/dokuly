# Generated by Django 4.2.11 on 2024-10-18 08:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('profiles', '0023_notification_is_project_notification'),
        ('projects', '0049_task_parent_task'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='assignees',
            field=models.ManyToManyField(blank=True, related_name='assigned_tasks', to='profiles.profile'),
        ),
    ]
