# Generated by Django 4.2 on 2023-05-10 10:23

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tenants', '0002_tenant_max_allowed_active_users'),
    ]

    operations = [
        migrations.CreateModel(
            name='SignupInfo',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('email', models.CharField(blank=True, max_length=200)),
                ('full_name', models.CharField(blank=True, max_length=200)),
                ('username', models.CharField(blank=True, max_length=200)),
                ('domain', models.CharField(blank=True, max_length=50)),
                ('userid_username', models.CharField(blank=True, max_length=500)),
            ],
        ),
    ]