# Generated by Django 3.0.4 on 2020-07-05 15:39

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0006_auto_20200702_2105'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='pdf',
            field=models.FileField(blank=True, null=True, upload_to='documents'),
        ),
    ]