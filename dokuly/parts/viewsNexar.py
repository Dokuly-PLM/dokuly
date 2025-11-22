"""
Views for Nexar API integration
"""

import hashlib
import logging
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework import status
from django.core.cache import cache

from parts.nexar_client import get_nexar_client, is_nexar_configured

logger = logging.getLogger(__name__)

# Cache duration: 30 days in seconds
CACHE_DURATION = 30 * 24 * 60 * 60  # 2,592,000 seconds


@api_view(["POST"])
@renderer_classes([JSONRenderer])
def search_nexar_parts(request):
    """
    Search for parts using Nexar API
    
    POST data:
        mpn (str): Manufacturer Part Number to search for
        limit (int, optional): Maximum number of results (default: 10)
    
    Returns:
        List of part data from Nexar with 30-day caching
    """
    try:
        if not request.user or not request.user.is_authenticated:
            return Response(
                "Not Authorized", 
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        data = request.data
        mpn = data.get("mpn", "").strip()
        limit = data.get("limit", 10)
        
        if not mpn:
            return Response(
                {"error": "MPN parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create cache key based on MPN and limit (case-insensitive)
        cache_key = f'nexar_search_{hashlib.md5(f"{mpn.lower()}_{limit}".encode()).hexdigest()}'
        
        # Try to get cached results first
        cached_results = cache.get(cache_key)
        if cached_results is not None:
            return Response({
                "results": cached_results,
                "cached": True,
                "mpn": mpn
            }, status=status.HTTP_200_OK)
        
        # No cache, query Nexar API
        try:
            nexar_client = get_nexar_client()
            results = nexar_client.search_parts(mpn, limit=limit)
            
            # Cache the results for 30 days
            cache.set(cache_key, results, CACHE_DURATION)
            
            return Response({
                "results": results,
                "cached": False,
                "mpn": mpn
            }, status=status.HTTP_200_OK)
            
        except ValueError as e:
            # Missing credentials
            logger.error(f"Nexar credentials error: {e}")
            return Response(
                {"error": "Nexar API credentials not configured"},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )
        except Exception as e:
            # API error
            logger.error(f"Nexar API error: {e}")
            return Response(
                {"error": "Failed to search Nexar API", "details": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    except Exception as e:
        logger.error(f"Unexpected error in search_nexar_parts: {e}")
        return Response(
            {"error": "An unexpected error occurred", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["POST"])
@renderer_classes([JSONRenderer])
def clear_nexar_cache(request):
    """
    Clear cached Nexar results for a specific MPN (admin only)
    
    POST data:
        mpn (str): MPN to clear from cache
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
        mpn = data.get("mpn", "").strip()
        
        if not mpn:
            return Response(
                {"error": "MPN parameter is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        cache_key = f'nexar_search_{hashlib.md5(mpn.lower().encode()).hexdigest()}'
        cache.delete(cache_key)
        
        logger.info(f"Cleared Nexar cache for MPN: {mpn}")
        return Response(
            {"message": f"Cache cleared for MPN: {mpn}"},
            status=status.HTTP_200_OK
        )
    
    except Exception as e:
        logger.error(f"Error clearing Nexar cache: {e}")
        return Response(
            {"error": "Failed to clear cache", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@api_view(["GET"])
@renderer_classes([JSONRenderer])
def check_nexar_config(request):
    """
    Check if Nexar API credentials are configured
    
    Returns:
        {"configured": true/false}
    """
    try:
        if not request.user or not request.user.is_authenticated:
            return Response(
                "Not Authorized",
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        configured = is_nexar_configured()
        
        return Response(
            {"configured": configured},
            status=status.HTTP_200_OK
        )
    
    except Exception as e:
        logger.error(f"Error checking Nexar config: {e}")
        return Response(
            {"configured": False},
            status=status.HTTP_200_OK
        )
