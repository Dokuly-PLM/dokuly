# Generated by Django 4.1.5 on 2023-03-02 08:56

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('parts', '0001_squashed_0055_alter_part_distributor'),
    ]

    operations = [
        migrations.CreateModel(
            name='Supplier',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(blank=True, max_length=1000, null=True)),
                ('supplier_id', models.IntegerField(null=True)),
                ('address', models.CharField(blank=True, max_length=1000, null=True)),
                ('contact', models.CharField(blank=True, max_length=1000, null=True)),
                ('phone', models.CharField(blank=True, max_length=1000, null=True)),
                ('email', models.CharField(blank=True, max_length=1000, null=True)),
                ('notes', models.CharField(blank=True, max_length=1000, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('is_archived', models.BooleanField(blank=True, default=False, null=True)),
                ('is_active', models.BooleanField(blank=True, default=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='PurchaseOrder',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('purchase_order_number', models.IntegerField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('status', models.CharField(blank=True, default='Draft', max_length=1000, null=True)),
                ('order_date', models.DateField(blank=True, null=True)),
                ('estimated_delivery_date', models.DateField(blank=True, null=True)),
                ('actual_delivery_date', models.DateField(blank=True, null=True)),
                ('is_completed', models.BooleanField(blank=True, default=False, null=True)),
                ('order_items', models.JSONField(blank=True)),
                ('total_price', models.FloatField(blank=True, null=True)),
                ('notes', models.TextField(blank=True, null=True)),
                ('payment_terms_in_days', models.IntegerField(default=0, null=True)),
                ('created_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('parts_array', models.ManyToManyField(blank=True, to='parts.part')),
                ('supplier', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, to='purchasing.supplier')),
            ],
        ),
    ]
