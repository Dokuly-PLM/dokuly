# Generated by Django 3.0.4 on 2020-12-06 21:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('customers', '0003_auto_20200629_1629'),
    ]

    operations = [
        migrations.AddField(
            model_name='customer',
            name='favorite_project',
            field=models.CharField(blank=True, max_length=3, null=True),
        ),
        migrations.AddField(
            model_name='customer',
            name='favorite_task',
            field=models.CharField(blank=True, max_length=30, null=True),
        ),
    ]
