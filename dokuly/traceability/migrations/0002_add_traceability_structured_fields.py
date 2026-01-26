# Generated manually for generic traceability

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('traceability', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='traceabilityevent',
            name='field_name',
            field=models.CharField(blank=True, max_length=255, null=True),
        ),
        migrations.AddField(
            model_name='traceabilityevent',
            name='old_value',
            field=models.TextField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='traceabilityevent',
            name='new_value',
            field=models.TextField(blank=True, null=True),
        ),
    ]
