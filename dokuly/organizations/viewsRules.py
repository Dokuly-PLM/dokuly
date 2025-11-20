from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.contrib.auth.decorators import login_required
from profiles.models import Profile
from .models import Organization, Rules
from .serializers import RulesSerializer


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
