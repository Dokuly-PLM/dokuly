# Generated by Django 3.2.15 on 2022-11-04 19:00

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0020_project_archived_date'),
        ('assemblies', '0028_assembly_generic_file_ids'),
    ]

    operations = [
        migrations.AddField(
            model_name='assembly',
            name='project',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='projects.project'),
        ),
    ]