# Generated by Django 3.0.4 on 2022-04-11 14:28

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('assembly_bom', '0002_auto_20220324_1257'),
    ]

    operations = [
        migrations.AddField(
            model_name='assembly_bom',
            name='bom_name',
            field=models.TextField(blank=True, max_length=50, null=True),
        ),
    ]
