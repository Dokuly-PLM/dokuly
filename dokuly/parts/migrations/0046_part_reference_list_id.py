# Generated by Django 3.0.4 on 2022-07-19 10:07

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('parts', '0045_auto_20220408_1328'),
    ]

    operations = [
        migrations.AddField(
            model_name='part',
            name='reference_list_id',
            field=models.IntegerField(blank=True, default=-1),
        ),
    ]