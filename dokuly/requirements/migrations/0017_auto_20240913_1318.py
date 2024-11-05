import re
from django.db import migrations


def migrate_tags(apps, schema_editor):
    Requirement = apps.get_model('requirements', 'Requirement')
    Tag = apps.get_model('projects', 'Tag')

    # Regular expression to find a hex color code (with optional opacity)
    hex_color_regex = re.compile(r'#([A-Fa-f0-9]{6})([A-Fa-f0-9]{2})?$')

    requirements = Requirement.objects.exclude(old_tags__isnull=True).exclude(old_tags__exact="")

    # If no requirements have tags, there is nothing to migrate
    if not requirements:
        return

    for requirement in requirements:
        try:
            if requirement.requirement_set and requirement.requirement_set.project:
                project = requirement.requirement_set.project
            else:
                continue  # Skip requirements without a project

            tag_data = requirement.old_tags.split(',')
            for data in tag_data:
                match = hex_color_regex.search(data)
                if match:
                    color = match.group(0)  # The whole match is the color, including opacity if present
                    name = data[:match.start()].strip()  # Everything before the color

                    tag, created = Tag.objects.get_or_create(
                        name=name,
                        color=color,
                        project=project,
                        defaults={'description': 'Automatically migrated'}
                    )
                    requirement.tags.add(tag)
        except Exception as e:
            print(f"Failed to migrate tags for requirement {requirement.id}: {e}")


class Migration(migrations.Migration):
    dependencies = [
        ('requirements', '0015_rename_tags_requirement_old_tags'),
        ('requirements', '0016_requirement_tags'),
    ]

    operations = [
        migrations.RunPython(migrate_tags),
    ]
