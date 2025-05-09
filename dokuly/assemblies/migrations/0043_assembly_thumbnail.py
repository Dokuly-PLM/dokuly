# Generated by Django 4.2 on 2024-03-11 21:32

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('files', '0008_alter_file_file_alter_image_file'),
        ('assemblies', '0042_remove_assembly_archived'),
    ]

    operations = [
        migrations.AddField(
            model_name='assembly',
            name='thumbnail',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='files.image'),
        ),
    ]
