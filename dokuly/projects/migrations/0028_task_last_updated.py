# Generated by Django 4.1.5 on 2023-01-25 21:34

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0027_task_is_active'),
    ]

    operations = [
        migrations.AddField(
            model_name='task',
            name='last_updated',
            field=models.DateTimeField(auto_now=True),
        ),
    ]
