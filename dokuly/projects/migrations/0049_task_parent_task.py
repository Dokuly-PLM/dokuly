# Generated by Django 4.2.11 on 2024-09-23 07:13

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0048_issues_tags'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='parent_task',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='subtasks', to='projects.task'),
        ),
    ]