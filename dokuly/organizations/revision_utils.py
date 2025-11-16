"""
Revision system utilities for handling both letter-based and number-based revisions.
"""
import re
from typing import Optional, Tuple
from django.db import models
from organizations.models import Organization


def format_revision_count(revision_count: int, use_number_revisions: bool, start_at_one: bool=False) -> str:
    """
    Format a revision count as either a number or letter.
    
    Args:
        count: The revision count (0-indexed, where 0 = first revision)
        use_number_revisions: If True, return number; if False, convert to letter
        start_at_one: If True and using number revisions, formatted revision starts at 1 instead of 0.
    
    Returns:
        Formatted revision string
    
    Examples:
        format_revision_count(0, False) -> "A"
        format_revision_count(0, True) -> "0"
        format_revision_count(1, False) -> "B"
        format_revision_count(1, True) -> "1"
        format_revision_count(25, False) -> "Z"
        format_revision_count(26, False) -> "AA"
        format_revision_count(27, False) -> "AB"
    """
    if use_number_revisions:
        if start_at_one:
            return str(revision_count + 1)
        return str(revision_count)
    else:
        # Convert to letter (A, B, C, ..., Z, AA, AB, ...)
        return _convert_count_to_letter(revision_count)


def _convert_count_to_letter(revision_count: int) -> str:
    """
    Convert a 0-indexed count to letter representation.
    
    Args:
        count: 0-indexed count (0=A, 1=B, ..., 25=Z, 26=AA, 27=AB, ...)
    
    Returns:
        Letter string representation
    
    Examples:
        0 -> "A"
        1 -> "B"
        25 -> "Z"
        26 -> "AA"
        27 -> "AB"
        51 -> "AZ"
        52 -> "BA"
    """
    if revision_count < 0:
        return "A"
    
    result = ""
    # Add 1 to make it 1-indexed for the algorithm
    revision_count += 1
    
    while revision_count > 0:
        revision_count -= 1  # Adjust for 0-based indexing in modulo
        result = chr(ord('A') + (revision_count % 26)) + result
        revision_count //= 26
    
    return result if result else "A"


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


def build_full_part_number(
    organization_id: int,
    prefix: str,
    part_number: str,
    revision_count_major: int,
    revision_count_minor: int,
    project_number: Optional[str] = None,
    created_at: Optional[object] = None,
) -> str:
    """
    Build a full part number using organization settings and template.
    
    This is a convenience wrapper around build_full_part_number_from_template
    that automatically fetches the organization's template and revision settings.
    
    Args:
        organization_id: Organization ID to fetch settings from
        prefix: Part type prefix (e.g., "PRT", "ASM", "PCBA", "DOC")
        part_number: The numeric part number (e.g., "1234")
        revision_count_major: Major revision count (0-indexed)
        revision_count_minor: Minor revision count (0-indexed)
        project_number: Optional project number for template variable
        created_at: Optional datetime for date-based template variables
    
    Returns:
        Formatted full part number according to organization template
    
    Examples:
        # Organization has template: "<prefix><part_number> Rev. <major_revision>"
        # Letter revisions, major-only format
        build_full_part_number(org_id, "PRT", "1234", 0, 0)
        # -> "PRT1234 Rev. A"
        
        # Organization has template: "<prefix><part_number><major_revision>-<minor_revision>"
        # Number revisions, major-minor format
        build_full_part_number(org_id, "PCBA", "5678", 1, 2)
        # -> "PCBA56781-2"
    """
    try:
        org = Organization.objects.get(id=organization_id)
        template = org.full_part_number_template
        use_number_revisions = org.use_number_revisions
    except Organization.DoesNotExist:
        # Fallback to defaults
        template = "<prefix><part_number><major_revision>"
        use_number_revisions = False
    
    return build_full_part_number_from_template(
        template=template,
        prefix=prefix,
        part_number=part_number,
        revision_count_major=revision_count_major,
        revision_count_minor=revision_count_minor,
        use_number_revisions=use_number_revisions,
        project_number=project_number,
        created_at=created_at,
    )


def build_full_part_number_from_template(
    template: str,
    prefix: str,
    part_number: str,
    revision_count_major: int,
    revision_count_minor: int,
    use_number_revisions: bool,
    project_number: Optional[str] = None,
    created_at: Optional[object] = None,
) -> str:
    """
    Build a full part number from a template and revision counts.
    
    Args:
        template: Template string with variables like "<prefix><part_number><revision>"
        prefix: Part type prefix (e.g., "PRT", "ASM", "PCBA", "DOC")
        part_number: The numeric part number (e.g., "1234")
        revision_count_major: Major revision count (0-indexed)
        revision_count_minor: Minor revision count (0-indexed)
        use_number_revisions: Whether to use numbers (True) or letters (False)
        project_number: Optional project number (e.g., "PRJ001")
        created_at: Optional datetime object for date-based variables
    
    Returns:
        Formatted full part number
    
    Examples:
        # Template: "<prefix><part_number> Rev. <major_revision>"
        # PRT, 1234, major=1, minor=0, letters, major-only
        # -> "PRT1234 Rev. B"
        
        # Template: "<part_number>-<major_revision>.<minor_revision>"
        # (blank), 1234, major=0, minor=2, numbers, major-minor
        # -> "1234-0.2"
        
        # Template: "<prefix><part_number>-<year><month><day>-<project_number>"
        # PRT, 1234, created_at=2025-01-15, project_number=PRJ001
        # -> "PRT1234-20250115-PRJ001"
    """
    # Convert inputs to strings to ensure replace() works
    prefix_str = str(prefix) if prefix else ""
    part_number_str = str(part_number) if part_number else ""
    project_number_str = str(project_number) if project_number else ""
    
    # Format individual revision components
    major_formatted = format_revision_count(revision_count_major, use_number_revisions)
    minor_formatted = format_revision_count(revision_count_minor, use_number_revisions)
    
    # Format date components if created_at is provided
    day_str = ""
    month_str = ""
    year_str = ""
    if created_at:
        try:
            day_str = created_at.strftime("%d")  # 01-31
            month_str = created_at.strftime("%m")  # 01-12
            year_str = created_at.strftime("%Y")  # e.g., 2025
        except (AttributeError, ValueError):
            # If created_at is not a datetime object or is invalid, use empty strings
            pass
    
    # Replace template variables
    result = template
    result = result.replace("<prefix>", prefix_str)
    result = result.replace("<part_number>", part_number_str)
    result = result.replace("<revision>", major_formatted)
    result = result.replace("<major_revision>", major_formatted)
    result = result.replace("<minor_revision>", minor_formatted)
    result = result.replace("<project_number>", project_number_str)
    result = result.replace("<day>", day_str)
    result = result.replace("<month>", month_str)
    result = result.replace("<year>", year_str)
    
    return result


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


def increment_revision_counters(major_count: int, minor_count: int, increment_major=True):
    """Inclrement revision counters
    """
    if increment_major == 'major':
        revision_count_major = major_count + 1
        revision_count_minor = 0  # Reset minor on major increment
    else:  # minor
        revision_count_major = major_count
        revision_count_minor = minor_count + 1
        
    return revision_count_major, revision_count_minor


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
