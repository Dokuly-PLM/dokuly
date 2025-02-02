# Generated by Django 4.2.11 on 2024-06-07 09:15

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('requirements', '0009_alter_requirement_parent_requirement'),
    ]

    operations = [
        migrations.AddField(
            model_name='requirement',
            name='derived_from',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='derived_requirements', to='requirements.requirement'),
        ),
        migrations.AddField(
            model_name='requirement',
            name='satisfied_by',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='satifies', to='requirements.requirement'),
        ),
    ]
