# Generated manually

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('profiles', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='TraceabilityEvent',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('event_type', models.CharField(choices=[('created', 'Created'), ('revision_created', 'Revision Created'), ('bom_edited', 'BOM Edited'), ('approved', 'Approved for Release'), ('released', 'Released'), ('updated', 'Updated')], max_length=50)),
                ('app_type', models.CharField(choices=[('parts', 'Parts'), ('pcbas', 'PCBAs'), ('assemblies', 'Assemblies'), ('documents', 'Documents')], max_length=50)),
                ('item_id', models.IntegerField()),
                ('revision', models.CharField(blank=True, max_length=20, null=True)),
                ('timestamp', models.DateTimeField(auto_now_add=True)),
                ('details', models.TextField(blank=True, max_length=20000, null=True)),
                ('bom_id', models.IntegerField(blank=True, null=True)),
                ('profile', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='traceability_events', to='profiles.profile')),
                ('user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='traceability_events', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-timestamp'],
            },
        ),
        migrations.AddIndex(
            model_name='traceabilityevent',
            index=models.Index(fields=['app_type', 'item_id'], name='traceabilit_app_ty_12345_idx'),
        ),
        migrations.AddIndex(
            model_name='traceabilityevent',
            index=models.Index(fields=['event_type'], name='traceabilit_event__12345_idx'),
        ),
        migrations.AddIndex(
            model_name='traceabilityevent',
            index=models.Index(fields=['timestamp'], name='traceabilit_timesta_12345_idx'),
        ),
    ]
