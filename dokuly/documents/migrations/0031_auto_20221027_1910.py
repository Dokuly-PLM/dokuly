# Generated by Django 3.2.15 on 2022-10-27 19:10

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0030_document_shared_document_link'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='previoius_revision_id',
            field=models.IntegerField(blank=True, default=-1),
        ),
    ]
