# Generated by Django 3.0.4 on 2020-04-11 22:44

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('customers', '0002_auto_20200412_0030'),
        ('projects', '0008_auto_20200412_0042'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='customer',
            field=models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, to='customers.Customer'),
        ),
    ]