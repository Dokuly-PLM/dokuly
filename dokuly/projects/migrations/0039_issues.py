# Generated by Django 4.2.11 on 2024-08-21 14:04

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('pcbas', '0050_pcba_gerber_file'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('assemblies', '0046_assembly_markdown_notes'),
        ('parts', '0077_parttype_prefix'),
        ('documents', '0048_markdowntext'),
        ('projects', '0038_task_is_complete'),
    ]

    operations = [
        migrations.CreateModel(
            name='Issues',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('closed_at', models.DateTimeField(blank=True, null=True)),
                ('criticality', models.CharField(blank=True, max_length=500)),
                ('assemblies', models.ManyToManyField(blank=True, related_name='assemblies_issues', to='assemblies.assembly')),
                ('closed_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='closed_issues', to=settings.AUTH_USER_MODEL)),
                ('closed_in_assembly', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='closed_assemblies_issues', to='assemblies.assembly')),
                ('closed_in_document', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='closed_documents_issues', to='documents.document')),
                ('closed_in_part', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='closed_parts_issues', to='parts.part')),
                ('closed_in_pcba', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='closed_pcbas_issues', to='pcbas.pcba')),
                ('created_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='created_issues', to=settings.AUTH_USER_MODEL)),
                ('description', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='documents.markdowntext')),
                ('documents', models.ManyToManyField(blank=True, related_name='documents_issues', to='documents.document')),
                ('opened_in_assembly', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='opened_assemblies_issues', to='assemblies.assembly')),
                ('opened_in_document', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='opened_documents_issues', to='documents.document')),
                ('opened_in_part', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='opened_parts_issues', to='parts.part')),
                ('opened_in_pcba', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='opened_pcbas_issues', to='pcbas.pcba')),
                ('parts', models.ManyToManyField(blank=True, related_name='parts_issues', to='parts.part')),
                ('pcbas', models.ManyToManyField(blank=True, related_name='pcbas_issues', to='pcbas.pcba')),
            ],
        ),
    ]