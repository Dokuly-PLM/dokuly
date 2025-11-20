from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from profiles.models import Profile
from .models import Organization, Rules
from .serializers import RulesSerializer


def check_bom_items_released(bom_items):
    """
    Check if all BOM items have released parts, assemblies, or PCBAs.
    Uses database queries for efficiency.
    
    Args:
        bom_items: QuerySet of Bom_item objects
        
    Returns:
        tuple: (all_passed: bool, unreleased_items: list, total_count: int, released_count: int)
    """
    total_count = bom_items.count()
    
    # Query for unreleased items - items where the related part/assembly/pcba exists and is NOT released
    unreleased_bom_items = bom_items.filter(
        Q(part__isnull=False) & ~Q(part__release_state='Released') |
        Q(assembly__isnull=False) & ~Q(assembly__release_state='Released') |
        Q(pcba__isnull=False) & ~Q(pcba__release_state='Released')
    ).select_related('part', 'assembly', 'pcba')
    
    # Build the unreleased items list
    unreleased_items = []
    for bom_item in unreleased_bom_items:
        if bom_item.part and bom_item.part.release_state != 'Released':
            unreleased_items.append({
                'type': 'Part',
                'part_number': bom_item.part.full_part_number,
                'display_name': bom_item.part.display_name,
            })
        elif bom_item.assembly and bom_item.assembly.release_state != 'Released':
            unreleased_items.append({
                'type': 'Assembly',
                'part_number': bom_item.assembly.full_part_number,
                'display_name': bom_item.assembly.display_name,
            })
        elif bom_item.pcba and bom_item.pcba.release_state != 'Released':
            unreleased_items.append({
                'type': 'PCBA',
                'part_number': bom_item.pcba.full_part_number,
                'display_name': bom_item.pcba.display_name,
            })
    
    released_count = total_count - len(unreleased_items)
    all_passed = len(unreleased_items) == 0
    
    return all_passed, unreleased_items, total_count, released_count


def get_rules_for_item(user, project=None):
    """
    Get rules for an item, checking project first, then organization.
    
    Args:
        user: The requesting user
        project: Optional project object
        
    Returns:
        Rules object or None
    """
    # Check for project-specific rules first
    if project and hasattr(project, 'release_rules'):
        return project.release_rules
    
    # Fall back to organization rules
    user_profile = get_object_or_404(Profile, user=user)
    org_id = user_profile.organization_id
    
    if org_id:
        organization = get_object_or_404(Organization, id=org_id)
        try:
            return Rules.objects.get(organization=organization)
        except Rules.DoesNotExist:
            return None
    
    return None


def user_can_override(user, rules):
    """
    Check if user has permission to override release rules.
    
    Args:
        user: The requesting user
        rules: Rules object
        
    Returns:
        Boolean indicating if user can override
    """
    if not rules:
        return True
    
    user_profile = get_object_or_404(Profile, user=user)
    
    # Map permission levels to role checks
    permission = rules.override_permission
    
    if permission == 'User':
        return True  # All users can override
    
    if permission == 'Project Owner':
        # TODO: Check if user is project owner
        # For now, allow if Admin or Owner
        return user_profile.role in ['Admin', 'Owner']
    
    if permission == 'Admin':
        return user_profile.role in ['Admin', 'Owner']
    
    if permission == 'Owner':
        return user_profile.role == 'Owner'
    
    return False


@api_view(["GET"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def fetch_organization_rules(request):
    """Fetch release rules for the user's organization."""
    try:
        user_profile = get_object_or_404(Profile, user=request.user)
        org_id = user_profile.organization_id
        
        if org_id is None:
            return Response(
                "No connected organization found", status=status.HTTP_204_NO_CONTENT
            )
        
        organization = get_object_or_404(Organization, id=org_id)
        
        # Get or create rules for this organization
        rules, created = Rules.objects.get_or_create(
            organization=organization,
            defaults={
                'require_released_bom_items_assembly': False,
                'require_released_bom_items_pcba': False,
                'override_permission': 'Admin',
            }
        )
        
        serializer = RulesSerializer(rules)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Profile.DoesNotExist:
        return Response("User profile not found", status=status.HTTP_404_NOT_FOUND)
    except Organization.DoesNotExist:
        return Response("Organization not found", status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def update_organization_rules(request):
    """Update release rules for the user's organization."""
    try:
        user_profile = get_object_or_404(Profile, user=request.user)
        org_id = user_profile.organization_id
        
        if org_id is None:
            return Response(
                "No connected organization found", status=status.HTTP_204_NO_CONTENT
            )
        
        organization = get_object_or_404(Organization, id=org_id)
        
        # Get or create rules for this organization
        rules, created = Rules.objects.get_or_create(
            organization=organization,
            defaults={
                'require_released_bom_items_assembly': False,
                'require_released_bom_items_pcba': False,
                'override_permission': 'Admin',
            }
        )
        
        data = request.data
        
        # Update fields if provided
        if 'require_released_bom_items_assembly' in data:
            rules.require_released_bom_items_assembly = data['require_released_bom_items_assembly']
        
        if 'require_released_bom_items_pcba' in data:
            rules.require_released_bom_items_pcba = data['require_released_bom_items_pcba']
        
        if 'override_permission' in data:
            # Validate permission choice
            valid_permissions = ['Owner', 'Admin', 'Project Owner', 'User']
            if data['override_permission'] in valid_permissions:
                rules.override_permission = data['override_permission']
            else:
                return Response(
                    f"Invalid override_permission. Must be one of: {', '.join(valid_permissions)}",
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        rules.save()
        
        serializer = RulesSerializer(rules)
        return Response(serializer.data, status=status.HTTP_200_OK)
        
    except Profile.DoesNotExist:
        return Response("User profile not found", status=status.HTTP_404_NOT_FOUND)
    except Organization.DoesNotExist:
        return Response("Organization not found", status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def check_assembly_rules(request, assembly_id):
    """Check if an assembly meets release rules requirements."""
    try:
        from assemblies.models import Assembly
        from projects.models import Project
        from assembly_bom.models import Assembly_bom, Bom_item
        
        assembly = get_object_or_404(Assembly, id=assembly_id)
        
        # Get project from query params or assembly
        project_id = request.GET.get('project_id')
        project = None
        if project_id:
            project = get_object_or_404(Project, id=project_id)
        elif assembly.project:
            project = assembly.project
        
        # Get applicable rules
        rules = get_rules_for_item(request.user, project)
        
        if not rules or not rules.require_released_bom_items_assembly:
            return Response({
                'has_active_rules': False,
                'all_rules_passed': True,
                'rules_checks': [],
            }, status=status.HTTP_200_OK)
        
        # Get the BOM for this assembly
        try:
            assembly_bom = Assembly_bom.objects.get(assembly_id=assembly_id)
            bom_items = Bom_item.objects.filter(bom=assembly_bom)
        except Assembly_bom.DoesNotExist:
            # No BOM exists yet - no items to check
            return Response({
                'has_active_rules': True,
                'all_rules_passed': True,
                'override_permission': rules.override_permission,
                'rules_checks': [{
                    'rule': 'require_released_bom_items_assembly',
                    'description': 'No BOM found for this assembly',
                    'passed': True,
                    'unreleased_items': [],
                }],
            }, status=status.HTTP_200_OK)
        
        # Check if all BOM items are released
        all_passed, unreleased_items, total_count, released_count = check_bom_items_released(bom_items)
        
        return Response({
            'has_active_rules': True,
            'all_rules_passed': all_passed,
            'override_permission': rules.override_permission,
            'rules_checks': [{
                'rule': 'require_released_bom_items_assembly',
                'description': f'All BOM items must be released ({released_count}/{total_count} released)',
                'passed': all_passed,
                'unreleased_items': unreleased_items,
            }],
        }, status=status.HTTP_200_OK)
        
    except Assembly.DoesNotExist:
        return Response("Assembly not found", status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def check_pcba_rules(request, pcba_id):
    """Check if a PCBA meets release rules requirements."""
    try:
        from pcbas.models import Pcba
        from projects.models import Project
        from assembly_bom.models import Assembly_bom, Bom_item
        
        pcba = get_object_or_404(Pcba, id=pcba_id)
        
        # Get project from query params or pcba
        project_id = request.GET.get('project_id')
        project = None
        if project_id:
            project = get_object_or_404(Project, id=project_id)
        elif pcba.project:
            project = pcba.project
        
        # Get applicable rules
        rules = get_rules_for_item(request.user, project)
        
        if not rules or not rules.require_released_bom_items_pcba:
            return Response({
                'has_active_rules': False,
                'all_rules_passed': True,
                'rules_checks': [],
            }, status=status.HTTP_200_OK)
        
        # Get the BOM for this PCBA
        try:
            pcba_bom = Assembly_bom.objects.get(pcba=pcba)
            bom_items = Bom_item.objects.filter(bom=pcba_bom)
        except Assembly_bom.DoesNotExist:
            # No BOM exists yet - no items to check
            return Response({
                'has_active_rules': True,
                'all_rules_passed': True,
                'override_permission': rules.override_permission,
                'rules_checks': [{
                    'rule': 'require_released_bom_items_pcba',
                    'description': 'No BOM found for this PCBA',
                    'passed': True,
                    'unreleased_items': [],
                }],
            }, status=status.HTTP_200_OK)
        
        # Check if all BOM items are released
        all_passed, unreleased_items, total_count, released_count = check_bom_items_released(bom_items)
        
        return Response({
            'has_active_rules': True,
            'all_rules_passed': all_passed,
            'override_permission': rules.override_permission,
            'rules_checks': [{
                'rule': 'require_released_bom_items_pcba',
                'description': f'All BOM items must be released ({released_count}/{total_count} released)',
                'passed': all_passed,
                'unreleased_items': unreleased_items,
            }],
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def check_part_rules(request, part_id):
    """Check if a part meets release rules requirements. Placeholder for future rules."""
    try:
        from parts.models import Part
        
        part = get_object_or_404(Part, id=part_id)
        
        # Placeholder - no part-specific rules yet
        return Response({
            'has_active_rules': False,
            'all_rules_passed': True,
            'rules_checks': [],
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def check_document_rules(request, document_id):
    """Check if a document meets release rules requirements. Placeholder for future rules."""
    try:
        from documents.models import Document
        
        document = get_object_or_404(Document, id=document_id)
        
        # Placeholder - no document-specific rules yet
        return Response({
            'has_active_rules': False,
            'all_rules_passed': True,
            'rules_checks': [],
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)
