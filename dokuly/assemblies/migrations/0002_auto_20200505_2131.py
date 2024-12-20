# Generated by Django 3.0.4 on 2020-05-05 19:31

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('parts', '0005_part_part_type'),
        ('assemblies', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='assembly',
            name='slug',
            field=models.CharField(default='parts', max_length=20),
        ),
        migrations.AlterField(
            model_name='assembly',
            name='part_used',
            field=models.ManyToManyField(blank=True, related_name='parts', to='parts.Part'),
        ),
    ]
