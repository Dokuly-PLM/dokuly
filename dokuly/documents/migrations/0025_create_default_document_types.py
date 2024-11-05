# Manually generated.

from django.db import migrations, models

def add_default_doc_types(apps, schema_editor):
    Document_Prefix = apps.get_model('documents', 'Document_Prefix')

    if not(Document_Prefix.objects.filter(prefix="RS")):
        prefix = Document_Prefix.objects.create(
            prefix="RS",
            display_name='Requirement Specification',
            part_doc=True,
            project_doc=True
        )
        prefix.save()

    if not(Document_Prefix.objects.filter(prefix="PS")):
        prefix = Document_Prefix.objects.create(
            prefix="PS",
            display_name='Project Specification',
            part_doc=False,
            project_doc=True
        )
        prefix.save()

    if not(Document_Prefix.objects.filter(prefix="SR")):
        prefix = Document_Prefix.objects.create(
            prefix="SR",
            display_name='Status Report',
            part_doc=False,
            project_doc=True
        )
        prefix.save()

    if not(Document_Prefix.objects.filter(prefix="TN")):
        prefix = Document_Prefix.objects.create(
            prefix="TN",
            display_name='Technical Note',
            part_doc=True,
            project_doc=True
        )
        prefix.save()

    if not(Document_Prefix.objects.filter(prefix="TS")):
        prefix = Document_Prefix.objects.create(
            prefix="TS",
            display_name='Test Specification',
            part_doc=True,
            project_doc=False,
        )
        prefix.save()

    if not(Document_Prefix.objects.filter(prefix="TR")):
        prefix = Document_Prefix.objects.create(
            prefix="TR",
            display_name='Test Report',
            part_doc=True,
            project_doc=False,
        )
        prefix.save()
    

class Migration(migrations.Migration):

    dependencies = [
        ('documents', '0024_auto_20220627_1601'),
    ]

    operations = [
        migrations.RunPython(add_default_doc_types),
    ]
