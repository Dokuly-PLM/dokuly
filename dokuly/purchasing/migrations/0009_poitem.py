# Generated by Django 4.2.11 on 2024-07-20 12:34

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('parts', '0077_parttype_prefix'),
        ('assemblies', '0046_assembly_markdown_notes'),
        ('pcbas', '0050_pcba_gerber_file'),
        ('purchasing', '0008_supplier_website'),
    ]

    operations = [
        migrations.CreateModel(
            name='PoItem',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('quantity', models.FloatField(blank=True, default=1.0)),
                ('comment', models.CharField(blank=True, max_length=1000, null=True)),
                ('assembly', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='po_item', to='assemblies.assembly')),
                ('part', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='po_item', to='parts.part')),
                ('pcba', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='po_item', to='pcbas.pcba')),
                ('po', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, to='purchasing.purchaseorder')),
            ],
        ),
    ]