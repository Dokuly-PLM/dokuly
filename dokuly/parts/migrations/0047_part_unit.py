# Generated by Django 3.2.15 on 2022-10-14 07:48

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('parts', '0046_part_reference_list_id'),
    ]

    operations = [
        migrations.AddField(
            model_name='part',
            name='unit',
            field=models.CharField(blank=True, default='pcs', max_length=20),
        ),
    ]