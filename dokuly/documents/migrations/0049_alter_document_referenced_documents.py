# Generated by Django 4.2.11 on 2024-09-06 13:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0048_markdowntext'),
    ]

    operations = [
        migrations.AlterField(
            model_name='document',
            name='referenced_documents',
            field=models.ManyToManyField(blank=True, related_name='references', to='documents.document'),
        ),
    ]