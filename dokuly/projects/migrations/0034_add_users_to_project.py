from django.db import migrations

def add_users_to_all_projects(apps, schema_editor):
    User = apps.get_model('auth', 'User')
    Project = apps.get_model('projects', 'Project')

    users = User.objects.all()
    projects = Project.objects.all()

    for project in projects:
        # Add users to the project, preserving existing members
        for user in users:
            project.project_members.add(user)

class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0033_project_project_members'),  # Ensure this is your last project migration
    ]

    operations = [
        migrations.RunPython(add_users_to_all_projects),
    ]