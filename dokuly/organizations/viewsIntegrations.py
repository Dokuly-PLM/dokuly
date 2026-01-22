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
from parts.models import Part
from pcbas.models import Pcba
from assemblies.models import Assembly
from parts.nexar_client import get_nexar_client
from organizations.odoo_service import push_product_to_odoo, test_odoo_connection as test_odoo_connection_service
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
            ),
            
            # Odoo settings
            "odoo_enabled": integration_settings.odoo_enabled,
            "odoo_url": integration_settings.odoo_url or "",
            "odoo_database": integration_settings.odoo_database or "",
            "odoo_username": integration_settings.odoo_username or "",
            "odoo_api_key": "***" if integration_settings.odoo_api_key else "",
            "odoo_auto_push_on_release": integration_settings.odoo_auto_push_on_release,
            "odoo_default_product_category_id": integration_settings.odoo_default_product_category_id,
            "odoo_default_uom_id": integration_settings.odoo_default_uom_id,
            "odoo_default_product_type": integration_settings.odoo_default_product_type or "consu",
            # New Odoo configuration fields
            "odoo_default_sale_ok": integration_settings.odoo_default_sale_ok,
            "odoo_default_purchase_ok": integration_settings.odoo_default_purchase_ok,
            "odoo_default_rent_ok": integration_settings.odoo_default_rent_ok,
            "odoo_default_is_storable": integration_settings.odoo_default_is_storable,
            "odoo_default_tracking": integration_settings.odoo_default_tracking or "none",
            "odoo_category_parts": integration_settings.odoo_category_parts or "Purchased Goods",
            "odoo_category_pcbas": integration_settings.odoo_category_pcbas or "Purchased Goods",
            "odoo_category_assemblies": integration_settings.odoo_category_assemblies or "Manufactured",
            "odoo_update_fields_existing": integration_settings.odoo_update_fields_existing or ["name", "description", "image"],
            "has_odoo_credentials": bool(
                integration_settings.odoo_url and
                integration_settings.odoo_database and
                integration_settings.odoo_username and
                integration_settings.odoo_api_key
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
        
        # Update Odoo settings
        if "odoo_enabled" in data:
            integration_settings.odoo_enabled = bool(data["odoo_enabled"])
        
        if "odoo_url" in data:
            url = data["odoo_url"].strip() if data["odoo_url"] else None
            integration_settings.odoo_url = url
        
        if "odoo_database" in data:
            database = data["odoo_database"].strip() if data["odoo_database"] else None
            integration_settings.odoo_database = database
        
        if "odoo_username" in data:
            username = data["odoo_username"].strip() if data["odoo_username"] else None
            integration_settings.odoo_username = username
        
        if "odoo_api_key" in data:
            # Only update if a new value is provided (not the masked "***")
            api_key = data["odoo_api_key"]
            if api_key and api_key != "***" and api_key.strip():
                integration_settings.odoo_api_key = api_key.strip()
            elif not api_key or api_key == "***":
                # Keep existing key if masked value is provided
                pass
        
        if "odoo_auto_push_on_release" in data:
            integration_settings.odoo_auto_push_on_release = bool(data["odoo_auto_push_on_release"])
        
        if "odoo_default_product_category_id" in data:
            cat_id = data.get("odoo_default_product_category_id")
            integration_settings.odoo_default_product_category_id = cat_id if cat_id else None
        
        if "odoo_default_uom_id" in data:
            uom_id = data.get("odoo_default_uom_id")
            integration_settings.odoo_default_uom_id = uom_id if uom_id else None
        
        if "odoo_default_product_type" in data:
            product_type = data.get("odoo_default_product_type", "consu")
            if product_type in ['consu', 'service', 'combo']:
                integration_settings.odoo_default_product_type = product_type
        
        # Update Odoo default field values
        if "odoo_default_sale_ok" in data:
            integration_settings.odoo_default_sale_ok = bool(data.get("odoo_default_sale_ok", False))
        if "odoo_default_purchase_ok" in data:
            integration_settings.odoo_default_purchase_ok = bool(data.get("odoo_default_purchase_ok", True))
        if "odoo_default_rent_ok" in data:
            integration_settings.odoo_default_rent_ok = bool(data.get("odoo_default_rent_ok", False))
        if "odoo_default_is_storable" in data:
            integration_settings.odoo_default_is_storable = bool(data.get("odoo_default_is_storable", True))
        if "odoo_default_tracking" in data:
            tracking = data.get("odoo_default_tracking", "none")
            if tracking in ['none', 'lot', 'serial']:
                integration_settings.odoo_default_tracking = tracking
        
        # Update category mappings
        if "odoo_category_parts" in data:
            integration_settings.odoo_category_parts = data.get("odoo_category_parts", "Purchased Goods").strip()
        if "odoo_category_pcbas" in data:
            integration_settings.odoo_category_pcbas = data.get("odoo_category_pcbas", "Purchased Goods").strip()
        if "odoo_category_assemblies" in data:
            integration_settings.odoo_category_assemblies = data.get("odoo_category_assemblies", "Manufactured").strip()
        
        # Update fields to update for existing products
        if "odoo_update_fields_existing" in data:
            update_fields = data.get("odoo_update_fields_existing", [])
            if isinstance(update_fields, list):
                # Validate field names
                valid_fields = ['name', 'description', 'image']
                integration_settings.odoo_update_fields_existing = [f for f in update_fields if f in valid_fields]
        
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
            ),
            
            # Odoo settings
            "odoo_enabled": integration_settings.odoo_enabled,
            "odoo_url": integration_settings.odoo_url or "",
            "odoo_database": integration_settings.odoo_database or "",
            "odoo_username": integration_settings.odoo_username or "",
            "odoo_api_key": "***" if integration_settings.odoo_api_key else "",
            "odoo_auto_push_on_release": integration_settings.odoo_auto_push_on_release,
            "odoo_default_product_category_id": integration_settings.odoo_default_product_category_id,
            "odoo_default_uom_id": integration_settings.odoo_default_uom_id,
            "odoo_default_product_type": integration_settings.odoo_default_product_type or "consu",
            # New Odoo configuration fields
            "odoo_default_sale_ok": integration_settings.odoo_default_sale_ok,
            "odoo_default_purchase_ok": integration_settings.odoo_default_purchase_ok,
            "odoo_default_rent_ok": integration_settings.odoo_default_rent_ok,
            "odoo_default_is_storable": integration_settings.odoo_default_is_storable,
            "odoo_default_tracking": integration_settings.odoo_default_tracking or "none",
            "odoo_category_parts": integration_settings.odoo_category_parts or "Purchased Goods",
            "odoo_category_pcbas": integration_settings.odoo_category_pcbas or "Purchased Goods",
            "odoo_category_assemblies": integration_settings.odoo_category_assemblies or "Manufactured",
            "odoo_update_fields_existing": integration_settings.odoo_update_fields_existing or ["name", "description", "image"],
            "has_odoo_credentials": bool(
                integration_settings.odoo_url and
                integration_settings.odoo_database and
                integration_settings.odoo_username and
                integration_settings.odoo_api_key
            )
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
    
    except Exception as e:
        logger.error(f"Error updating integration settings: {e}")
        return Response(
            {"error": "Failed to update integration settings", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@renderer_classes([JSONRenderer])
def get_nexar_sellers(request):
    """
    Get list of available Nexar sellers/distributors from the Octopart API
    
    Returns:
        List of sellers with id and name for dropdown selection
        Based on: https://octopart.com/api/v4/values#sellers
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
        
        # Get integration settings to check for Nexar credentials
        integration_settings, created = IntegrationSettings.objects.get_or_create(
            organization=organization
        )
        
        if not integration_settings.nexar_client_id or not integration_settings.nexar_client_secret:
            return Response(
                {"error": "Nexar API credentials not configured"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Fetch sellers from Nexar API
        try:
            nexar_client = get_nexar_client()
            sellers = nexar_client.get_sellers()
            
            # Transform to format expected by frontend
            sellers_list = [
                {"id": seller_id, "name": seller_name}
                for seller_id, seller_name in sellers.items()
            ]
            
            # Sort by name for better UX
            sellers_list.sort(key=lambda x: x["name"])
            
            return Response(sellers_list, status=status.HTTP_200_OK)
            
        except Exception as e:
            logger.error(f"Error fetching sellers from Nexar API: {e}")
            return Response(
                {"error": "Failed to fetch sellers from Nexar API", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    except Exception as e:
        logger.error(f"Error getting Nexar sellers: {e}")
        return Response(
            {"error": "Failed to get Nexar sellers", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )



@api_view(["POST"])
@renderer_classes([JSONRenderer])
def push_to_odoo(request, item_type, item_id):
    """
    Manually push a part/pcba/assembly to Odoo as a product.
    
    Args:
        item_type: 'parts', 'pcbas', or 'assemblies'
        item_id: ID of the item to push
        
    POST data:
        include_bom (bool, optional): Whether to include BOM for assemblies
        
    Returns:
        Success/error response with Odoo product ID
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
        
        # Get integration settings
        integration_settings, created = IntegrationSettings.objects.get_or_create(
            organization=organization
        )
        
        # Validate Odoo is enabled
        if not integration_settings.odoo_enabled:
            return Response(
                {"error": "Odoo integration is not enabled"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the item based on type
        item = None
        if item_type == 'parts':
            try:
                item = Part.objects.get(id=item_id)
            except Part.DoesNotExist:
                return Response(
                    {"error": f"Part with ID {item_id} not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        elif item_type == 'pcbas':
            try:
                item = Pcba.objects.get(id=item_id)
            except Pcba.DoesNotExist:
                return Response(
                    {"error": f"PCBA with ID {item_id} not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        elif item_type == 'assemblies':
            try:
                item = Assembly.objects.get(id=item_id)
            except Assembly.DoesNotExist:
                return Response(
                    {"error": f"Assembly with ID {item_id} not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
        else:
            return Response(
                {"error": f"Invalid item type: {item_type}"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get include_bom parameter (only relevant for assemblies)
        include_bom = request.data.get('include_bom', False)
        
        # Push to Odoo
        result = push_product_to_odoo(
            item=item,
            item_type=item_type,
            integration_settings=integration_settings,
            user=request.user,
            include_bom=include_bom if item_type == 'assemblies' else False
        )
        
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Error pushing {item_type} {item_id} to Odoo: {e}")
        return Response(
            {"error": "Failed to push to Odoo", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@renderer_classes([JSONRenderer])
def test_odoo_connection(request):
    """
    Test connection to Odoo instance.
    
    Returns:
        Connection status and version information
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
        
        # Get integration settings
        integration_settings, created = IntegrationSettings.objects.get_or_create(
            organization=organization
        )
        
        # Test connection
        result = test_odoo_connection_service(integration_settings)
        
        if result['success']:
            return Response(result, status=status.HTTP_200_OK)
        else:
            return Response(result, status=status.HTTP_400_BAD_REQUEST)
    
    except Exception as e:
        logger.error(f"Error testing Odoo connection: {e}")
        return Response(
            {"error": "Failed to test Odoo connection", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
