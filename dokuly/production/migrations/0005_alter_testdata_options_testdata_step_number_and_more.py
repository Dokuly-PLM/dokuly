# Generated by Django 4.2 on 2024-05-04 15:06

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('production', '0004_production_serial_number_counter'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='testdata',
            options={'ordering': ['step_number']},
        ),
        migrations.AddField(
            model_name='testdata',
            name='step_number',
            field=models.IntegerField(default=0),
        ),
        migrations.AddField(
            model_name='testdata',
            name='step_title',
            field=models.CharField(blank=True, max_length=500),
        ),
    ]
