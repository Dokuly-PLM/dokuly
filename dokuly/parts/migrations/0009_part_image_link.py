# Generated by Django 3.0.4 on 2020-07-21 19:19

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('parts', '0008_auto_20200527_2003'),
    ]

    operations = [
        migrations.AddField(
            model_name='part',
            name='image_link',
            field=models.CharField(blank=True, max_length=200),
        ),
    ]
