"""
Revision system utilities for handling both letter-based and number-based revisions.
"""
import re
from typing import Optional, Tuple
from django.db import models
from organizations.models import Organization


def get_organization_revision_settings(organization_id: int) -> Tuple[bool, str, str]:
    """
    Get revision system settings for an organization.
    
    Returns:
        Tuple of (use_number_revisions, revision_format, revision_separator)
    """
    try:
        org = Organization.objects.get(id=organization_id)
        return org.use_number_revisions, org.revision_format, org.revision_separator
    except Organization.DoesNotExist:
        return False, "major-minor", "-"


def convert_letter_to_number_revision(letter_revision: str) -> str:
    """
    Convert letter revision to number revision.
    A -> 1, B -> 2, ..., Z -> 26, AA -> 27, etc.
    """
    if not letter_revision:
        return "1"
    
    # Handle single letter
    if len(letter_revision) == 1:
        return str(ord(letter_revision.upper()) - ord('A') + 1)
    
    # Handle multiple letters (AA, AB, etc.)
    result = 0
    for i, char in enumerate(reversed(letter_revision.upper())):
        result += (ord(char) - ord('A') + 1) * (26 ** i)
    
    return str(result)


def increment_number_revision(old_revision: str, revision_format: str = "major-minor", separator: str = "-", revision_type: str = "major") -> str:
    """
    Increment number-based revision.
    
    Args:
        old_revision: Current revision (e.g., "1", "1-0", "1-1")
        revision_format: "major-only" or "major-minor"
        separator: Separator between major and minor ("-" or ".")
    
    Returns:
        New revision string
    """
    if not old_revision:
        return "1" if revision_format == "major-only" else f"1{separator}0"
    
    if revision_format == "major-only":
        try:
            major = int(old_revision)
            if revision_type == "major":
                return str(major + 1)
            else:
                # For minor in major-only system, add decimal
                return f"{major}.1"
        except ValueError:
            return "1"
    
    elif revision_format == "major-minor":
        # Parse major-minor format
        if separator in old_revision:
            try:
                major, minor = map(int, old_revision.split(separator))
                if revision_type == "major":
                    return f"{major + 1}{separator}0"
                else:
                    return f"{major}{separator}{minor + 1}"
            except ValueError:
                return f"1{separator}0"
        else:
            # If it's just a number, treat as major and add minor
            try:
                major = int(old_revision)
                if revision_type == "major":
                    return f"{major + 1}{separator}0"
                else:
                    return f"{major}{separator}1"
            except ValueError:
                return f"1{separator}0"
    
    return f"1{separator}0"


def increment_revision(old_revision: str, organization_id: Optional[int] = None, revision_type: str = "major") -> str:
    """
    Smart revision incrementing that handles both letter and number systems.
    
    Args:
        old_revision: Current revision string
        organization_id: Organization ID to determine revision system
        revision_type: "major" or "minor" for number-based revisions
    
    Returns:
        New revision string
    """
    if not old_revision:
        return "A"  # Default to letter system for backward compatibility
    
    # Check if we should use number revisions
    if organization_id:
        use_number_revisions, revision_format, separator = get_organization_revision_settings(organization_id)
        if use_number_revisions:
            return increment_number_revision(old_revision, revision_format, separator, revision_type)
    
    # Default letter-based incrementing (existing logic)
    if old_revision[-1] == "Z" and len(old_revision) == 1:
        return "AA"
    elif old_revision[-1] == "Z":
        new_letter = chr(ord(old_revision[-2]) + 1)
        return old_revision[0:-2] + new_letter + "A"
    elif len(old_revision) > 1:
        new_letter = chr(ord(old_revision[-1]) + 1)
        return old_revision[0:-1] + new_letter
    else:
        return chr(ord(old_revision) + 1)


def format_revision_display(full_part_number: str, revision: str, organization_id: Optional[int] = None) -> str:
    """
    Format revision display with underscore separator for number revisions.
    
    Args:
        full_part_number: Base part number (e.g., "PRT1234")
        revision: Revision string (e.g., "A", "1", "1-0")
        organization_id: Organization ID to determine format
    
    Returns:
        Formatted part number with revision
    """
    if not revision:
        return full_part_number
    
    # Check if we should use underscore separator
    if organization_id:
        use_number_revisions, _ = get_organization_revision_settings(organization_id)
        if use_number_revisions:
            return f"{full_part_number}_{revision}"
    
    # Default concatenation for letter revisions
    return f"{full_part_number}{revision}"


def parse_revision_string(revision: str) -> Tuple[int, int]:
    """
    Parse revision string into major and minor numbers.
    
    Args:
        revision: Revision string (e.g., "1", "1-0", "1-1", "A", "B")
    
    Returns:
        Tuple of (major, minor) numbers
    """
    if not revision:
        return 1, 0
    
    # Handle letter revisions
    if revision.isalpha():
        letter_num = convert_letter_to_number_revision(revision)
        return int(letter_num), 0
    
    # Handle number revisions
    if '-' in revision:
        try:
            major, minor = map(int, revision.split('-'))
            return major, minor
        except ValueError:
            return 1, 0
    else:
        try:
            return int(revision), 0
        except ValueError:
            return 1, 0


def validate_revision_sequence(revisions: list, new_revision: str) -> bool:
    """
    Validate that a new revision doesn't conflict with existing revisions.
    
    Args:
        revisions: List of existing revision strings
        new_revision: New revision to validate
    
    Returns:
        True if valid, False if conflicts
    """
    if not revisions or not new_revision:
        return True
    
    new_major, new_minor = parse_revision_string(new_revision)
    
    for existing_revision in revisions:
        if not existing_revision:
            continue
            
        existing_major, existing_minor = parse_revision_string(existing_revision)
        
        # Check for exact match
        if new_major == existing_major and new_minor == existing_minor:
            return False
        
        # Check for conflicts in major-minor system
        if new_major == existing_major and new_minor <= existing_minor:
            return False
    
    return True


def get_next_revision(revisions: list, organization_id: Optional[int] = None) -> str:
    """
    Get the next logical revision based on existing revisions.
    
    Args:
        revisions: List of existing revision strings
        organization_id: Organization ID to determine revision system
    
    Returns:
        Next revision string
    """
    if not revisions:
        if organization_id:
            use_number_revisions, revision_format = get_organization_revision_settings(organization_id)
            if use_number_revisions:
                return "1" if revision_format == "major-only" else "1-0"
        return "A"
    
    # Get the highest revision
    highest_revision = max(revisions, key=lambda r: parse_revision_string(r))
    
    # Increment it
    return increment_revision(highest_revision, organization_id)
