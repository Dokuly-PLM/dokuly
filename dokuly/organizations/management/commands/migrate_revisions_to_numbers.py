"""
Django management command to migrate letter-based revisions to number-based revisions.
This command should be run when an organization switches to number-based revisions.
"""
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from organizations.models import Organization
from organizations.revision_utils import convert_letter_to_number_revision
from parts.models import Part
from assemblies.models import Assembly
from pcbas.models import Pcba


def migrate_organization_revisions(organization_id, dry_run=False, force=False):
    """
    Migrate letter-based revisions to number-based revisions for an organization.
    This function can be called directly from other parts of the application.
    """
    try:
        organization = Organization.objects.get(id=organization_id)
    except Organization.DoesNotExist:
        raise ValueError(f'Organization with ID {organization_id} does not exist')

    # Check if organization already uses number revisions
    if organization.use_number_revisions and not force:
        raise ValueError(f'Organization {organization.name} already uses number revisions. Use force=True to override this check.')

    # Get revision settings
    revision_format = organization.revision_format or "major-minor"
    separator = organization.revision_separator or "-"
    
    # Migrate Parts
    parts_migrated = _migrate_parts(organization, revision_format, separator, dry_run)
    
    # Migrate Assemblies
    assemblies_migrated = _migrate_assemblies(organization, revision_format, separator, dry_run)
    
    # Migrate PCBAs
    pcbas_migrated = _migrate_pcbas(organization, revision_format, separator, dry_run)
    
    total_migrated = parts_migrated + assemblies_migrated + pcbas_migrated
    
    if not dry_run:
        # Update organization to use number revisions
        organization.use_number_revisions = True
        organization.save()
    
    return total_migrated


def _migrate_parts(organization, revision_format, separator, dry_run):
    """Migrate parts for the organization."""
    from profiles.models import Profile
    
    user_profiles = Profile.objects.filter(organization_id=organization.id)
    user_ids = [profile.user_id for profile in user_profiles if profile.user_id]
    parts = Part.objects.filter(created_by_id__in=user_ids)
    
    migrated_count = 0
    for part in parts:
        if _migrate_item_revision(part, revision_format, separator, dry_run):
            migrated_count += 1
    
    return migrated_count


def _migrate_assemblies(organization, revision_format, separator, dry_run):
    """Migrate assemblies for the organization."""
    from profiles.models import Profile
    
    user_profiles = Profile.objects.filter(organization_id=organization.id)
    user_ids = [profile.user_id for profile in user_profiles if profile.user_id]
    assemblies = Assembly.objects.filter(created_by_id__in=user_ids)
    
    migrated_count = 0
    for assembly in assemblies:
        if _migrate_item_revision(assembly, revision_format, separator, dry_run):
            migrated_count += 1
    
    return migrated_count


def _migrate_pcbas(organization, revision_format, separator, dry_run):
    """Migrate PCBAs for the organization."""
    from profiles.models import Profile
    
    user_profiles = Profile.objects.filter(organization_id=organization.id)
    user_ids = [profile.user_id for profile in user_profiles if profile.user_id]
    pcbas = Pcba.objects.filter(created_by_id__in=user_ids)
    
    migrated_count = 0
    for pcba in pcbas:
        if _migrate_item_revision(pcba, revision_format, separator, dry_run):
            migrated_count += 1
    
    return migrated_count


def _migrate_item_revision(item, revision_format, separator, dry_run):
    """
    Migrate a single item's revision from letter to number format.
    Also updates full_part_number to include underscore separator for number revisions.
    Returns True if migration was performed, False if skipped.
    """
    # Handle items without revision - give them a default revision and format full_part_number
    if not item.revision:
        # For items without revision, give them a default revision and format full_part_number
        if hasattr(item, 'full_part_number') and item.full_part_number:
            # Give them a default revision based on the format
            if revision_format == "major-only":
                default_revision = "1"
            else:
                default_revision = f"1{separator}0"
            
            # Format full_part_number with underscore separator for number revisions
            if not dry_run:
                item.revision = default_revision
                item.full_part_number = f"{item.full_part_number}_{default_revision}"
                item.save()
            return True
        return False
    
    needs_migration = False
    new_revision = item.revision
    
    # Check if revision needs to be converted from letter to number
    try:
        if revision_format == "major-only":
            int(item.revision)
            # Already a number, but check if full_part_number needs underscore
        else:
            # Check if it's already in major-minor format
            if separator in item.revision:
                parts = item.revision.split(separator)
                if len(parts) == 2:
                    int(parts[0])
                    int(parts[1])
                    # Already in major-minor format, but check if full_part_number needs underscore
            else:
                # Single number, convert to major-minor format
                int(item.revision)
                new_revision = f"{item.revision}{separator}0"
                needs_migration = True
    except ValueError:
        # Not a number, convert from letter to number
        new_revision = convert_letter_to_number_revision(item.revision)
        if revision_format == "major-minor":
            new_revision = f"{new_revision}{separator}0"
        needs_migration = True
    
    # Check if full_part_number needs underscore separator
    needs_underscore_update = False
    if hasattr(item, 'full_part_number') and item.full_part_number:
        if not item.full_part_number.endswith(f"_{new_revision}"):
            needs_underscore_update = True
    
    if not needs_migration and not needs_underscore_update:
        return False  # No changes needed
    
    if not dry_run:
        # Update the item
        if needs_migration:
            item.revision = new_revision
        
        # Update full_part_number to include underscore separator
        if needs_underscore_update and hasattr(item, 'full_part_number') and item.full_part_number:
            # Remove old revision from full_part_number and add new one with underscore
            base_number = item.full_part_number
            if item.revision and not base_number.endswith(item.revision):
                # Find the last occurrence of the old revision and remove it
                old_revision = item.revision
                if old_revision in base_number:
                    base_number = base_number.rsplit(old_revision, 1)[0]
            
            item.full_part_number = f"{base_number}_{new_revision}"
        
        item.save()
    
    return True


class Command(BaseCommand):
    help = 'Migrate letter-based revisions to number-based revisions for an organization'

    def add_arguments(self, parser):
        parser.add_argument(
            'organization_id',
            type=int,
            help='Organization ID to migrate revisions for'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without making actual changes'
        )
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force migration even if organization already uses number revisions'
        )

    def handle(self, *args, **options):
        org_id = options['organization_id']
        dry_run = options['dry_run']
        force = options['force']

        try:
            total_migrated = migrate_organization_revisions(org_id, dry_run, force)
            
            if not dry_run:
                self.stdout.write(
                    self.style.SUCCESS(f'Successfully migrated {total_migrated} items to number-based revisions')
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS(f'Would migrate {total_migrated} items to number-based revisions')
                )
        except ValueError as e:
            raise CommandError(str(e))
        except Exception as e:
            raise CommandError(f'Migration failed: {e}')

