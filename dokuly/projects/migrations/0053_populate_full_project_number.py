# Generated migration to populate full_project_number field

from django.db import migrations


def populate_full_project_number(apps, schema_editor):
    """
    Populate full_project_number for all existing projects.
    
    Logic:
    - If project has customer and project_number: full_project_number = customer_id + project_number (concatenated as string, stored as int)
    - Otherwise: assign fallback numbers starting from 1000
    """
    Project = apps.get_model('projects', 'Project')
    Customer = apps.get_model('customers', 'Customer')
    
    # Get all projects ordered by ID for consistent fallback numbering
    projects = Project.objects.all().order_by('id')
    
    fallback_number = 1000
    
    for project in projects:
        try:
            # Check if project has customer and both have valid numbers
            if project.customer_id and project.project_number is not None:
                customer = Customer.objects.get(id=project.customer_id)
                if customer.customer_id is not None:
                    # Concatenate customer_id and project_number as strings, then convert to int
                    full_number_str = f"{customer.customer_id}{project.project_number}"
                    project.full_project_number = int(full_number_str)
                else:
                    # Customer exists but has no customer_id - use fallback
                    # concatenate fallback with project_number
                    full_number_str = f"{fallback_number}{project.project_number}"
                    project.full_project_number = int(full_number_str)
                    fallback_number += 1
            else:
                # No customer or no project_number - use fallback
                project.full_project_number = fallback_number
                fallback_number += 1
            
            project.save(update_fields=['full_project_number'])
            
        except Customer.DoesNotExist:
            # Customer reference is broken - use fallback
            project.full_project_number = fallback_number
            fallback_number += 1
            project.save(update_fields=['full_project_number'])
        except Exception as e:
            # Any other error - use fallback
            print(f"Error processing project {project.id}: {e}")
            project.full_project_number = fallback_number
            fallback_number += 1
            project.save(update_fields=['full_project_number'])


def reverse_populate(apps, schema_editor):
    """
    Reverse migration - clear full_project_number field
    """
    Project = apps.get_model('projects', 'Project')
    Project.objects.all().update(full_project_number=None)


class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0052_project_full_project_number'),
        ('customers', '0001_initial'),  # Ensure Customer model is available
    ]

    operations = [
        migrations.RunPython(populate_full_project_number, reverse_populate),
    ]
