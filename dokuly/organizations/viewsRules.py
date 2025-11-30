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

from assemblies.models import Assembly
from documents.models import Document
from parts.models import Part
from pcbas.models import Pcba
from projects.models import Project
from assembly_bom.models import Assembly_bom, Bom_item
from eco.models import AffectedItem


def check_item_affected_by_unreleased_eco(item_type, item_id):
    """
    Check if an item is affected by an unreleased ECO.
    Items affected by an unreleased ECO can only be set to Review state, not Released.
    
    Args:
        item_type: One of 'part', 'pcba', 'assembly', 'document'
        item_id: The ID of the item
        
    Returns:
        tuple: (is_affected: bool, eco_info: dict or None)
            eco_info contains 'id', 'display_name' if affected
    """
    
    # Build filter for the specific item type
    filter_kwargs = {f'{item_type}_id': item_id}
    
    # Find affected items where the ECO is not released
    affected_items = AffectedItem.objects.filter(
        **filter_kwargs
    ).select_related('eco').exclude(
        eco__release_state='Released'
    )
    
    if affected_items.exists():
        eco = affected_items.first().eco
        return True, {
            'id': eco.id,
            'display_name': eco.display_name or f'ECO{eco.id}',
            'release_state': eco.release_state,
        }
    
    return False, None


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


def user_can_override(user, rules, project=None):
    """
    Check if user has permission to override release rules.
    
    Args:
        user: The requesting user
        rules: Rules object
        project: Optional project object to check project ownership
        
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
        # Check if user is project owner for this specific project
        if project and project.project_owner:
            if project.project_owner.id == user_profile.id:
                return True
        # Also allow if Admin or Owner
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
                'require_review_on_part': False,
                'require_review_on_pcba': False,
                'require_review_on_assembly': False,
                'require_review_on_document': False,
                'require_review_on_eco': False,
                'require_all_affected_items_reviewed_for_eco': False,
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
                'require_review_on_part': False,
                'require_review_on_pcba': False,
                'require_review_on_assembly': False,
                'require_review_on_document': False,
                'require_review_on_eco': False,
                'require_all_affected_items_reviewed_for_eco': False,
                'override_permission': 'Admin',
            }
        )
        
        data = request.data
        
        # Update fields if provided
        if 'require_released_bom_items_assembly' in data:
            rules.require_released_bom_items_assembly = data['require_released_bom_items_assembly']
        
        if 'require_released_bom_items_pcba' in data:
            rules.require_released_bom_items_pcba = data['require_released_bom_items_pcba']
        
        if 'require_review_on_part' in data:
            rules.require_review_on_part = data['require_review_on_part']
        
        if 'require_review_on_pcba' in data:
            rules.require_review_on_pcba = data['require_review_on_pcba']
        
        if 'require_review_on_assembly' in data:
            rules.require_review_on_assembly = data['require_review_on_assembly']
        
        if 'require_review_on_document' in data:
            rules.require_review_on_document = data['require_review_on_document']
        
        if 'require_review_on_eco' in data:
            rules.require_review_on_eco = data['require_review_on_eco']
        
        if 'require_all_affected_items_reviewed_for_eco' in data:
            rules.require_all_affected_items_reviewed_for_eco = data['require_all_affected_items_reviewed_for_eco']
        
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
        
        rules_checks = []
        all_passed = True
        
        # Check if assembly is affected by an unreleased ECO
        is_eco_affected, eco_info = check_item_affected_by_unreleased_eco('assembly', assembly_id)
        if is_eco_affected:
            all_passed = False
            rules_checks.append({
                'rule': 'eco_affected_item',
                'description': f'Assembly is affected by unreleased ECO: {eco_info["display_name"]}. Release the ECO to release this item.',
                'passed': False,
                'eco': eco_info,
            })
        
        # Check review requirement
        if rules and rules.require_review_on_assembly:
            is_reviewed = assembly.quality_assurance is not None
            if not is_reviewed:
                all_passed = False
            rules_checks.append({
                'rule': 'require_review_on_assembly',
                'description': 'Assembly must be reviewed before release',
                'passed': is_reviewed,
            })
        
        # Check BOM items if required
        if rules and rules.require_released_bom_items_assembly:
            try:
                assembly_bom = Assembly_bom.objects.get(assembly_id=assembly_id)
                bom_items = Bom_item.objects.filter(bom=assembly_bom)
                bom_passed, unreleased_items, total_count, released_count = check_bom_items_released(bom_items)
                if not bom_passed:
                    all_passed = False
                rules_checks.append({
                    'rule': 'require_released_bom_items_assembly',
                    'description': f'All BOM items must be released ({released_count}/{total_count} released)',
                    'passed': bom_passed,
                    'unreleased_items': unreleased_items,
                })
            except Assembly_bom.DoesNotExist:
                # No BOM - this passes the BOM check
                rules_checks.append({
                    'rule': 'require_released_bom_items_assembly',
                    'description': 'No BOM found for this assembly',
                    'passed': True,
                    'unreleased_items': [],
                })
        
        has_active_rules = len(rules_checks) > 0
        
        if not has_active_rules:
            return Response({
                'has_active_rules': False,
                'all_rules_passed': True,
                'rules_checks': [],
            }, status=status.HTTP_200_OK)
        
        return Response({
            'has_active_rules': True,
            'all_rules_passed': all_passed,
            'override_permission': rules.override_permission if rules else 'Admin',
            'can_override': user_can_override(request.user, rules, project) if rules else False,
            'rules_checks': rules_checks,
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
        
        rules_checks = []
        all_passed = True
        
        # Check if PCBA is affected by an unreleased ECO
        is_eco_affected, eco_info = check_item_affected_by_unreleased_eco('pcba', pcba_id)
        if is_eco_affected:
            all_passed = False
            rules_checks.append({
                'rule': 'eco_affected_item',
                'description': f'PCBA is affected by unreleased ECO: {eco_info["display_name"]}. Release the ECO to release this item.',
                'passed': False,
                'eco': eco_info,
            })
        
        # Check review requirement
        if rules and rules.require_review_on_pcba:
            is_reviewed = pcba.quality_assurance is not None
            if not is_reviewed:
                all_passed = False
            rules_checks.append({
                'rule': 'require_review_on_pcba',
                'description': 'PCBA must be reviewed before release',
                'passed': is_reviewed,
            })
        
        # Check BOM items if required
        if rules and rules.require_released_bom_items_pcba:
            try:
                pcba_bom = Assembly_bom.objects.get(pcba=pcba)
                bom_items = Bom_item.objects.filter(bom=pcba_bom)
                bom_passed, unreleased_items, total_count, released_count = check_bom_items_released(bom_items)
                if not bom_passed:
                    all_passed = False
                rules_checks.append({
                    'rule': 'require_released_bom_items_pcba',
                    'description': f'All BOM items must be released ({released_count}/{total_count} released)',
                    'passed': bom_passed,
                    'unreleased_items': unreleased_items,
                })
            except Assembly_bom.DoesNotExist:
                # No BOM - this passes the BOM check
                rules_checks.append({
                    'rule': 'require_released_bom_items_pcba',
                    'description': 'No BOM found for this PCBA',
                    'passed': True,
                    'unreleased_items': [],
                })
        
        has_active_rules = len(rules_checks) > 0
        
        if not has_active_rules:
            return Response({
                'has_active_rules': False,
                'all_rules_passed': True,
                'rules_checks': [],
            }, status=status.HTTP_200_OK)
        
        return Response({
            'has_active_rules': True,
            'all_rules_passed': all_passed,
            'override_permission': rules.override_permission if rules else 'Admin',
            'can_override': user_can_override(request.user, rules, project) if rules else False,
            'rules_checks': rules_checks,
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def check_part_rules(request, part_id):
    """Check if a part meets release rules requirements."""
    try:     
        part = get_object_or_404(Part, id=part_id)
        
        # Get project from query params or part
        project_id = request.GET.get('project_id')
        project = None
        if project_id:
            project = get_object_or_404(Project, id=project_id)
        elif part.project:
            project = part.project
        
        # Get applicable rules
        rules = get_rules_for_item(request.user, project)
        
        rules_checks = []
        all_passed = True
        
        # Check if part is affected by an unreleased ECO
        is_eco_affected, eco_info = check_item_affected_by_unreleased_eco('part', part_id)
        if is_eco_affected:
            all_passed = False
            rules_checks.append({
                'rule': 'eco_affected_item',
                'description': f'Part is affected by unreleased ECO: {eco_info["display_name"]}. Release the ECO to release this item.',
                'passed': False,
                'eco': eco_info,
            })
        
        # Check review requirement if rules exist
        if rules and rules.require_review_on_part:
            is_reviewed = part.quality_assurance is not None
            if not is_reviewed:
                all_passed = False
            rules_checks.append({
                'rule': 'require_review_on_part',
                'description': 'Part must be reviewed before release',
                'passed': is_reviewed,
            })
        
        has_active_rules = len(rules_checks) > 0
        
        if not has_active_rules:
            return Response({
                'has_active_rules': False,
                'all_rules_passed': True,
                'rules_checks': [],
            }, status=status.HTTP_200_OK)
        
        return Response({
            'has_active_rules': True,
            'all_rules_passed': all_passed,
            'override_permission': rules.override_permission if rules else 'Admin',
            'can_override': user_can_override(request.user, rules, project) if rules else False,
            'rules_checks': rules_checks,
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def check_document_rules(request, document_id):
    """Check if a document meets release rules requirements."""
    try:
        document = get_object_or_404(Document, id=document_id)
        
        # Get project from query params or document
        project_id = request.GET.get('project_id')
        project = None
        if project_id:
            project = get_object_or_404(Project, id=project_id)
        elif document.project:
            project = document.project
        
        # Get applicable rules
        rules = get_rules_for_item(request.user, project)
        
        rules_checks = []
        all_passed = True
        
        # Check if document is affected by an unreleased ECO
        is_eco_affected, eco_info = check_item_affected_by_unreleased_eco('document', document_id)
        if is_eco_affected:
            all_passed = False
            rules_checks.append({
                'rule': 'eco_affected_item',
                'description': f'Document is affected by unreleased ECO: {eco_info["display_name"]}. Release the ECO to release this item.',
                'passed': False,
                'eco': eco_info,
            })
        
        # Check review requirement if rules exist
        if rules and rules.require_review_on_document:
            is_reviewed = document.quality_assurance is not None
            if not is_reviewed:
                all_passed = False
            rules_checks.append({
                'rule': 'require_review_on_document',
                'description': 'Document must be reviewed before release',
                'passed': is_reviewed,
            })
        
        has_active_rules = len(rules_checks) > 0
        
        if not has_active_rules:
            return Response({
                'has_active_rules': False,
                'all_rules_passed': True,
                'rules_checks': [],
            }, status=status.HTTP_200_OK)
        
        return Response({
            'has_active_rules': True,
            'all_rules_passed': all_passed,
            'override_permission': rules.override_permission if rules else 'Admin',
            'can_override': user_can_override(request.user, rules, project) if rules else False,
            'rules_checks': rules_checks,
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def check_eco_rules(request, eco_id):
    """Check if an ECO meets release rules requirements."""
    from eco.models import Eco
    
    try:
        eco = get_object_or_404(Eco, id=eco_id)
        
        # Get project from query params or ECO
        project_id = request.GET.get('project_id')
        project = None
        if project_id:
            project = get_object_or_404(Project, id=project_id)
        elif eco.project:
            project = eco.project
        
        # Get applicable rules
        rules = get_rules_for_item(request.user, project)
        
        rules_checks = []
        all_passed = True
        
        # Check review requirement on the ECO itself
        if rules and rules.require_review_on_eco:
            is_reviewed = eco.quality_assurance is not None
            if not is_reviewed:
                all_passed = False
            rules_checks.append({
                'rule': 'require_review_on_eco',
                'description': 'ECO must be reviewed before release',
                'passed': is_reviewed,
            })
        
        # Check if all affected items are reviewed
        if rules and rules.require_all_affected_items_reviewed_for_eco:
            affected_items = AffectedItem.objects.filter(eco=eco)
            
            unreviewed_items = []
            total_items = 0
            reviewed_count = 0
            
            for affected_item in affected_items:
                # Get the linked item
                linked_item = affected_item.part or affected_item.pcba or affected_item.assembly or affected_item.document
                if linked_item:
                    total_items += 1
                    is_item_reviewed = hasattr(linked_item, 'quality_assurance') and linked_item.quality_assurance is not None
                    if is_item_reviewed:
                        reviewed_count += 1
                    else:
                        item_type = 'Part' if affected_item.part else 'PCBA' if affected_item.pcba else 'Assembly' if affected_item.assembly else 'Document'
                        part_number = getattr(linked_item, 'full_part_number', None) or getattr(linked_item, 'full_doc_number', None) or str(linked_item.id)
                        unreviewed_items.append({
                            'type': item_type,
                            'part_number': part_number,
                            'display_name': getattr(linked_item, 'display_name', None) or getattr(linked_item, 'title', ''),
                        })
            
            items_passed = len(unreviewed_items) == 0
            if not items_passed:
                all_passed = False
            
            rules_checks.append({
                'rule': 'require_all_affected_items_reviewed_for_eco',
                'description': 'All affected items must be reviewed before releasing ECO',
                'passed': items_passed,
                'total': total_items,
                'reviewed': reviewed_count,
                'unreviewed_items': unreviewed_items[:10],  # Limit to first 10 for display
            })
        
        has_active_rules = len(rules_checks) > 0
        
        if not has_active_rules:
            return Response({
                'has_active_rules': False,
                'all_rules_passed': True,
                'rules_checks': [],
            }, status=status.HTTP_200_OK)
        
        return Response({
            'has_active_rules': True,
            'all_rules_passed': all_passed,
            'override_permission': rules.override_permission if rules else 'Admin',
            'can_override': user_can_override(request.user, rules, project) if rules else False,
            'rules_checks': rules_checks,
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)