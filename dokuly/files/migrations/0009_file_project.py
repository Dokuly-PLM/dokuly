# Generated by Django 4.2 on 2024-04-25 12:20

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0035_remove_project_archived'),
        ('files', '0008_alter_file_file_alter_image_file'),
    ]

    operations = [
        migrations.AddField(
            model_name='file',
            name='project',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='projects.project'),
        ),
    ]