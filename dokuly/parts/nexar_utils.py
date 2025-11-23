"""
Utility functions for Nexar integration
Handles supplier mapping and price creation from Nexar data
"""

import logging
from purchasing.suppliermodel import Supplier
from purchasing.priceModel import Price

logger = logging.getLogger(__name__)


def get_supplier_by_nexar_seller_id(seller_id):
    """
    Get Dokuly supplier mapped to a Nexar seller ID
    
    Args:
        seller_id (str): Nexar seller ID
        
    Returns:
        Supplier or None: Matched supplier or None if no mapping exists
    """
    try:
        # Convert to int if string
        if isinstance(seller_id, str):
            seller_id = int(seller_id)
        
        supplier = Supplier.objects.filter(nexar_seller_id=seller_id).first()
        return supplier
    except (ValueError, Supplier.DoesNotExist):
        return None


def create_prices_from_nexar_offers(part_id, nexar_sellers_data, organization_id=None):
    """
    Create Price objects from Nexar seller offer data
    
    Args:
        part_id (int): ID of the Part to create prices for
        nexar_sellers_data (list): List of seller offer dicts from Nexar search results
            Each dict should have: seller_id, seller_name, prices (list of price tiers)
        organization_id (int, optional): Organization ID for supplier filtering
        
    Returns:
        dict: Summary of created prices {
            'created': int,
            'skipped': int,
            'errors': list,
            'details': list
        }
    """
    result = {
        'created': 0,
        'skipped': 0,
        'errors': [],
        'details': []
    }
    
    for seller_data in nexar_sellers_data:
        seller_id = seller_data.get('seller_id')
        seller_name = seller_data.get('seller_name', 'Unknown')
        price_tiers = seller_data.get('prices', [])
        
        if not seller_id or not price_tiers:
            result['skipped'] += 1
            result['details'].append(f"Skipped {seller_name}: No seller ID or prices")
            continue
        
        # Find matching Dokuly supplier
        supplier = get_supplier_by_nexar_seller_id(seller_id)
        
        if not supplier:
            result['skipped'] += 1
            result['details'].append(f"Skipped {seller_name} (ID: {seller_id}): No supplier mapping")
            continue
        
        # Create prices for each tier
        for tier in price_tiers:
            quantity = tier.get('quantity', 1)
            price = tier.get('price')
            currency = tier.get('currency', 'USD')
            
            if price is None:
                continue
            
            try:
                # Check if price already exists for this supplier and quantity
                existing_price = Price.objects.filter(
                    part_id=part_id,
                    supplier=supplier,
                    minimum_order_quantity=quantity
                ).first()
                
                if existing_price:
                    # Update existing price if different
                    if existing_price.price != price or existing_price.currency != currency:
                        existing_price.price = price
                        existing_price.currency = currency
                        existing_price.save()
                        result['details'].append(
                            f"Updated {supplier.name}: {quantity}x @ {price} {currency}"
                        )
                        result['created'] += 1
                    else:
                        result['skipped'] += 1
                else:
                    # Create new price
                    Price.objects.create(
                        part_id=part_id,
                        supplier=supplier,
                        price=price,
                        currency=currency,
                        minimum_order_quantity=quantity
                    )
                    result['details'].append(
                        f"Created {supplier.name}: {quantity}x @ {price} {currency}"
                    )
                    result['created'] += 1
                    
            except Exception as e:
                logger.error(f"Error creating price for {supplier.name}: {e}")
                result['errors'].append(f"{supplier.name}: {str(e)}")
    
    return result


def get_mapped_suppliers_summary():
    """
    Get summary of suppliers with Nexar seller ID mappings
    
    Returns:
        dict: {
            'total_suppliers': int,
            'mapped_suppliers': int,
            'mappings': list of {supplier_id, supplier_name, nexar_seller_id}
        }
    """
    total = Supplier.objects.count()
    mapped = Supplier.objects.filter(nexar_seller_id__isnull=False)
    
    return {
        'total_suppliers': total,
        'mapped_suppliers': mapped.count(),
        'mappings': [
            {
                'supplier_id': s.id,
                'supplier_name': s.name,
                'nexar_seller_id': s.nexar_seller_id
            }
            for s in mapped
        ]
    }
