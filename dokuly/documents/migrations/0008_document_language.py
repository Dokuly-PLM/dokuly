# Generated by Django 3.0.4 on 2020-07-06 07:16

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0007_document_pdf'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='language',
            field=models.CharField(blank=True, max_length=50, null=True),
        ),
    ]