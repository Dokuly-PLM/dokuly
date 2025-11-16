# Generated migration to populate revision_count_major and revision_count_minor
# from existing revision strings

from django.db import migrations
import re


def parse_revision_to_counts(revision_str: str) -> tuple:
    """
    Parse a revision string to extract major and minor revision counts.
    
    CRITICAL: This function is used for migration to populate revision_count_major 
    and revision_count_minor fields from legacy revision strings.
    
    Both counters start at 0.
    
    Args:
        revision_str: Revision string that can be:
            - Letter-based major only: "A", "B", "C", ..., "Z", "AA", "AB"
            - Number-based major only: "0", "1", "2", "3"
            - Number-based major-minor: "0-0", "0-1", "2-0", "2-1"
            - Number-based major-minor: "0.0", "0.1", "2.0", "2.1"
    
    Returns:
        Tuple of (revision_count_major, revision_count_minor)
        Both start at 0, so "A" or "0" -> (0, 0)
    
    Examples:
        - "" or None -> (0, 0)  # No revision
        - "A" -> (0, 0)         # First major revision, letter
        - "B" -> (1, 0)         # Second major revision, letter
        - "1" -> (1, 0)         # First major revision, number
        - "2" -> (2, 0)         # Second major revision, number
        - "0-0" -> (0, 0)       # First major, first minor
        - "0-1" -> (0, 1)       # First major, second minor
        - "1-0" -> (1, 0)       # Second major, first minor
    """
    # Step 1: Handle empty/None case
    if not revision_str:
        return 0, 0
    
    # Step 2: Detect if letter or number based
    is_letter_based = bool(re.match(r"^[A-Z]+", revision_str))
    
    # Step 3: Check for separator ("-" or ".") to detect major-minor format. 
    # Handle case of no separator (major only)
    separator = "-"
    if "-" in revision_str:
        separator = "-"
    elif "." in revision_str:
        separator = "."

    
    # Step 4: Parse letter-based revisions
    #   - Extract major letter part and convert to number
    #   - Currently, only major-only letter revisions exist.
    if is_letter_based:
        # Major only
        major = 0
        for i, char in enumerate(reversed(revision_str.upper())):
            major += (ord(char) - ord('A') + 1) * (26 ** i)
        major -= 1  # Convert to 0-indexed
        return major, 0
    
    # Step 5: Parse number-based revisions
    #   - Extract major number
    #   - Extract minor number if present
    if separator in revision_str:
        try:
            major_str, minor_str = revision_str.split(separator)
            major = int(major_str)
            minor = int(minor_str)
        except ValueError:
            major = 1
            minor = 0
        
        return major, minor
    else:
        try:
            major = int(revision_str)
            minor = 0
        except ValueError:
            major = 1
            minor = 0

        return major, minor


def populate_assembly_revision_counts(apps, schema_editor):
    """Populate revision_count_major and revision_count_minor for all assemblies."""
    Assembly = apps.get_model('assemblies', 'Assembly')
    
    updated_count = 0
    for assembly in Assembly.objects.all():
        if assembly.revision:
            major, minor = parse_revision_to_counts(assembly.revision)
            assembly.revision_count_major = major
            assembly.revision_count_minor = minor
            assembly.save(update_fields=['revision_count_major', 'revision_count_minor'])
            updated_count += 1
    
    print(f"Updated {updated_count} assemblies with revision counts")


def reverse_migration(apps, schema_editor):
    """Reset revision counts to 0."""
    Assembly = apps.get_model('assemblies', 'Assembly')
    Assembly.objects.all().update(revision_count_major=0, revision_count_minor=0)


class Migration(migrations.Migration):

    dependencies = [
        ('assemblies', '0053_assembly_revision_count_major_and_more'),
    ]

    operations = [
        migrations.RunPython(populate_assembly_revision_counts, reverse_migration),
    ]
