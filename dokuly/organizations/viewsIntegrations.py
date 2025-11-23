"""
Views for Integration Settings API
Handles DigiKey, Nexar, and other integration configurations
"""

import logging
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework import status
from django.shortcuts import get_object_or_404
from profiles.models import Profile
from purchasing.suppliermodel import Supplier
from customers.views import next_customer_supplier_number
from .models import Organization, IntegrationSettings

logger = logging.getLogger(__name__)


def get_user_organization(user):
    """Get organization for the current user"""
    try:
        profile = Profile.objects.get(user=user)
        if profile.organization_id and profile.organization_id != -1:
            return Organization.objects.get(id=profile.organization_id)
        return None
    except (Profile.DoesNotExist, Organization.DoesNotExist):
        return None


@api_view(["GET"])
@renderer_classes([JSONRenderer])
def get_integration_settings(request):
    """
    Get integration settings for the current user's organization
    
    Returns:
        Integration settings including DigiKey credentials and field mappings
    """
    try:
        if not request.user or not request.user.is_authenticated:
            return Response(
                "Not Authorized",
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        organization = get_user_organization(request.user)
        if not organization:
            return Response(
                {"error": "User organization not found"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create integration settings
        integration_settings, created = IntegrationSettings.objects.get_or_create(
            organization=organization
        )
        
        # Return settings (don't expose full client_secret for security)
        response_data = {
            "id": integration_settings.id,
            "digikey_client_id": integration_settings.digikey_client_id or "",
            "digikey_client_secret": "***" if integration_settings.digikey_client_secret else "",
            "digikey_locale_site": integration_settings.digikey_locale_site or "US",
            "digikey_locale_currency": integration_settings.digikey_locale_currency or "USD",
            "digikey_locale_language": integration_settings.digikey_locale_language or "en",
            "digikey_field_mapping": integration_settings.digikey_field_mapping or {},
            "digikey_supplier_id": integration_settings.digikey_supplier.id if integration_settings.digikey_supplier else None,
            "has_digikey_credentials": bool(
                integration_settings.digikey_client_id and 
                integration_settings.digikey_client_secret
            ),

            
            "nexar_client_id": integration_settings.nexar_client_id or "",
            "nexar_client_secret": "***" if integration_settings.nexar_client_secret else "",
            "has_nexar_credentials": bool(
                integration_settings.nexar_client_id and 
                integration_settings.nexar_client_secret
            )
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error getting integration settings: {e}")
        return Response(
            {"error": "Failed to get integration settings", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["PUT"])
@renderer_classes([JSONRenderer])
def update_integration_settings(request):
    """
    Update integration settings for the current user's organization
    
    PUT data:
        digikey_client_id (str, optional): DigiKey API client ID
        digikey_client_secret (str, optional): DigiKey API client secret
        digikey_field_mapping (dict, optional): Field mapping configuration
            Example: {"rohs": "is_rohs_compliant", "ul": "is_ul_compliant", "datasheet": "datasheet"}
    
    Returns:
        Updated integration settings
    """
    try:
        if not request.user or not request.user.is_authenticated:
            return Response(
                "Not Authorized",
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        organization = get_user_organization(request.user)
        if not organization:
            return Response(
                {"error": "User organization not found"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get or create integration settings
        integration_settings, created = IntegrationSettings.objects.get_or_create(
            organization=organization
        )
        
        data = request.data
        
        # Update DigiKey credentials
        if "digikey_client_id" in data:
            client_id = data["digikey_client_id"].strip() if data["digikey_client_id"] else None
            integration_settings.digikey_client_id = client_id
        
        if "digikey_client_secret" in data:
            # Only update if a new value is provided (not the masked "***")
            client_secret = data["digikey_client_secret"]
            if client_secret and client_secret != "***" and client_secret.strip():
                integration_settings.digikey_client_secret = client_secret.strip()
            elif not client_secret or client_secret == "***":
                # Keep existing secret if masked value is provided
                pass
        
        # Update locale settings
        if "digikey_locale_site" in data:
            integration_settings.digikey_locale_site = (data["digikey_locale_site"] or "US").strip()
        
        if "digikey_locale_currency" in data:
            integration_settings.digikey_locale_currency = (data["digikey_locale_currency"] or "USD").strip()
        
        if "digikey_locale_language" in data:
            integration_settings.digikey_locale_language = (data["digikey_locale_language"] or "en").strip()
        
        # Update field mapping
        if "digikey_field_mapping" in data:
            if isinstance(data["digikey_field_mapping"], dict):
                integration_settings.digikey_field_mapping = data["digikey_field_mapping"]
            else:
                return Response(
                    {"error": "digikey_field_mapping must be a dictionary"},
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Update supplier selection
        if "digikey_supplier_id" in data:
            supplier_id = data.get("digikey_supplier_id")
            if supplier_id:
                try:
                    supplier = Supplier.objects.get(id=supplier_id)
                    integration_settings.digikey_supplier = supplier
                except Supplier.DoesNotExist:
                    logger.warning(f"Supplier with id {supplier_id} not found")
                    integration_settings.digikey_supplier = None
            else:
                integration_settings.digikey_supplier = None
        
        # Update Nexar credentials
        if "nexar_client_id" in data:
            client_id = data["nexar_client_id"].strip() if data["nexar_client_id"] else None
            integration_settings.nexar_client_id = client_id
        
        if "nexar_client_secret" in data:
            # Only update if a new value is provided (not the masked "***")
            client_secret = data["nexar_client_secret"]
            if client_secret and client_secret != "***" and client_secret.strip():
                integration_settings.nexar_client_secret = client_secret.strip()
            elif not client_secret or client_secret == "***":
                # Keep existing secret if masked value is provided
                pass
        
        integration_settings.save()
        
        # Return updated settings
        response_data = {
            "id": integration_settings.id,
            "digikey_client_id": integration_settings.digikey_client_id or "",
            "digikey_client_secret": "***" if integration_settings.digikey_client_secret else "",
            "digikey_locale_site": integration_settings.digikey_locale_site or "US",
            "digikey_locale_currency": integration_settings.digikey_locale_currency or "USD",
            "digikey_locale_language": integration_settings.digikey_locale_language or "en",
            "digikey_field_mapping": integration_settings.digikey_field_mapping or {},
            "digikey_supplier_id": integration_settings.digikey_supplier.id if integration_settings.digikey_supplier else None,
            "has_digikey_credentials": bool(
                integration_settings.digikey_client_id and 
                integration_settings.digikey_client_secret
            ),
            "nexar_client_id": integration_settings.nexar_client_id or "",
            "nexar_client_secret": "***" if integration_settings.nexar_client_secret else "",
            "has_nexar_credentials": bool(
                integration_settings.nexar_client_id and 
                integration_settings.nexar_client_secret
            )
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error updating integration settings: {e}")
        return Response(
            {"error": "Failed to update integration settings", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

