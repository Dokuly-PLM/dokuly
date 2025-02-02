# Generated by Django 3.0.4 on 2021-03-07 14:56

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('parts', '0021_auto_20210220_1629'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='part',
            name='attribute_five',
        ),
        migrations.RemoveField(
            model_name='part',
            name='attribute_four',
        ),
        migrations.RemoveField(
            model_name='part',
            name='attribute_one',
        ),
        migrations.RemoveField(
            model_name='part',
            name='attribute_three',
        ),
        migrations.RemoveField(
            model_name='part',
            name='attribute_two',
        ),
        migrations.AddField(
            model_name='part',
            name='estimated_factory_lead_days',
            field=models.IntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='part',
            name='on_order_quantity',
            field=models.IntegerField(blank=True, null=True),
        ),
    ]
