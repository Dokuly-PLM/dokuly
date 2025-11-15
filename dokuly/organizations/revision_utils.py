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


def convert_letter_to_number_revision(letter_revision: str, separator: str = "-") -> str:
    """
    Convert letter revision to number revision.
    Handles both simple letters (A -> 1) and letter-minor format (A-1 -> 1-1).
    
    Args:
        letter_revision: Letter-based revision (e.g., "A", "B", "AA", "A-1", "B-2")
        separator: Separator to use/detect (default "-")
    
    Returns:
        Number-based revision string
    
    Examples:
        - "A" -> "1"
        - "B" -> "2"
        - "AA" -> "27"
        - "A-0" -> "1-0"
        - "A-1" -> "1-1"
        - "B-2" -> "2-2"
    """
    if not letter_revision:
        return "1"
    
    # Check if it has a minor revision part
    if separator in letter_revision:
        try:
            letter_part, minor_part = letter_revision.split(separator)
            major_number = _convert_letter_part_to_number(letter_part)
            return f"{major_number}{separator}{minor_part}"
        except (ValueError, IndexError):
            # Malformed, treat as simple letter
            return _convert_letter_part_to_number(letter_revision)
    
    return _convert_letter_part_to_number(letter_revision)


def _convert_letter_part_to_number(letter_part: str) -> str:
    """
    Convert just the letter part to a number.
    A -> 1, B -> 2, ..., Z -> 26, AA -> 27, etc.
    """
    if not letter_part:
        return "1"
    
    # Handle single letter
    if len(letter_part) == 1:
        return str(ord(letter_part.upper()) - ord('A') + 1)
    
    # Handle multiple letters (AA, AB, etc.)
    result = 0
    for i, char in enumerate(reversed(letter_part.upper())):
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


def increment_letter_revision(old_revision: str, separator: str = "-", revision_type: str = "major") -> str:
    """
    Increment letter-based revision with support for minor revisions.
    
    Args:
        old_revision: Current revision (e.g., "A", "A-0", "A-1", "B")
        separator: Separator between major and minor ("-" or ".")
        revision_type: "major" or "minor"
    
    Returns:
        New revision string
    
    Examples:
        - increment_letter_revision("A", "-", "major") -> "B-0"
        - increment_letter_revision("A", "-", "minor") -> "A-1"
        - increment_letter_revision("A-0", "-", "major") -> "B-0"
        - increment_letter_revision("A-0", "-", "minor") -> "A-1"
        - increment_letter_revision("A-1", "-", "minor") -> "A-2"
    """
    if not old_revision:
        return f"A{separator}0"
    
    # Parse existing revision
    if separator in old_revision:
        # Has minor revision already (e.g., "A-0", "A-1")
        try:
            letter_part, minor_str = old_revision.split(separator)
            minor = int(minor_str)
            
            if revision_type == "major":
                # Increment letter, reset minor to 0
                next_letter = increment_letter_major_only(letter_part)
                return f"{next_letter}{separator}0"
            else:  # minor
                # Increment minor number
                return f"{letter_part}{separator}{minor + 1}"
        except (ValueError, IndexError):
            # Malformed, start fresh
            return f"A{separator}0"
    else:
        # No minor revision yet (e.g., "A", "B", "AA")
        if revision_type == "major":
            # Increment letter and add minor 0
            next_letter = increment_letter_major_only(old_revision)
            return f"{next_letter}{separator}0"
        else:  # minor
            # Add minor revision 1 to existing letter
            return f"{old_revision}{separator}1"


def increment_letter_major_only(old_revision: str) -> str:
    """
    Increment letter-based major revision only (no minor support).
    
    Args:
        old_revision: Current revision (e.g., "A", "B", "Z", "AA")
    
    Returns:
        Next major revision letter(s)
    
    Examples:
        - increment_letter_major_only("A") -> "B"
        - increment_letter_major_only("Z") -> "AA"
        - increment_letter_major_only("AA") -> "AB"
        - increment_letter_major_only("AZ") -> "BA"
    """
    if not old_revision:
        return "A"
    
    # Remove any separator-based minor revision if present (for migration scenarios)
    if "-" in old_revision or "." in old_revision:
        for sep in ["-", "."]:
            if sep in old_revision:
                old_revision = old_revision.split(sep)[0]
                break
    
    # Increment the letter(s)
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



def increment_revision(old_revision: str, organization_id: Optional[int] = None, revision_type: str = "major") -> str:
    """
    Smart revision incrementing that handles both letter and number systems.
    
    Args:
        old_revision: Current revision string
        organization_id: Organization ID to determine revision system
        revision_type: "major" or "minor"
    
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
        else:
            # Letter-based revisions
            if revision_format == "major-only":
                # Only major revisions, ignore revision_type
                return increment_letter_major_only(old_revision)
            else:
                # Major-minor format with configurable separator
                return increment_letter_revision(old_revision, separator, revision_type)
    
    # Default letter-based incrementing for backward compatibility (no separator support)
    # This path is only used when organization_id is not provided
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
