# Generated by Django 4.2.11 on 2024-09-17 07:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0047_task_tags'),
    ]

    operations = [
        migrations.AddField(
            model_name='issues',
            name='tags',
            field=models.ManyToManyField(blank=True, related_name='issue_tags', to='projects.tag'),
        ),
    ]