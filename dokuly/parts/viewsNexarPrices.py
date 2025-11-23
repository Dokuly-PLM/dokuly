"""
Views for creating prices from Nexar offer data
"""

import logging
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework import status

from parts.nexar_utils import create_prices_from_nexar_offers

logger = logging.getLogger(__name__)


@api_view(["POST"])
@renderer_classes([JSONRenderer])
def create_prices_from_nexar(request):
    """
    Create Price objects from Nexar seller offer data
    
    POST data:
        part_id (int): ID of the Part to create prices for
        sellers (list): List of seller offer dicts from Nexar search results
            Each dict should have: seller_id, seller_name, prices (list of price tiers)
    
    Returns:
        Summary of created prices {
            'created': int,
            'skipped': int,
            'errors': list,
            'details': list
        }
    """
    try:
        if not request.user or not request.user.is_authenticated:
            return Response(
                "Not Authorized",
                status=status.HTTP_401_UNAUTHORIZED
            )
        
        data = request.data
        part_id = data.get("part_id")
        sellers_data = data.get("sellers", [])
        
        if not part_id:
            return Response(
                {"error": "part_id is required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not sellers_data or not isinstance(sellers_data, list):
            return Response(
                {"error": "sellers must be a list of seller offer data"},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Create prices from Nexar offers
        result = create_prices_from_nexar_offers(part_id, sellers_data)
        
        return Response(result, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f"Error creating prices from Nexar: {e}")
        return Response(
            {"error": "Failed to create prices from Nexar", "details": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )
