# Generated by Django 4.1.5 on 2023-03-12 17:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('organizations', '0014_currency_remove_organization_currency_and_more'),
    ]

    operations = [
        migrations.DeleteModel(
            name='Currency',
        ),
        migrations.AddField(
            model_name='organization',
            name='currency',
            field=models.CharField(blank=True, default='USD', max_length=3),
        ),
        migrations.AddField(
            model_name='organization',
            name='currency_conversion_rates',
            field=models.JSONField(blank=True, default={}),
        ),
        migrations.AddField(
            model_name='organization',
            name='currency_update_time',
            field=models.DateTimeField(blank=True, null=True),
        ),
    ]