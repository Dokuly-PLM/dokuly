# Generated by Django 3.0.4 on 2020-07-26 14:37

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assemblies', '0013_assembly_last_updated'),
    ]

    operations = [
        migrations.AlterField(
            model_name='assembly',
            name='last_updated',
            field=models.DateTimeField(auto_now=True),
        ),
    ]
