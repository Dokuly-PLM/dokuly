# Generated by Django 4.2.11 on 2024-10-01 11:11

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0050_document_tags'),
    ]

    operations = [
        migrations.AddField(
            model_name='markdowntext',
            name='title',
            field=models.CharField(blank=True, max_length=1000, null=True),
        ),
    ]
