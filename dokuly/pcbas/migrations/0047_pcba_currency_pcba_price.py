# Generated by Django 4.2 on 2024-03-13 20:12

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('pcbas', '0046_pcba_thumbnail'),
    ]

    operations = [
        migrations.AddField(
            model_name='pcba',
            name='currency',
            field=models.CharField(blank=True, default='USD', max_length=20, null=True),
        ),
        migrations.AddField(
            model_name='pcba',
            name='price',
            field=models.CharField(blank=True, max_length=10, null=True),
        ),
    ]
