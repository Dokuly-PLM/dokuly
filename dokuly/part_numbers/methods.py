from django.db import connection, transaction
from django.db.models import Max
from .models import PartNumber


def get_next_part_number():
    """Generate and retrieve a unique part number."""
    try:
        part_number_obj = PartNumber()
        part_number_obj.save()
        return part_number_obj.id
    except Exception as e:
        # Reset the sequence if there's an issue, and retry
        reset_part_number_sequence()
        part_number_obj = PartNumber()
        part_number_obj.save()
        return part_number_obj.id


def reset_part_number_sequence():
    '''
    Reset the primary key sequence of the PartNumber model.
    Example: id seq is at 60. We have id 60 to 100 in the table. This function will reset the sequence to 101.
    It will always update to the max possible seq id, to avoid running this function multiple times. 
    e.g., it ignores small gaps in the sequence.
    '''
    with transaction.atomic():
        # Lock the entire PartNumber table to prevent concurrent modifications
        PartNumber.objects.select_for_update().all()

        # Get the current maximum primary key value
        max_id = PartNumber.objects.aggregate(max_id=Max('id'))['max_id'] or 0

        # Max id range
        id_range = 5000  # 5k, not going over 5k to avoid performance issues

        # Generate a range of potential new IDs
        potential_ids = list(range(max_id + 1, max_id + id_range))

        # Query to find which of these IDs are already taken
        existing_ids = set(PartNumber.objects.filter(id__in=potential_ids).values_list('id', flat=True))

        # Find the first ID in the range that is not taken
        next_free_id = next((id for id in potential_ids if id not in existing_ids), max_id + id_range)  # Default to max + id_range if all are taken

        # Set the next value of the primary key sequence to the next unused ID
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT setval(pg_get_serial_sequence('{PartNumber._meta.db_table}', 'id'), {next_free_id}, false);")


def create_part_number_with_specific_primary_key(value):
    with transaction.atomic():
        # Lock the entire PartNumber table
        PartNumber.objects.select_for_update().all()

        # Get the current maximum primary key value
        max_id = PartNumber.objects.aggregate(max_id=Max('id'))['max_id']

        # Check if the desired primary key value is greater than the current maximum
        if value <= max_id:
            raise ValueError(f'The specified primary key value ({value}) must be greater than the current maximum primary key value ({max_id}).')

        # Set the next value of the primary key sequence
        with connection.cursor() as cursor:
            cursor.execute(f"SELECT setval(pg_get_serial_sequence('{PartNumber._meta.db_table}', 'id'), {value}, false);")
