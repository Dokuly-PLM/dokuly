"""
Odoo Integration Service Layer

This module handles all interactions with Odoo v19 via XML-RPC API.
Supports product creation/update, image upload, and BOM management.
"""

import logging
import xmlrpc.client
import base64
import threading
from io import BytesIO
from django.core.files.storage import default_storage
from django.db import connections
from profiles.models import Profile
from organizations.models import IntegrationSettings

logger = logging.getLogger(__name__)


class OdooConnectionError(Exception):
    """Raised when connection to Odoo fails"""
    pass


class OdooAuthenticationError(Exception):
    """Raised when authentication to Odoo fails"""
    pass


class OdooAPIError(Exception):
    """Raised when Odoo API call fails"""
    pass


def get_odoo_connection(integration_settings):
    """
    Establish XML-RPC connection to Odoo instance.

    Args:
        integration_settings: IntegrationSettings model instance

    Returns:
        tuple: (common, models, uid) - Odoo XML-RPC connections and user ID

    Raises:
        OdooConnectionError: If connection fails
        OdooAuthenticationError: If authentication fails
    """
    if not integration_settings.odoo_enabled:
        raise OdooConnectionError("Odoo integration is not enabled")

    if not integration_settings.odoo_url:
        raise OdooConnectionError("Odoo URL is not configured")

    if not integration_settings.odoo_database:
        raise OdooConnectionError("Odoo database is not configured")

    if not integration_settings.odoo_api_key:
        raise OdooConnectionError("Odoo API key is not configured")

    if not integration_settings.odoo_username:
        raise OdooConnectionError("Odoo username is not configured")

    try:
        # Ensure URL has proper format
        url = integration_settings.odoo_url.rstrip('/')

        # Connect to Odoo common endpoint
        common = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/common')

        # Test connection
        version = common.version()
        logger.info(f"Connected to Odoo version: {version}")

        # Authenticate using API key
        # In Odoo v19, API keys must be used with the correct username
        uid = common.authenticate(
            integration_settings.odoo_database,
            integration_settings.odoo_username,
            integration_settings.odoo_api_key,
            {}
        )

        if not uid:
            raise OdooAuthenticationError(
                "Failed to authenticate with Odoo. Check your username, API key, and database name. "
                "Make sure the API key is valid and associated with the specified user."
            )

        # Connect to object endpoint
        models = xmlrpc.client.ServerProxy(f'{url}/xmlrpc/2/object')

        logger.info(f"Successfully authenticated to Odoo as user ID: {uid}")
        return common, models, uid

    except xmlrpc.client.Fault as e:
        logger.error(f"Odoo XML-RPC Fault: {e}")
        raise OdooAuthenticationError(f"Odoo authentication error: {e.faultString}")
    except ConnectionError as e:
        logger.error(f"Connection error to Odoo: {e}")
        raise OdooConnectionError(f"Failed to connect to Odoo: {str(e)}")
    except Exception as e:
        logger.error(f"Unexpected error connecting to Odoo: {e}")
        raise OdooConnectionError(f"Failed to connect to Odoo: {str(e)}")


def get_image_as_base64(image_obj):
    """
    Convert Dokuly Image model to base64 string for Odoo.

    Args:
        image_obj: Image model instance

    Returns:
        str: Base64-encoded image data, or None if no image
    """
    if not image_obj:
        return None

    try:
        # Try compressed image first, fallback to original
        image_field = image_obj.image_compressed if image_obj.image_compressed else image_obj.file

        if not image_field:
            logger.warning("Image object has no file data")
            return None

        # Read the image file
        if default_storage.exists(image_field.name):
            with default_storage.open(image_field.name, 'rb') as img_file:
                image_data = img_file.read()
                # Encode to base64
                base64_image = base64.b64encode(image_data).decode('utf-8')
                logger.info(f"Successfully encoded image {image_obj.image_name} to base64")
                return base64_image
        else:
            logger.warning(f"Image file does not exist: {image_field.name}")
            return None

    except Exception as e:
        logger.error(f"Error encoding image to base64: {e}")
        return None


def create_or_update_odoo_product(models, uid, database, api_key, product_data, template_data=None, integration_settings=None):
    """
    Create or update a product in Odoo by internal reference (default_code).

    Args:
        models: Odoo models XML-RPC connection
        uid: Odoo user ID
        database: Odoo database name
        api_key: Odoo API key
        product_data: Dict with product-level fields
        template_data: Dict with template-level fields (type, sale_ok, purchase_ok, etc.)
        integration_settings: IntegrationSettings instance (optional, for update field configuration)

    Returns:
        int: Odoo product ID

    Raises:
        OdooAPIError: If product creation/update fails
    """
    try:
        internal_reference = product_data.get('default_code')

        if not internal_reference:
            raise OdooAPIError("Product internal reference (default_code) is required")

        # Search for existing product by internal reference
        product_ids = models.execute_kw(
            database, uid, api_key,
            'product.product', 'search',
            [[['default_code', '=', internal_reference]]]
        )

        if product_ids:
            # Update existing product
            product_id = product_ids[0]
            logger.info(f"Found existing Odoo product with ID {product_id}, updating...")

            # Update product-level fields
            models.execute_kw(
                database, uid, api_key,
                'product.product', 'write',
                [[product_id], product_data]
            )

            # Get template ID and update only name and image for existing products
            # (Skip other template-level fields like type, sale_ok, purchase_ok, etc.)
            product_info = models.execute_kw(
                database, uid, api_key,
                'product.product', 'read',
                [[product_id], ['product_tmpl_id']]
            )

            if product_info and 'product_tmpl_id' in product_info[0]:
                template_id = product_info[0]['product_tmpl_id'][0]
                # Update only configured fields for existing products
                update_fields = (integration_settings.odoo_update_fields_existing if integration_settings else None) or ['name', 'description', 'image']
                update_template_data = {}

                if 'name' in update_fields and 'name' in product_data:
                    update_template_data['name'] = product_data['name']

                if 'description' in update_fields and 'description' in product_data:
                    update_template_data['description'] = product_data['description']

                if 'image' in update_fields and template_data and 'image_1920' in template_data:
                    update_template_data['image_1920'] = template_data['image_1920']

                if update_template_data:
                    models.execute_kw(
                        database, uid, api_key,
                        'product.template', 'write',
                        [[template_id], update_template_data]
                    )
                    logger.info(f"Updated product template {template_id} with fields: {list(update_template_data.keys())}")
                else:
                    logger.info(f"No template-level fields to update for existing product {product_id} (configured fields: {update_fields})")

            logger.info(f"Successfully updated Odoo product {product_id}")
            return product_id
        else:
            # Create new product
            logger.info(f"Creating new Odoo product with reference {internal_reference}")

            # First create the template with template-level fields
            if template_data:
                template_data_with_name = template_data.copy()
            else:
                template_data_with_name = {}

            template_data_with_name['name'] = product_data['name']
            template_data_with_name['default_code'] = product_data['default_code']
            if 'description' in product_data:
                template_data_with_name['description'] = product_data['description']

            # Log the type value being sent for debugging
            logger.info(f"Creating product template with type: {template_data_with_name.get('type', 'NOT SET')}")
            logger.debug(f"Full template data: {template_data_with_name}")

            template_id = models.execute_kw(
                database, uid, api_key,
                'product.template', 'create',
                [template_data_with_name]
            )
            logger.info(f"Created product template {template_id}")

            # Get the product variant (product.product) from the template
            product_variants = models.execute_kw(
                database, uid, api_key,
                'product.product', 'search',
                [[['product_tmpl_id', '=', template_id]]],
                {'limit': 1}
            )

            if product_variants:
                product_id = product_variants[0]
                logger.info(f"Found product variant {product_id} for template {template_id}")
            else:
                # If no variant exists, create one
                product_variant_data = {
                    'product_tmpl_id': template_id,
                    'default_code': product_data['default_code'],
                }
                product_id = models.execute_kw(
                    database, uid, api_key,
                    'product.product', 'create',
                    [product_variant_data]
                )
                logger.info(f"Created product variant {product_id} for template {template_id}")

            logger.info(f"Successfully created Odoo product {product_id}")
            return product_id

    except xmlrpc.client.Fault as e:
        logger.error(f"Odoo API Fault during product create/update: {e}")
        raise OdooAPIError(f"Failed to create/update product: {e.faultString}")
    except Exception as e:
        logger.error(f"Error creating/updating Odoo product: {e}")
        raise OdooAPIError(f"Failed to create/update product: {str(e)}")


def create_odoo_bom(models, uid, database, api_key, product_id, bom_items, integration_settings):
    """
    Create or update Bill of Materials in Odoo for a product.

    Args:
        models: Odoo models XML-RPC connection
        uid: Odoo user ID
        database: Odoo database name
        api_key: Odoo API key
        product_id: Odoo product ID (the assembly)
        bom_items: List of BOM items with structure:
            [{
                'item_type': 'parts' | 'pcbas' | 'assemblies',
                'full_part_number': str,
                'quantity': float,
                'display_name': str
            }]
        integration_settings: IntegrationSettings instance

    Returns:
        dict: {
            'bom_id': int or None,
            'total_items': int,
            'added_items': int,
            'skipped_items': list of {'part_number': str, 'reason': str, 'display_name': str}
        }

    Raises:
        OdooAPIError: If BOM creation fails
    """
    try:
        # First, search for existing BOM for this product
        existing_bom_ids = models.execute_kw(
            database, uid, api_key,
            'mrp.bom', 'search',
            [[['product_id', '=', product_id]]]
        )

        # Prepare BOM lines and track skipped items
        bom_lines = []
        skipped_items = []

        for item in bom_items:
            component_id = None

            # First, search for the component product in Odoo by dokuly part number (internal reference)
            component_ids = models.execute_kw(
                database, uid, api_key,
                'product.product', 'search',
                [[['default_code', '=', item['full_part_number']]]]
            )

            if component_ids:
                component_id = component_ids[0]
            else:
                # If not found by dokuly part number, try external part number
                external_part_number = item.get('external_part_number')
                if external_part_number:
                    component_ids = models.execute_kw(
                        database, uid, api_key,
                        'product.product', 'search',
                        [[['default_code', '=', external_part_number]]]
                    )

                    if component_ids:
                        component_id = component_ids[0]
                        logger.info(f"Found component {item['full_part_number']} in Odoo using external part number {external_part_number}")

            if component_id:
                bom_lines.append((0, 0, {
                    'product_id': component_id,
                    'product_qty': item['quantity'],
                }))
            else:
                # Only fail if neither dokuly part number nor external part number matched
                logger.warning(f"Component {item['full_part_number']} not found in Odoo (checked dokuly part number and external part number), skipping")
                skipped_items.append({
                    'part_number': item['full_part_number'],
                    'display_name': item.get('display_name', item['full_part_number']),
                    'reason': 'Product not found in Odoo (checked dokuly part number and external part number)'
                })

        result = {
            'bom_id': None,
            'total_items': len(bom_items),
            'added_items': len(bom_lines),
            'skipped_items': skipped_items
        }

        # Only create BOM if ALL parts are present in Odoo
        if skipped_items:
            logger.warning(f"Cannot create BOM: {len(skipped_items)} component(s) not found in Odoo")
            return result

        if not bom_lines:
            logger.warning("No valid BOM lines to create")
            return result

        # Get the product template ID for the assembly product
        # Odoo requires product_tmpl_id for BOM creation
        product_info = models.execute_kw(
            database, uid, api_key,
            'product.product', 'read',
            [[product_id], ['product_tmpl_id']]
        )

        if not product_info or 'product_tmpl_id' not in product_info[0]:
            logger.error(f"Could not fetch product template ID for product {product_id}")
            raise OdooAPIError("Could not fetch product template ID")

        product_tmpl_id = product_info[0]['product_tmpl_id'][0]  # It's returned as [id, name]

        # Prepare BOM data
        bom_data = {
            'product_id': product_id,
            'product_tmpl_id': product_tmpl_id,
            'product_qty': 1.0,
            'type': 'normal',
            'bom_line_ids': bom_lines
        }

        if existing_bom_ids:
            # Update existing BOM
            bom_id = existing_bom_ids[0]
            logger.info(f"Updating existing BOM {bom_id} for product {product_id}")

            # Delete old BOM lines and create new ones
            models.execute_kw(
                database, uid, api_key,
                'mrp.bom', 'write',
                [[bom_id], {'bom_line_ids': [(5, 0, 0)] + bom_lines}]
            )
        else:
            # Create new BOM
            logger.info(f"Creating new BOM for product {product_id}")

            bom_id = models.execute_kw(
                database, uid, api_key,
                'mrp.bom', 'create',
                [bom_data]
            )

        result['bom_id'] = bom_id
        logger.info(f"Successfully created/updated BOM {bom_id} with {len(bom_lines)} lines")
        return result

    except xmlrpc.client.Fault as e:
        logger.error(f"Odoo API Fault during BOM creation: {e}")
        raise OdooAPIError(f"Failed to create BOM: {e.faultString}")
    except Exception as e:
        logger.error(f"Error creating Odoo BOM: {e}")
        raise OdooAPIError(f"Failed to create BOM: {str(e)}")


def find_odoo_category_by_name(models, uid, database, api_key, category_name):
    """
    Find Odoo product category by name.

    Args:
        models: Odoo models XML-RPC connection
        uid: Odoo user ID
        database: Odoo database name
        api_key: Odoo API key
        category_name: Category name to search for (e.g., "Purchased Goods")

    Returns:
        int: Odoo category ID if found, None otherwise
    """
    try:
        # Try exact match first
        category_ids = models.execute_kw(
            database, uid, api_key,
            'product.category', 'search',
            [[['name', '=', category_name]]],
            {'limit': 1}
        )

        if category_ids:
            logger.info(f"Found Odoo category ID {category_ids[0]} for '{category_name}'")
            return category_ids[0]

        # Try case-insensitive match
        category_ids = models.execute_kw(
            database, uid, api_key,
            'product.category', 'search',
            [[['name', 'ilike', category_name]]],
            {'limit': 1}
        )

        if category_ids:
            logger.info(f"Found Odoo category ID {category_ids[0]} for '{category_name}' (case-insensitive match)")
            return category_ids[0]

        logger.warning(f"Could not find Odoo category '{category_name}'")
        return None

    except Exception as e:
        logger.error(f"Error finding Odoo category '{category_name}': {e}")
        return None


def find_odoo_uom_by_name(models, uid, database, api_key, unit_name):
    """
    Find Odoo UoM (Unit of Measure) by name.

    Args:
        models: Odoo models XML-RPC connection
        uid: Odoo user ID
        database: Odoo database name
        api_key: Odoo API key
        unit_name: Unit name from Dokuly (e.g., "pcs", "kg", "m")

    Returns:
        int: Odoo UoM ID if found, None otherwise
    """
    try:
        # Common mappings between Dokuly units and Odoo UoM names
        unit_mappings = {
            'pcs': ['Units', 'Unit(s)', 'Unit', 'Pieces', 'Piece'],
            'piece': ['Units', 'Unit(s)', 'Unit', 'Pieces', 'Piece'],
            'pieces': ['Units', 'Unit(s)', 'Unit', 'Pieces', 'Piece'],
            'unit': ['Units', 'Unit(s)', 'Unit'],
            'units': ['Units', 'Unit(s)', 'Unit'],
            'kg': ['kg', 'Kilogram', 'Kilograms'],
            'kilogram': ['kg', 'Kilogram', 'Kilograms'],
            'kilograms': ['kg', 'Kilogram', 'Kilograms'],
            'g': ['g', 'Gram', 'Grams'],
            'gram': ['g', 'Gram', 'Grams'],
            'grams': ['g', 'Gram', 'Grams'],
            'm': ['m', 'Meter', 'Meters'],
            'meter': ['m', 'Meter', 'Meters'],
            'meters': ['m', 'Meter', 'Meters'],
            'cm': ['cm', 'Centimeter', 'Centimeters'],
            'centimeter': ['cm', 'Centimeter', 'Centimeters'],
            'centimeters': ['cm', 'Centimeter', 'Centimeters'],
            'mm': ['mm', 'Millimeter', 'Millimeters'],
            'millimeter': ['mm', 'Millimeter', 'Millimeters'],
            'millimeters': ['mm', 'Millimeter', 'Millimeters'],
            'l': ['L', 'Liter', 'Liters'],
            'liter': ['L', 'Liter', 'Liters'],
            'liters': ['L', 'Liter', 'Liters'],
            'ml': ['mL', 'Milliliter', 'Milliliters'],
            'milliliter': ['mL', 'Milliliter', 'Milliliters'],
            'milliliters': ['mL', 'Milliliter', 'Milliliters'],
        }

        # Get list of names to try
        search_names = unit_mappings.get(unit_name.lower(), [unit_name])

        # Try each name variant
        for search_name in search_names:
            # Try exact match first
            uom_ids = models.execute_kw(
                database, uid, api_key,
                'uom.uom', 'search',
                [[['name', '=', search_name]]],
                {'limit': 1}
            )

            if uom_ids:
                logger.info(f"Found Odoo UoM ID {uom_ids[0]} for unit '{unit_name}' (matched as '{search_name}')")
                return uom_ids[0]

            # Try case-insensitive match with ilike
            uom_ids = models.execute_kw(
                database, uid, api_key,
                'uom.uom', 'search',
                [[['name', 'ilike', search_name]]],
                {'limit': 1}
            )

            if uom_ids:
                logger.info(f"Found Odoo UoM ID {uom_ids[0]} for unit '{unit_name}' (matched as '{search_name}' with ilike)")
                return uom_ids[0]

        # Last resort: try to get default "Units" UoM by searching for active unit category
        logger.warning(f"Could not find specific Odoo UoM for unit '{unit_name}', attempting to get default Units")
        # First find the Unit category
        category_ids = models.execute_kw(
            database, uid, api_key,
            'uom.category', 'search',
            [[['name', '=', 'Unit']]],
            {'limit': 1}
        )

        if category_ids:
            # Then find UoM with that category and uom_type = 'reference'
            uom_ids = models.execute_kw(
                database, uid, api_key,
                'uom.uom', 'search',
                [[['category_id', '=', category_ids[0]], ['uom_type', '=', 'reference']]],
                {'limit': 1}
            )

            if uom_ids:
                logger.info(f"Using default Units UoM ID {uom_ids[0]} for unit '{unit_name}'")
                return uom_ids[0]

        logger.error(f"Could not find any suitable Odoo UoM for unit '{unit_name}'")
        return None

    except Exception as e:
        logger.error(f"Error finding Odoo UoM for '{unit_name}': {e}")
        return None


def push_product_to_odoo(item, item_type, integration_settings, user, include_bom=False):
    """
    Main function to push a part/pcba/assembly to Odoo as a product.

    Args:
        item: Part, Pcba, or Assembly model instance
        item_type: str - 'parts', 'pcbas', or 'assemblies'
        integration_settings: IntegrationSettings instance
        user: Django User instance
        include_bom: bool - Whether to push BOM (for assemblies)

    Returns:
        dict: {'success': bool, 'product_id': int, 'message': str}
    """
    try:
        # Get Odoo connection
        common, models, uid = get_odoo_connection(integration_settings)

        # Use configured product type or default to 'consu' (Goods)
        # Valid values: 'consu' (Goods), 'service' (Service), 'combo' (Combo)
        # Map any invalid/old values to valid ones
        raw_product_type = integration_settings.odoo_default_product_type or 'consu'

        # Map invalid values to valid ones (handle old 'product' value from migrations)
        type_mapping = {
            'product': 'consu',  # Old value, map to 'consu'
            'Product': 'consu',
            'PRODUCT': 'consu',
            'storable': 'consu',
            'Storable': 'consu',
            'goods': 'consu',
            'Goods': 'consu',
            'consumable': 'consu',
            'Consumable': 'consu',
        }

        product_type = type_mapping.get(raw_product_type, raw_product_type)

        # Validate that the final type is one of the valid values
        valid_types = ['consu', 'service', 'combo']
        if product_type not in valid_types:
            logger.warning(f"Invalid product type '{product_type}', defaulting to 'consu'")
            product_type = 'consu'

        logger.info(f"Pushing product {item.full_part_number} to Odoo with type: {product_type} (mapped from: {raw_product_type})")

        # Prepare product data (product-level fields only)
        product_data = {
            'name': item.display_name or f"{item.full_part_number}",
            'default_code': item.full_part_number,  # Internal reference
            'description': item.description or '',
        }

        # Prepare template data (template-level fields) using configuration
        template_data = {
            'type': product_type,
            # Use configured defaults for product flags
            'sale_ok': integration_settings.odoo_default_sale_ok,
            'purchase_ok': integration_settings.odoo_default_purchase_ok,
            'is_storable': integration_settings.odoo_default_is_storable,
            'tracking': integration_settings.odoo_default_tracking or 'none',
            'rent_ok': integration_settings.odoo_default_rent_ok,
        }

        # Set category based on item type using configuration
        if item_type == 'assemblies':
            category_name = integration_settings.odoo_category_assemblies or 'Manufactured'
        elif item_type == 'parts':
            category_name = integration_settings.odoo_category_parts or 'Purchased Goods'
        elif item_type == 'pcbas':
            category_name = integration_settings.odoo_category_pcbas or 'Purchased Goods'
        else:
            category_name = integration_settings.odoo_category_parts or 'Purchased Goods'  # Default fallback

        category_id = find_odoo_category_by_name(
            models, uid,
            integration_settings.odoo_database,
            integration_settings.odoo_api_key,
            category_name
        )

        if category_id:
            template_data['categ_id'] = category_id
            logger.info(f"Set product category to '{category_name}' (ID: {category_id})")
        elif integration_settings.odoo_default_product_category_id:
            # Fallback to configured category ID if category not found
            template_data['categ_id'] = integration_settings.odoo_default_product_category_id
            logger.info(f"Using configured default product category ID: {integration_settings.odoo_default_product_category_id}")
        else:
            logger.warning(f"Could not find '{category_name}' category and no default category configured")

        # Use the item's unit to find the corresponding Odoo UoM (template-level field)
        if hasattr(item, 'unit') and item.unit:
            uom_id = find_odoo_uom_by_name(
                models, uid,
                integration_settings.odoo_database,
                integration_settings.odoo_api_key,
                item.unit
            )
            if uom_id:
                template_data['uom_id'] = uom_id
                template_data['uom_po_id'] = uom_id
            else:
                # Fallback to default UoM if configured
                if integration_settings.odoo_default_uom_id:
                    template_data['uom_id'] = integration_settings.odoo_default_uom_id
                    template_data['uom_po_id'] = integration_settings.odoo_default_uom_id
        elif integration_settings.odoo_default_uom_id:
            # Use default UoM if item has no unit
            template_data['uom_id'] = integration_settings.odoo_default_uom_id
            template_data['uom_po_id'] = integration_settings.odoo_default_uom_id

        # Handle image (template-level field)
        if hasattr(item, 'thumbnail') and item.thumbnail:
            image_base64 = get_image_as_base64(item.thumbnail)
            if image_base64:
                template_data['image_1920'] = image_base64

        # Create or update product
        product_id = create_or_update_odoo_product(
            models, uid,
            integration_settings.odoo_database,
            integration_settings.odoo_api_key,
            product_data,
            template_data,
            integration_settings
        )

        result = {
            'success': True,
            'product_id': product_id,
            'message': f"Successfully pushed {item.full_part_number} to Odoo"
        }

        # Handle BOM for assemblies
        if item_type == 'assemblies' and include_bom:
            try:
                from assembly_bom.bom_flattening import flatten_bom_for_odoo

                bom_items = flatten_bom_for_odoo(item.id)

                if bom_items:
                    bom_result = create_odoo_bom(
                        models, uid,
                        integration_settings.odoo_database,
                        integration_settings.odoo_api_key,
                        product_id,
                        bom_items,
                        integration_settings
                    )

                    # Include BOM result details in response
                    result['bom_result'] = bom_result

                    if bom_result['bom_id']:
                        result['bom_id'] = bom_result['bom_id']
                        result['message'] += f" with BOM ({bom_result['added_items']}/{bom_result['total_items']} items)"
                    else:
                        # BOM was not created because parts are missing
                        result['message'] += " (BOM not created - missing components in Odoo)"
                        result['bom_not_created'] = True
                        result['missing_components'] = bom_result['skipped_items']
                else:
                    logger.warning(f"No BOM items found for assembly {item.id}")
                    result['bom_warning'] = "No BOM items found for this assembly"

            except Exception as bom_error:
                logger.error(f"Error creating BOM in Odoo: {bom_error}")
                result['bom_error'] = str(bom_error)
                result['message'] += " (BOM creation failed)"

        logger.info(f"Successfully pushed {item_type} {item.id} to Odoo as product {product_id}")
        return result

    except (OdooConnectionError, OdooAuthenticationError, OdooAPIError) as e:
        logger.error(f"Odoo error pushing {item_type} {item.id}: {e}")
        return {
            'success': False,
            'message': str(e)
        }
    except Exception as e:
        logger.error(f"Unexpected error pushing {item_type} {item.id} to Odoo: {e}")
        return {
            'success': False,
            'message': f"Unexpected error: {str(e)}"
        }


def test_odoo_connection(integration_settings):
    """
    Test connection to Odoo instance and fetch valid product type values.

    Args:
        integration_settings: IntegrationSettings instance

    Returns:
        dict: {'success': bool, 'message': str, 'version': dict, 'valid_product_types': list}
    """
    try:
        common, models, uid = get_odoo_connection(integration_settings)

        # Get Odoo version info
        version = common.version()

        # Try a simple query to verify full access
        models.execute_kw(
            integration_settings.odoo_database, uid,
            integration_settings.odoo_api_key,
            'product.product', 'search',
            [[]], {'limit': 1}
        )

        # Query valid product type values
        valid_types = []
        try:
            fields_info = models.execute_kw(
                integration_settings.odoo_database,
                uid,
                integration_settings.odoo_api_key,
                'product.template', 'fields_get',
                ['type'],
                {'attributes': ['selection']}
            )
            valid_types = fields_info.get('type', {}).get('selection', [])
            logger.info(f"Valid Odoo product types: {valid_types}")
        except Exception as e:
            logger.warning(f"Could not query product types: {e}")

        return {
            'success': True,
            'message': 'Successfully connected to Odoo',
            'version': version,
            'valid_product_types': valid_types
        }

    except (OdooConnectionError, OdooAuthenticationError) as e:
        return {
            'success': False,
            'message': str(e)
        }
    except Exception as e:
        return {
            'success': False,
            'message': f"Connection test failed: {str(e)}"
        }


def _auto_push_on_release_sync(item_id, item_type, user_id, include_bom=False):
    """
    Internal synchronous function to push item to Odoo.
    This is called from a background thread, so it needs to handle its own database connections.

    Args:
        item_id: ID of the item to push
        item_type: Type of item ('parts', 'assemblies', or 'pcbas')
        user_id: ID of the user who released the item
        include_bom: Whether to include BOM (only relevant for assemblies)
    """
    try:
        # Import models here to avoid circular imports and ensure fresh imports in thread
        if item_type == 'parts':
            from parts.models import Part
            item = Part.objects.get(id=item_id)
        elif item_type == 'assemblies':
            from assemblies.models import Assembly
            item = Assembly.objects.get(id=item_id)
        elif item_type == 'pcbas':
            from pcbas.models import Pcba
            item = Pcba.objects.get(id=item_id)
        else:
            logger.error(f"Unknown item_type: {item_type}")
            return

        # Get user
        from django.contrib.auth.models import User
        user = User.objects.get(id=user_id)

        # Get user profile and organization
        profile = Profile.objects.get(user=user)
        if not profile.organization_id or profile.organization_id == -1:
            logger.debug(f"User {user.id} has no organization, skipping Odoo auto-push")
            return

        # Get integration settings
        integration_settings = IntegrationSettings.objects.filter(
            organization_id=profile.organization_id
        ).first()

        if not integration_settings:
            logger.debug(f"No integration settings found for organization {profile.organization_id}")
            return

        # Check if Odoo auto-push is enabled
        if not integration_settings.odoo_enabled:
            logger.debug("Odoo integration is not enabled")
            return

        if not integration_settings.odoo_auto_push_on_release:
            logger.debug("Odoo auto-push on release is not enabled")
            return

        # Push to Odoo
        logger.info(f"Auto-pushing {item_type} {item.id} ({item.full_part_number}) to Odoo on release (background)")
        result = push_product_to_odoo(
            item,
            item_type,
            integration_settings,
            user,
            include_bom=include_bom
        )

        if result.get('success'):
            logger.info(f"Successfully auto-pushed {item_type} {item.id} to Odoo: {result.get('message')}")
        else:
            logger.warning(f"Failed to auto-push {item_type} {item.id} to Odoo: {result.get('message')}")

    except Exception as e:
        logger.error(f"Error during background auto-push of {item_type} {item_id} to Odoo: {e}", exc_info=True)


def auto_push_on_release(item, item_type, user, include_bom=False):
    """
    Auto-push item to Odoo when released.

    This function checks if Odoo integration is enabled and configured for auto-push,
    then pushes the item to Odoo. This is meant to be called when an item's release
    state changes to "Released".

    Args:
        item: The item to push (Part, Assembly, or Pcba model instance)
        item_type: Type of item ('parts', 'assemblies', or 'pcbas')
        user: Django User object who released the item
        include_bom: Whether to include BOM (only relevant for assemblies)

    Returns:
        dict: Result of the push operation with 'success', 'message' keys
              Returns None if auto-push is not enabled

    Raises:
        No exceptions - logs warnings on failure
    """
    try:
        # Get user profile and organization
        profile = Profile.objects.get(user=user)
        if not profile.organization_id or profile.organization_id == -1:
            logger.debug(f"User {user.id} has no organization, skipping Odoo auto-push")
            return None

        # Get integration settings
        integration_settings = IntegrationSettings.objects.filter(
            organization_id=profile.organization_id
        ).first()

        if not integration_settings:
            logger.debug(f"No integration settings found for organization {profile.organization_id}")
            return None

        # Check if Odoo auto-push is enabled
        if not integration_settings.odoo_enabled:
            logger.debug("Odoo integration is not enabled")
            return None

        if not integration_settings.odoo_auto_push_on_release:
            logger.debug("Odoo auto-push on release is not enabled")
            return None

        # Push to Odoo
        logger.info(f"Auto-pushing {item_type} {item.id} ({item.full_part_number}) to Odoo on release")
        result = push_product_to_odoo(
            item,
            item_type,
            integration_settings,
            user,
            include_bom=include_bom
        )

        if result.get('success'):
            logger.info(f"Successfully auto-pushed {item_type} {item.id} to Odoo: {result.get('message')}")
        else:
            logger.warning(f"Failed to auto-push {item_type} {item.id} to Odoo: {result.get('message')}")

        return result

    except Exception as e:
        logger.error(f"Error during auto-push of {item_type} {item.id} to Odoo: {e}", exc_info=True)
        return {
            'success': False,
            'message': f"Auto-push failed: {str(e)}"
        }


def auto_push_on_release_async(item, item_type, user, include_bom=False):
    """
    Auto-push item to Odoo when released (runs in background thread).

    This function starts a background thread to push the item to Odoo, so it doesn't
    block the request. This is the preferred method for auto-push on release.

    Args:
        item: The item to push (Part, Assembly, or Pcba model instance)
        item_type: Type of item ('parts', 'assemblies', or 'pcbas')
        user: Django User object who released the item
        include_bom: Whether to include BOM (only relevant for assemblies)

    Returns:
        None (fire-and-forget, runs in background)
    """
    # Store IDs instead of model instances to avoid issues with database connections
    item_id = item.id
    user_id = user.id

    # Start background thread
    thread = threading.Thread(
        target=_auto_push_on_release_sync,
        args=(item_id, item_type, user_id, include_bom),
        daemon=True  # Daemon thread so it doesn't block server shutdown
    )
    thread.start()
    logger.info(f"Started background thread to push {item_type} {item_id} to Odoo")
