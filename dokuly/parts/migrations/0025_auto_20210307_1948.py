# Generated by Django 3.0.4 on 2021-03-07 18:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('parts', '0024_auto_20210307_1826'),
    ]

    operations = [
        migrations.AlterField(
            model_name='part',
            name='sellers',
            field=models.TextField(blank=True, max_length=50000, null=True),
        ),
        migrations.AlterField(
            model_name='part',
            name='specs',
            field=models.TextField(blank=True, max_length=50000, null=True),
        ),
    ]