# Generated by Django 3.0.4 on 2022-06-22 08:52

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0020_merge_20220617_1241'),
    ]

    operations = [
        migrations.AddField(
            model_name='document',
            name='full_doc_number',
            field=models.CharField(blank=True, max_length=50, null=True, unique=True),
        ),
    ]