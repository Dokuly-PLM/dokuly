# Generated by Django 3.0.4 on 2022-06-09 12:03

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0017_auto_20220609_1135'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='pcba_id',
            field=models.IntegerField(blank=True, default=-1),
        ),
    ]