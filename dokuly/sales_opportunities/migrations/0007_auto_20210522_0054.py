# Generated by Django 3.0.4 on 2021-05-21 22:54

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('sales_opportunities', '0006_auto_20210507_0943'),
    ]

    operations = [
        migrations.AlterField(
            model_name='salesopportunity',
            name='description',
            field=models.TextField(blank=True, max_length=50000),
        ),
    ]