"""
Views for DigiKey API integration
"""

import hashlib
import logging
import requests
from datetime import datetime, timezone
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache
from profiles.models import Profile
from organizations.models import Organization

from parts.digikey_client import get_digikey_client, is_digikey_configured

logger = logging.getLogger(__name__)

# Cache duration: 1 day in seconds
CACHE_DURATION = 24 * 60 * 60  # 86,400 seconds


def get_user_organization(user):
    """Get organization for the current user"""
    try:
        profile = Profile.objects.get(user=user)
        if profile.organization_id and profile.organization_id != -1:
            return Organization.objects.get(id=profile.organization_id)
        return None
    except (Profile.DoesNotExist, Organization.DoesNotExist):
        return None


@api_view(["POST"])
@renderer_classes([JSONRenderer])
def search_digikey_parts(request):
    """
    Search for parts using DigiKey API keyword search
    
    POST data:
        keyword (str): Search keyword or MPN
        limit (int, optional): Maximum number of results (default: 10)
    
    Returns:
        List of part data from DigiKey with caching
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
        
        data = request.data
        keyword = data.get("keyword", "").strip() or data.get("mpn", "").strip()
        limit = data.get("limit", 10)
        force_refresh = data.get("force_refresh", False)  # Allow bypassing cache for debugging
        
        if not keyword:
            return Response(
                {"error": "keyword or mpn parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create cache key based on keyword and limit (case-insensitive)
        cache_key = f'digikey_search_{hashlib.md5(f"{keyword.lower()}_{limit}".encode()).hexdigest()}'
        
        # Try to get cached results first (unless force_refresh is True)
        if not force_refresh:
            cached_results = cache.get(cache_key)
            if cached_results is not None:
                logger.debug(f"Returning cached DigiKey results for keyword: {keyword}")
                return Response({
                    "results": cached_results,
                    "cached": True,
                    "keyword": keyword
                }, status=status.HTTP_200_OK)
        else:
            # Clear cache if force_refresh is requested
            cache.delete(cache_key)
            logger.debug(f"Cache cleared for DigiKey search: {keyword}. Making fresh API call...")
        
        # No cache or force_refresh, query DigiKey API
        logger.debug(f"Making fresh DigiKey API call for keyword: {keyword}")
        
        try:
            digikey_client = get_digikey_client(organization)
            if not digikey_client:
                return Response(
                    {"error": "DigiKey API credentials not configured"},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            results = digikey_client.keyword_search(keyword, limit=limit)
            
            # Cache the results
            cache.set(cache_key, results, CACHE_DURATION)
            
            return Response({
                "results": results,
                "cached": False,
                "keyword": keyword
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            # Missing credentials
            logger.error(f"DigiKey credentials error: {e}")
            return Response(
                {"error": "DigiKey API credentials not configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except requests.exceptions.HTTPError as e:
            # HTTP error (like 404, 401, etc.)
            error_details = str(e)
            if e.response is not None:
                try:
                    error_body = e.response.json()
                    error_details = error_body.get('ErrorMessage', error_body.get('error', str(e)))
                except:
                    error_details = e.response.text or str(e)
            logger.error(f"DigiKey API HTTP error: {e.response.status_code if e.response else 'unknown'} - {error_details}")
            return Response(
                {"error": "Failed to search DigiKey API", "details": error_details, "status_code": e.response.status_code if e.response else None},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            # API error
            logger.error(f"DigiKey API error: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return Response(
                {"error": "Failed to search DigiKey API", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    except Exception as e:
        logger.error(f"Unexpected error in search_digikey_parts: {e}")
        return Response(
            {"error": "An unexpected error occurred", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@renderer_classes([JSONRenderer])
def get_digikey_product_details(request):
    """
    Get detailed product information from DigiKey API
    
    POST data:
        digikey_part_number (str): DigiKey part number
        or
        product_id (str): Product ID from search results
    
    Returns:
        Detailed product information with specifications
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
        
        data = request.data
        digikey_part_number = data.get("digikey_part_number", "").strip() or data.get("product_id", "").strip()
        
        if not digikey_part_number:
            return Response(
                {"error": "digikey_part_number or product_id parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create cache key based on part number (case-insensitive)
        cache_key = f'digikey_details_{hashlib.md5(digikey_part_number.lower().encode()).hexdigest()}'
        
        # Check if force_refresh is requested
        force_refresh = data.get("force_refresh", False)
        
        # Try to get cached results first (unless force_refresh is True)
        if not force_refresh:
            cached_result = cache.get(cache_key)
            if cached_result is not None:
                logger.debug(f"Returning cached DigiKey product details for: {digikey_part_number}")
                return Response({
                    "result": cached_result,
                    "cached": True,
                    "digikey_part_number": digikey_part_number
                }, status=status.HTTP_200_OK)
        else:
            # Clear cache if force_refresh is requested
            cache.delete(cache_key)
            logger.debug(f"Cache cleared for DigiKey product details: {digikey_part_number}. Making fresh API call...")
        
        # No cache, query DigiKey API
        try:
            digikey_client = get_digikey_client(organization)
            if not digikey_client:
                return Response(
                    {"error": "DigiKey API credentials not configured"},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            result = digikey_client.get_product_details(digikey_part_number)
            
            if not result:
                return Response(
                    {"error": "Product not found"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Cache the result
            cache.set(cache_key, result, CACHE_DURATION)
            
            return Response({
                "result": result,
                "cached": False,
                "digikey_part_number": digikey_part_number
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            # Missing credentials
            logger.error(f"DigiKey credentials error: {e}")
            return Response(
                {"error": "DigiKey API credentials not configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            # API error
            logger.error(f"DigiKey API error: {e}")
            return Response(
                {"error": "Failed to get DigiKey product details", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    except Exception as e:
        logger.error(f"Unexpected error in get_digikey_product_details: {e}")
        return Response(
            {"error": "An unexpected error occurred", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@renderer_classes([JSONRenderer])
def refresh_digikey_stock(request, part_id):
    """
    Refresh DigiKey stock quantity for a specific part
    
    POST data:
        None (uses digikey_part_number from part's part_information)
    
    Returns:
        Updated stock quantity and sync timestamp
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
        
        # Get the part
        from parts.models import Part
        try:
            part = Part.objects.get(id=part_id)
        except Part.DoesNotExist:
            return Response(
                {"error": "Part not found"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Check if part is from DigiKey
        part_information = part.part_information or {}
        if part_information.get("source") != "digikey":
            return Response(
                {"error": "Part is not from DigiKey"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        digikey_part_number = part_information.get("digikey_part_number") or part_information.get("digikey_product_id")
        if not digikey_part_number:
            return Response(
                {"error": "DigiKey part number not found in part information"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Fetch fresh stock data from DigiKey (force refresh)
        try:
            digikey_client = get_digikey_client(organization)
            if not digikey_client:
                return Response(
                    {"error": "DigiKey API credentials not configured"},
                    status=status.HTTP_503_SERVICE_UNAVAILABLE
                )
            
            result = digikey_client.get_product_details(digikey_part_number)
            
            if not result:
                return Response(
                    {"error": "Product not found in DigiKey"},
                    status=status.HTTP_404_NOT_FOUND
                )
            
            # Update part_information with new stock data
            quantity_available = result.get('quantity_available', 0)
            now = datetime.now(timezone.utc).isoformat()
            
            part_information['digikey_stock_quantity'] = quantity_available
            part_information['digikey_stock_synced_at'] = now
            
            part.part_information = part_information
            part.save()
            
            return Response({
                "stock_quantity": quantity_available,
                "synced_at": now,
                "digikey_part_number": digikey_part_number
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            logger.error(f"DigiKey credentials error: {e}")
            return Response(
                {"error": "DigiKey API credentials not configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            logger.error(f"DigiKey API error: {e}")
            return Response(
                {"error": "Failed to refresh DigiKey stock", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    except Exception as e:
        logger.error(f"Unexpected error in refresh_digikey_stock: {e}")
        return Response(
            {"error": "An unexpected error occurred", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@renderer_classes([JSONRenderer])
def clear_digikey_cache(request):
    """
    Clear cached DigiKey results (admin only)
    
    POST data:
        keyword (str, optional): Keyword to clear from cache
        digikey_part_number (str, optional): Part number to clear from cache
    """
    try:
        if not request.user or not request.user.is_authenticated:
            return Response(
                "Not Authorized",
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        # Only allow staff/superusers to clear cache
        if not request.user.is_staff:
            return Response(
                "Admin access required",
                status=status.HTTP_403_FORBIDDEN
            )
        
        data = request.data
        keyword = data.get("keyword", "").strip()
        digikey_part_number = data.get("digikey_part_number", "").strip()
        
        cleared = []
        
        if keyword:
            # Clear search cache
            cache_key = f'digikey_search_{hashlib.md5(keyword.lower().encode()).hexdigest()}'
            cache.delete(cache_key)
            cleared.append(f"Search cache for keyword: {keyword}")
        
        if digikey_part_number:
            # Clear product details cache
            cache_key = f'digikey_details_{hashlib.md5(digikey_part_number.lower().encode()).hexdigest()}'
            cache.delete(cache_key)
            cleared.append(f"Product details cache for part: {digikey_part_number}")
        
        if not cleared:
            return Response(
                {"error": "Either keyword or digikey_part_number parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"Cleared DigiKey cache: {', '.join(cleared)}")
        return Response(
            {"message": f"Cache cleared: {', '.join(cleared)}"},
            status=status.HTTP_200_OK
        )
    
    except Exception as e:
        logger.error(f"Error clearing DigiKey cache: {e}")
        return Response(
            {"error": "Failed to clear cache", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@renderer_classes([JSONRenderer])
def check_digikey_config(request):
    """
    Check if DigiKey API credentials are configured for the user's organization
    
    Returns:
        {"configured": true/false}
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
                {"configured": False},
                status=status.HTTP_200_OK
            )
        
        configured = is_digikey_configured(organization)
        
        return Response(
            {"configured": configured},
            status=status.HTTP_200_OK
        )
    
    except Exception as e:
        logger.error(f"Error checking DigiKey config: {e}")
        return Response(
            {"configured": False},
            status=status.HTTP_200_OK
        )


@api_view(["POST"])
@renderer_classes([JSONRenderer])
def test_digikey_connection(request):
    """
    Test DigiKey API connection with current credentials
    
    POST data:
        test_keyword (str, optional): Optional keyword to test search (default: "resistor")
    
    Returns:
        Connection test result with status and message
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
        
        digikey_client = get_digikey_client(organization)
        if not digikey_client:
            return Response(
                {
                    "success": False,
                    "message": "DigiKey API credentials not configured"
                },
                status=status.HTTP_200_OK
            )
        
        # Test 1: Try to get an access token
        try:
            token = digikey_client.get_access_token()
            if not token:
                return Response(
                    {
                        "success": False,
                        "message": "Failed to obtain access token. Please check your credentials."
                    },
                    status=status.HTTP_200_OK
                )
        except ValueError as e:
            # ValueError from digikey_client contains detailed error info
            error_message = str(e)
            logger.error(f"DigiKey token test failed: {e}")
            # Extract the most relevant error message
            if "401" in error_message or "Unauthorized" in error_message:
                detailed_msg = "Authentication failed. Please verify:\n"
                detailed_msg += "1. Client ID is correct\n"
                detailed_msg += "2. Client Secret is correct\n"
                detailed_msg += "3. You have subscribed to 'Product Information API v4' in the DigiKey Developer Portal\n"
                detailed_msg += f"\nTechnical details: {error_message}"
            else:
                detailed_msg = f"Authentication failed: {error_message}"
            
            return Response(
                {
                    "success": False,
                    "message": detailed_msg
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"DigiKey token test failed: {e}")
            import traceback
            logger.error(traceback.format_exc())
            return Response(
                {
                    "success": False,
                    "message": f"Authentication failed: {str(e)}"
                },
                status=status.HTTP_200_OK
            )
        
        # Test 2: Try a simple search
        test_keyword = request.data.get("test_keyword", "resistor")
        try:
            results = digikey_client.keyword_search(test_keyword, limit=1)
            return Response(
                {
                    "success": True,
                    "message": f"Connection successful! Test search for '{test_keyword}' returned {len(results)} result(s).",
                    "test_results_count": len(results)
                },
                status=status.HTTP_200_OK
            )
        except Exception as e:
            logger.error(f"DigiKey search test failed: {e}")
            error_msg = str(e)
            if hasattr(e, 'response') and e.response is not None:
                if e.response.status_code == 404:
                    error_msg = "API endpoint not found. The DigiKey API endpoint may have changed. Please check the API documentation."
                elif e.response.status_code == 401:
                    error_msg = "Authentication failed. Please verify your Client ID and Client Secret."
                else:
                    try:
                        error_body = e.response.json()
                        error_msg = error_body.get('ErrorMessage', error_body.get('error', str(e)))
                    except:
                        error_msg = e.response.text or str(e)
            
            return Response(
                {
                    "success": False,
                    "message": f"Search test failed: {error_msg}",
                    "token_obtained": True
                },
                status=status.HTTP_200_OK
            )
    
    except Exception as e:
        logger.error(f"Error testing DigiKey connection: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return Response(
            {
                "success": False,
                "message": f"Test failed: {str(e)}"
            },
            status=status.HTTP_200_OK
        )

