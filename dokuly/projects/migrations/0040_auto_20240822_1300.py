from django.db import migrations, transaction
from django.utils import timezone

MODEL_TO_M2M_FIELD = {
    'part': 'parts',
    'pcba': 'pcbas',
    'assembly': 'assemblies',
    'document': 'documents'
}


def chunked_bulk_create(objects, model, return_created=False):
    """ Create objects in chunked batches to avoid database overload. """
    created_objects = model.objects.bulk_create(objects)
    return created_objects


def create_issues_from_errata(apps, schema_editor):
    Part = apps.get_model('parts', 'Part')
    Pcba = apps.get_model('pcbas', 'Pcba')
    Assembly = apps.get_model('assemblies', 'Assembly')
    Document = apps.get_model('documents', 'Document')
    Issues = apps.get_model('projects', 'Issues')
    MarkdownText = apps.get_model('documents', 'MarkdownText')

    issues_to_create = []
    markdown_texts_to_create = []
    issue_model_infos = []

    with transaction.atomic():
        for model in [Part, Pcba, Assembly, Document]:
            model_objects = model.objects.filter(errata__isnull=False).exclude(errata__exact='')
            for object in model_objects:
                description = MarkdownText(text=object.errata)
                markdown_texts_to_create.append(description)
                if len(markdown_texts_to_create) >= 500:
                    chunked_bulk_create(markdown_texts_to_create, MarkdownText)
                    markdown_texts_to_create.clear()

                issue = Issues(
                    description=description,
                    criticality="Low",
                    created_by=None,
                    created_at=timezone.now(),
                )
                issues_to_create.append(issue)
                issue_model_infos.append((model.__name__.lower(), object))

                if len(issues_to_create) >= 500:
                    created_issues = chunked_bulk_create(issues_to_create, Issues, return_created=True)
                    handle_m2m_fields(created_issues, issue_model_infos, MODEL_TO_M2M_FIELD)
                    issues_to_create.clear()
                    issue_model_infos.clear()

        # Handle any leftovers
        if markdown_texts_to_create:
            chunked_bulk_create(markdown_texts_to_create, MarkdownText)
        if issues_to_create:
            created_issues = chunked_bulk_create(issues_to_create, Issues, return_created=True)
            handle_m2m_fields(created_issues, issue_model_infos, MODEL_TO_M2M_FIELD)

        issues_to_create.clear()
        markdown_texts_to_create.clear()
        issue_model_infos.clear()


def handle_m2m_fields(issues, model_infos, m2m_field_map):
    """Handles many-to-many fields after bulk creating issues."""
    for issue, (model_name, object) in zip(issues, model_infos):
        m2m_field_name = m2m_field_map.get(model_name)
        if m2m_field_name:
            getattr(issue, m2m_field_name).add(object)


class Migration(migrations.Migration):
    dependencies = [
        ('projects', '0039_issues'),
    ]

    operations = [
        migrations.RunPython(create_issues_from_errata),
    ]
