# Generated by Django 3.0.4 on 2020-04-01 18:38

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('projects', '0004_remove_project_project_contact'),
    ]

    operations = [
        migrations.CreateModel(
            name='EmployeeTime',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('task', models.CharField(max_length=100)),
                ('date', models.DateField()),
                ('start_time', models.TimeField(blank=True, null=True)),
                ('stop_time', models.TimeField(blank=True, null=True)),
                ('hour', models.DecimalField(decimal_places=2, max_digits=4)),
                ('comment', models.TextField(blank=True, max_length=200)),
                ('project', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, to='projects.Project')),
                ('user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]