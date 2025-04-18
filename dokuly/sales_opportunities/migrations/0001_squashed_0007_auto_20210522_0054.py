# Generated by Django 4.1.5 on 2023-02-10 11:21

from django.conf import settings
import django.contrib.postgres.fields
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    replaces = [('sales_opportunities', '0001_initial'), ('sales_opportunities', '0002_salesopportunity_state'), ('sales_opportunities', '0003_auto_20201115_1428'), ('sales_opportunities', '0004_auto_20210301_1413'), ('sales_opportunities', '0005_auto_20210430_1636'), ('sales_opportunities', '0006_auto_20210507_0943'), ('sales_opportunities', '0007_auto_20210522_0054')]

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='SalesOpportunity',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(blank=True, max_length=50, null=True)),
                ('description', models.TextField(blank=True, max_length=50000)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('last_updated', models.DateTimeField(auto_now=True)),
                ('interest_level', models.IntegerField(blank=True, null=True)),
                ('comment_content', django.contrib.postgres.fields.ArrayField(base_field=models.TextField(blank=True, max_length=5000), default=list, null=True, size=None)),
                ('comment_user', django.contrib.postgres.fields.ArrayField(base_field=models.IntegerField(blank=True, null=True), default=list, null=True, size=None)),
                ('comment_date', django.contrib.postgres.fields.ArrayField(base_field=models.DateField(blank=True, null=True), default=list, null=True, size=None)),
                ('assignee', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to=settings.AUTH_USER_MODEL)),
                ('state', models.CharField(blank=True, max_length=50, null=True)),
            ],
        ),
    ]
