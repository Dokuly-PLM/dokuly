# Generated by Django 3.0.4 on 2020-04-10 21:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0005_project_project_contact'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='is_active',
            field=models.BooleanField(blank=True, null=True),
        ),
        migrations.AlterField(
            model_name='project',
            name='requiremnt_specification',
            field=models.FileField(blank=True, null=True, upload_to=''),
        ),
    ]
