# Generated by Django 4.2 on 2024-03-13 20:08

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assemblies', '0043_assembly_thumbnail'),
    ]

    operations = [
        migrations.AddField(
            model_name='assembly',
            name='currency',
            field=models.CharField(blank=True, default='USD', max_length=20, null=True),
        ),
    ]
