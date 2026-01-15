"""
BOM Flattening Utility for Odoo Integration

This module provides utilities to flatten multi-level assembly BOMs into a single-level
representation suitable for export to Odoo.

Rules:
- Parts: Include directly in flattened BOM
- PCBAs: Include directly (do not flatten PCBA BOMs)
- Sub-assemblies: Recursively expand and include their parts/PCBAs
"""

import logging
from assembly_bom.models import Assembly_bom, Bom_item
from assemblies.models import Assembly

logger = logging.getLogger(__name__)


def flatten_bom_for_odoo(assembly_id, visited=None):
    """
    Flatten multi-level assembly BOM into a single-level BOM for Odoo.
    
    This function recursively traverses the BOM structure, expanding sub-assemblies
    but keeping parts and PCBAs at the leaf level.
    
    Args:
        assembly_id: ID of the assembly to flatten
        visited: Set of visited assembly IDs to prevent infinite loops
        
    Returns:
        list: List of dicts with structure:
            [{
                'item_type': 'parts' | 'pcbas',
                'item_id': int,
                'full_part_number': str,
                'display_name': str,
                'quantity': float
            }]
    """
    if visited is None:
        visited = set()
    
    # Prevent infinite loops from circular references
    if assembly_id in visited:
        logger.warning(f"Circular reference detected for assembly {assembly_id}")
        return []
    
    visited.add(assembly_id)
    
    # Dictionary to accumulate quantities: key = (item_type, item_id), value = total quantity
    flattened_items = {}
    
    try:
        # Get the BOM for this assembly
        assembly_bom = Assembly_bom.objects.filter(assembly_id=assembly_id).first()
        
        if not assembly_bom:
            logger.warning(f"No BOM found for assembly {assembly_id}")
            return []
        
        # Get all BOM items
        bom_items = Bom_item.objects.filter(bom=assembly_bom).select_related('part', 'pcba', 'assembly')
        
        for bom_item in bom_items:
            # Skip unmounted items (DNM - Do Not Mount)
            if not bom_item.is_mounted:
                continue
            
            quantity = bom_item.quantity or 1.0
            
            # Handle Part items - add directly to flattened BOM
            if bom_item.part:
                part = bom_item.part
                key = ('parts', part.id)
                
                if key in flattened_items:
                    flattened_items[key]['quantity'] += quantity
                else:
                    flattened_items[key] = {
                        'item_type': 'parts',
                        'item_id': part.id,
                        'full_part_number': part.full_part_number or f"PRT{part.part_number}",
                        'display_name': part.display_name or '',
                        'quantity': quantity
                    }
            
            # Handle PCBA items - add directly (do NOT flatten PCBA BOMs)
            elif bom_item.pcba:
                pcba = bom_item.pcba
                key = ('pcbas', pcba.id)
                
                if key in flattened_items:
                    flattened_items[key]['quantity'] += quantity
                else:
                    flattened_items[key] = {
                        'item_type': 'pcbas',
                        'item_id': pcba.id,
                        'full_part_number': pcba.full_part_number or f"PCBA{pcba.part_number}",
                        'display_name': pcba.display_name or '',
                        'quantity': quantity
                    }
            
            # Handle Sub-Assembly items - recursively flatten
            elif bom_item.assembly:
                sub_assembly = bom_item.assembly
                logger.info(f"Recursively flattening sub-assembly {sub_assembly.id}")
                
                # Recursively get flattened BOM of sub-assembly
                sub_items = flatten_bom_for_odoo(sub_assembly.id, visited.copy())
                
                # Add sub-assembly items to our flattened BOM, multiplying quantities
                for sub_item in sub_items:
                    key = (sub_item['item_type'], sub_item['item_id'])
                    adjusted_quantity = sub_item['quantity'] * quantity
                    
                    if key in flattened_items:
                        flattened_items[key]['quantity'] += adjusted_quantity
                    else:
                        flattened_items[key] = {
                            'item_type': sub_item['item_type'],
                            'item_id': sub_item['item_id'],
                            'full_part_number': sub_item['full_part_number'],
                            'display_name': sub_item['display_name'],
                            'quantity': adjusted_quantity
                        }
        
        # Convert dictionary to list
        result = list(flattened_items.values())
        
        logger.info(f"Flattened BOM for assembly {assembly_id}: {len(result)} unique items")
        return result
        
    except Exception as e:
        logger.error(f"Error flattening BOM for assembly {assembly_id}: {e}")
        return []
