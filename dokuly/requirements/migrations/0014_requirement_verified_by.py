# Generated by Django 4.2.11 on 2024-08-08 11:47

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('profiles', '0021_auto_20240423_1907'),
        ('requirements', '0013_requirement_is_verified'),
    ]

    operations = [
        migrations.AddField(
            model_name='requirement',
            name='verified_by',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='verified_by', to='profiles.profile'),
        ),
    ]