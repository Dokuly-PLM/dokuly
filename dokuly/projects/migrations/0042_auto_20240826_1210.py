from django.db import migrations, transaction


def copy_description_to_title(apps, schema_editor):
    Issue = apps.get_model('projects', 'Issues')
    MarkdownText = apps.get_model('documents', 'MarkdownText')

    batch_size = 500
    max_id = Issue.objects.order_by('-id').values_list('id', flat=True).first()
    if not max_id:
        return  # Exit if there are no issues

    for start in range(0, max_id + 1, batch_size):
        try:
            with transaction.atomic():  # Use a transaction to ensure all-or-nothing processing
                end = min(start + batch_size, max_id + 1)
                issues_to_update = Issue.objects.filter(id__range=(start, end - 1)).select_related('description').iterator()

                updated_issues = []
                for issue in issues_to_update:
                    if issue.description:
                        issue.title = issue.description.text
                        updated_issues.append(issue)

                Issue.objects.bulk_update(updated_issues, ['title'])
        except Exception as e:
            pass


class Migration(migrations.Migration):
    dependencies = [
        ('projects', '0041_issues_title'),
    ]

    operations = [
        migrations.RunPython(copy_description_to_title),
    ]
