# Generated by Django 4.2.11 on 2024-09-09 12:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('profiles', '0021_auto_20240423_1907'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='notify_user_on_added_to_project',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='notify_user_on_became_project_owner',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='notify_user_on_issue_close',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='notify_user_on_issue_creation',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='notify_user_on_item_new_revision',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='notify_user_on_item_passed_review',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='profile',
            name='notify_user_on_item_released',
            field=models.BooleanField(default=True),
        ),
    ]