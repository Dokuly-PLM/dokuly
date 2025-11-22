"""
DigiKey API Client for DigiKey integration
Handles OAuth2 2-legged authentication and part search functionality
"""

import requests
from datetime import datetime, timedelta
from django.core.cache import cache
import logging
import base64
import re
import json

logger = logging.getLogger(__name__)


class DigikeyClient:
    """Client for DigiKey API with OAuth2 2-legged token management"""
    
    # DigiKey API endpoints
    TOKEN_URL = "https://api.digikey.com/v1/oauth2/token"
    # DigiKey API v4 endpoints
    KEYWORD_SEARCH_URL = "https://api.digikey.com/products/v4/search/keyword"
    # Product details endpoint - format: /products/v4/search/{productNumber}/productdetails
    PRODUCT_DETAILS_BASE_URL = "https://api.digikey.com/products/v4/search"
    
    TOKEN_CACHE_KEY_PREFIX = "digikey_access_token_"
    TOKEN_EXPIRY_KEY_PREFIX = "digikey_token_expiry_"
    
    def __init__(self, client_id, client_secret, locale_site="US", locale_currency="USD", locale_language="en"):
        """
        Initialize DigiKey client with credentials and locale settings
        
        Args:
            client_id (str): DigiKey API client ID
            client_secret (str): DigiKey API client secret
            locale_site (str): DigiKey locale site code (e.g., US, CA, UK, DE). Default: US
            locale_currency (str): DigiKey locale currency code (e.g., USD, EUR, GBP). Default: USD
            locale_language (str): DigiKey locale language code (e.g., en, de, fr). Default: en
        """
        # Strip whitespace from credentials
        self.client_id = (client_id or "").strip()
        self.client_secret = (client_secret or "").strip()
        
        if not self.client_id or not self.client_secret:
            raise ValueError("DigiKey client_id and client_secret must be provided")
        
        # Validate credentials are not empty after stripping
        if not self.client_id or not self.client_secret:
            raise ValueError("DigiKey client_id and client_secret cannot be empty")
        
        # Set locale settings with defaults
        self.locale_site = (locale_site or "US").strip()
        self.locale_currency = (locale_currency or "USD").strip()
        self.locale_language = (locale_language or "en").strip()
        
        # Create unique cache keys based on client_id to support multiple organizations
        cache_suffix = base64.b64encode(self.client_id.encode()).decode()[:16]
        self.TOKEN_CACHE_KEY = f"{self.TOKEN_CACHE_KEY_PREFIX}{cache_suffix}"
        self.TOKEN_EXPIRY_KEY = f"{self.TOKEN_EXPIRY_KEY_PREFIX}{cache_suffix}"
    
    def _parse_lead_weeks_to_days(self, lead_weeks_str):
        """
        Parse ManufacturerLeadWeeks string and convert to days
        
        Args:
            lead_weeks_str: String like "11" or "11-12" (weeks)
            
        Returns:
            int: Lead time in days, or None if cannot be parsed
        """
        if not lead_weeks_str:
            return None
        
        try:
            # Convert to string and strip whitespace
            lead_weeks_str = str(lead_weeks_str).strip()
            
            # Handle ranges like "11-12" by taking the first value
            if '-' in lead_weeks_str:
                lead_weeks_str = lead_weeks_str.split('-')[0].strip()
            
            # Parse as float first (in case of decimals), then convert to int
            weeks = float(lead_weeks_str)
            days = int(weeks * 7)
            
            return days if days > 0 else None
        except (ValueError, TypeError):
            logger.debug(f"Could not parse lead weeks: {lead_weeks_str}")
            return None
        
        # Set locale settings with defaults
        self.locale_site = (locale_site or "US").strip()
        self.locale_currency = (locale_currency or "USD").strip()
        self.locale_language = (locale_language or "en").strip()
        
        # Create unique cache keys based on client_id to support multiple organizations
        cache_suffix = base64.b64encode(self.client_id.encode()).decode()[:16]
        self.TOKEN_CACHE_KEY = f"{self.TOKEN_CACHE_KEY_PREFIX}{cache_suffix}"
        self.TOKEN_EXPIRY_KEY = f"{self.TOKEN_EXPIRY_KEY_PREFIX}{cache_suffix}"
    
    def get_access_token(self):
        """Get cached access token or fetch a new one"""
        # Check if we have a valid cached token
        cached_token = cache.get(self.TOKEN_CACHE_KEY)
        expiry = cache.get(self.TOKEN_EXPIRY_KEY)
        
        if cached_token and expiry:
            # Check if token is still valid (with 5 minute buffer)
            if datetime.now() < expiry - timedelta(minutes=5):
                return cached_token
        
        # Fetch new token
        return self._fetch_new_token()
    
    def _fetch_new_token(self):
        """Fetch a new access token from DigiKey OAuth endpoint using 2-legged flow"""
        try:
            # OAuth 2-legged flow: client credentials grant
            auth_string = f"{self.client_id}:{self.client_secret}"
            auth_bytes = auth_string.encode('ascii')
            auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
            
            response = requests.post(
                self.TOKEN_URL,
                data={
                    'grant_type': 'client_credentials',
                },
                headers={
                    'Authorization': f'Basic {auth_b64}',
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            )
            response.raise_for_status()
            
            data = response.json()
            access_token = data['access_token']
            expires_in = data.get('expires_in', 3600)  # Default to 1 hour
            
            # Cache the token with expiry time
            expiry_time = datetime.now() + timedelta(seconds=expires_in)
            cache.set(self.TOKEN_CACHE_KEY, access_token, expires_in)
            cache.set(self.TOKEN_EXPIRY_KEY, expiry_time, expires_in)
            
            logger.info("Successfully fetched new DigiKey access token")
            return access_token
            
        except requests.exceptions.HTTPError as e:
            # Log detailed error information for debugging
            error_msg = f"Failed to fetch DigiKey access token: {e}"
            if e.response is not None:
                error_msg += f"\nStatus Code: {e.response.status_code}"
                try:
                    error_body = e.response.json()
                    error_msg += f"\nError Response: {error_body}"
                except:
                    error_msg += f"\nError Response Text: {e.response.text}"
                error_msg += f"\nRequest URL: {e.response.url}"
            logger.error(error_msg)
            raise ValueError(f"DigiKey authentication failed: {error_msg}")
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch DigiKey access token: {e}")
            raise ValueError(f"DigiKey authentication request failed: {str(e)}")
    
    def keyword_search(self, keyword, limit=10):
        """
        Search for parts by keyword/MPN using DigiKey API
        
        Args:
            keyword (str): Search keyword or MPN
            limit (int): Maximum number of results to return
            
        Returns:
            list: List of product dictionaries with basic information
        """
        token = self.get_access_token()
        
        try:
            # Try the v4 endpoint first
            response = requests.post(
                self.KEYWORD_SEARCH_URL,
                json={
                    "Keywords": keyword,
                    "RecordCount": limit,
                    "RecordStartPosition": 0,
                    "Filters": {
                        "CategoryIds": [],
                        "FamilyIds": [],
                        "ManufacturerIds": []
                    },
                    "Sort": {
                        "Option": "SortByQuantityAvailable",
                        "Direction": "Descending",
                        "SortParameterId": 0
                    },
                    "RequestedQuantity": 1
                },
                headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json',
                    'X-DIGIKEY-Client-Id': self.client_id,
                    'X-DIGIKEY-Locale-Site': self.locale_site,
                    'X-DIGIKEY-Locale-Language': self.locale_language,
                    'X-DIGIKEY-Locale-Currency': self.locale_currency
                }
            )
            response.raise_for_status()
            
            data = response.json()
            
            # Extract products from response
            products = data.get('Products', [])
            if not products:
                # Try alternative response structures
                products = data.get('SearchResults', []) or data.get('results', []) or []
                logger.debug(f"Using alternative response structure, found {len(products)} products")
            
            logger.debug(f"DigiKey keyword search returned {len(products)} products")
            transformed = self._transform_search_results(products)
            
            return transformed
            
        except requests.exceptions.HTTPError as e:
            # Log detailed error information
            logger.error(f"Failed to search DigiKey parts: {e}")
            if e.response is not None:
                logger.error(f"Response status: {e.response.status_code}")
                logger.error(f"Response body: {e.response.text}")
                logger.error(f"Request URL: {e.response.url}")
            # Re-raise to let the view handle it
            raise
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to search DigiKey parts: {e}")
            raise
    
    def get_product_details(self, digikey_part_number):
        """
        Get detailed product information including specifications
        
        Args:
            digikey_part_number (str): DigiKey part number
            
        Returns:
            dict: Detailed product information with specifications
        """
        token = self.get_access_token()
        
        try:
            # Use GET request with part number in URL path
            # Format: /products/v4/search/{productNumber}/productdetails
            product_details_url = f"{self.PRODUCT_DETAILS_BASE_URL}/{digikey_part_number}/productdetails"
            
            print(f"Fetching product details from: {product_details_url}")
            
            response = requests.get(
                product_details_url,
                headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json',
                    'X-DIGIKEY-Client-Id': self.client_id,
                    'X-DIGIKEY-Locale-Site': self.locale_site,
                    'X-DIGIKEY-Locale-Language': self.locale_language,
                    'X-DIGIKEY-Locale-Currency': self.locale_currency
                }
            )
            
            response.raise_for_status()
            
            data = response.json()
            
            logger.debug(f"DigiKey product details fetched for {digikey_part_number}")
            return self._transform_product_details(data)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to get DigiKey product details: {e}")
            return None
    
    def _transform_search_results(self, products):
        """Transform DigiKey keyword search results to our format"""
        transformed = []
        
        for product in products:
            # Try multiple possible field name variations
            digikey_part_number = (
                product.get('DigiKeyPartNumber') or 
                product.get('digikeyPartNumber') or
                product.get('PartNumber') or
                product.get('partNumber') or
                ''
            )
            
            # If not found, try to extract from ProductUrl
            if not digikey_part_number:
                product_url = product.get('ProductUrl', '') or product.get('productUrl', '')
                if product_url:
                    # Extract part number from URL like: https://www.digikey.com/en/products/detail/murata-electronics/LQW32FT100M0HL/9559540
                    # Pattern: /detail/{manufacturer-slug}/{digikey-part-number}/{product-id}
                    match = re.search(r'/detail/[^/]+/([^/]+)/', product_url)
                    if match:
                        digikey_part_number = match.group(1)
                        logger.debug(f"Extracted DigiKey part number from URL: {digikey_part_number}")
            
            # Try multiple possible field name variations for manufacturer part number
            manufacturer_part_number = (
                product.get('ManufacturerPartNumber') or
                product.get('manufacturerPartNumber') or
                product.get('Mpn') or
                product.get('mpn') or
                product.get('ManufacturerProductNumber') or
                product.get('manufacturerProductNumber') or
                ''
            )
            
            # If manufacturer part number is still empty, try to extract from product URL or other fields
            if not manufacturer_part_number:
                # Sometimes the MPN might be in the URL or other metadata
                # For now, leave it empty - it will be populated from product details if needed
                pass
            
            # Try multiple possible field name variations for manufacturer
            manufacturer = ''
            manufacturer_obj = product.get('Manufacturer') or product.get('manufacturer')
            if isinstance(manufacturer_obj, dict):
                manufacturer = manufacturer_obj.get('Value') or manufacturer_obj.get('value') or manufacturer_obj.get('Name') or manufacturer_obj.get('name') or ''
            elif isinstance(manufacturer_obj, str):
                manufacturer = manufacturer_obj
            
            # Try multiple possible field name variations for description
            # Handle both string and object formats
            product_description_obj = (
                product.get('ProductDescription') or
                product.get('productDescription') or
                product.get('Description') or
                product.get('description') or
                None
            )
            
            # If it's an object, extract the string value
            if isinstance(product_description_obj, dict):
                product_description = (
                    product_description_obj.get('DetailedDescription') or
                    product_description_obj.get('detailedDescription') or
                    product_description_obj.get('ProductDescription') or
                    product_description_obj.get('productDescription') or
                    str(product_description_obj)  # Fallback to string representation
                )
            elif isinstance(product_description_obj, str):
                product_description = product_description_obj
            else:
                product_description = ''
            
            # Extract basic product information
            result = {
                'digikey_part_number': digikey_part_number,
                'manufacturer_part_number': manufacturer_part_number,
                'manufacturer': manufacturer,
                'product_description': product_description,
                'quantity_available': product.get('QuantityAvailable') or product.get('quantityAvailable') or product.get('Quantity') or 0,
                'unit_price': product.get('UnitPrice') or product.get('unitPrice') or product.get('Price') or None,
                'currency': self.locale_currency,  # Use the configured locale currency from integration settings
                'product_url': product.get('ProductUrl') or product.get('productUrl') or '',
                'primary_photo': product.get('PrimaryPhoto') or product.get('primaryPhoto') or product.get('ImageUrl') or product.get('imageUrl') or '',
                'rohs_status': product.get('RohsStatus') or product.get('rohsStatus') or product.get('RoHS') or '',
                'lead_status': product.get('LeadStatus') or product.get('leadStatus') or '',
            }
            
            # Log if we're missing critical fields for debugging
            if not digikey_part_number:
                logger.warning(f"Missing digikey_part_number in product. Available keys: {list(product.keys())}")
            
            transformed.append(result)
        
        return transformed
    
    def _transform_product_details(self, product_data):
        """Transform DigiKey product details to our format"""
        if not product_data:
            logger.warning("Product data is None or empty")
            return None
        
        # The API response might be wrapped in a 'Product' or 'ProductDetails' key
        # Try to unwrap it if needed
        if isinstance(product_data, dict):
            # Check if data is wrapped
            if 'Product' in product_data:
                product_data = product_data['Product']
            elif 'ProductDetails' in product_data:
                product_data = product_data['ProductDetails']
            elif 'product' in product_data:
                product_data = product_data['product']
            elif 'productDetails' in product_data:
                product_data = product_data['productDetails']
        
        # Log the structure for debugging (using print to ensure it reaches terminal)
        print(f"Product data keys: {list(product_data.keys()) if isinstance(product_data, dict) else 'Not a dict'}")
        if isinstance(product_data, dict):
            print(f"Sample product data (first 500 chars): {str(product_data)[:500]}")
            print(f"Full product data structure:\n{json.dumps(product_data, indent=2, default=str)[:2000]}")
        
        # Try multiple possible field name variations
        print(f"Looking for digikey_part_number in product_data keys: {list(product_data.keys()) if isinstance(product_data, dict) else 'Not a dict'}")
        digikey_part_number = (
            product_data.get('DigiKeyPartNumber') or
            product_data.get('digikeyPartNumber') or
            product_data.get('PartNumber') or
            product_data.get('partNumber') or
            product_data.get('ProductNumber') or
            product_data.get('productNumber') or
            ''
        )
        print(f"Initial digikey_part_number from direct fields: '{digikey_part_number}'")
        
        # If still empty, try to extract from ProductUrl
        if not digikey_part_number:
            product_url = product_data.get('ProductUrl', '') or product_data.get('productUrl', '')
            print(f"ProductUrl value: '{product_url}'")
            if product_url:
                # Extract part number from URL like: https://www.digikey.com/en/products/detail/murata-electronics/LQW32FT1R6M8HL/25928784
                match = re.search(r'/detail/[^/]+/([^/]+)/', product_url)
                if match:
                    digikey_part_number = match.group(1)
                    print(f"Extracted DigiKey part number from URL: {digikey_part_number}")
                else:
                    print(f"Could not extract part number from URL: {product_url}")
            else:
                print("No ProductUrl found in product_data")
        
        # Final check - if still empty, log all possible fields
        if not digikey_part_number:
            print(f"WARNING: digikey_part_number is still empty after all extraction attempts!")
            print(f"All product_data keys: {list(product_data.keys()) if isinstance(product_data, dict) else 'Not a dict'}")
            # Try to find any field that might contain the part number
            for key in product_data.keys() if isinstance(product_data, dict) else []:
                if 'part' in key.lower() or 'number' in key.lower():
                    print(f"  {key}: {product_data[key]}")
        
        manufacturer_part_number = (
            product_data.get('ManufacturerProductNumber') or
            product_data.get('manufacturerProductNumber') or
            product_data.get('ManufacturerPartNumber') or
            product_data.get('manufacturerPartNumber') or
            product_data.get('Mpn') or
            product_data.get('mpn') or
            ''
        )
        
        # Try multiple possible field name variations for manufacturer
        manufacturer = ''
        manufacturer_id = ''
        manufacturer_obj = product_data.get('Manufacturer') or product_data.get('manufacturer')
        if isinstance(manufacturer_obj, dict):
            manufacturer = manufacturer_obj.get('Value') or manufacturer_obj.get('value') or manufacturer_obj.get('Name') or manufacturer_obj.get('name') or ''
            manufacturer_id = manufacturer_obj.get('Id') or manufacturer_obj.get('id') or ''
        elif isinstance(manufacturer_obj, str):
            manufacturer = manufacturer_obj
        
        # Try multiple possible field name variations for description
        product_description_obj = (
            product_data.get('ProductDescription') or
            product_data.get('productDescription') or
            product_data.get('Description') or
            product_data.get('description') or
            None
        )
        
        # Handle description which might be string or object
        if isinstance(product_description_obj, dict):
            product_description = (
                product_description_obj.get('DetailedDescription') or
                product_description_obj.get('detailedDescription') or
                product_description_obj.get('ProductDescription') or
                product_description_obj.get('productDescription') or
                ''
            )
            detailed_description = (
                product_description_obj.get('DetailedDescription') or
                product_description_obj.get('detailedDescription') or
                ''
            )
        elif isinstance(product_description_obj, str):
            product_description = product_description_obj
            detailed_description = product_data.get('DetailedDescription') or product_data.get('detailedDescription') or ''
        else:
            product_description = ''
            detailed_description = product_data.get('DetailedDescription') or product_data.get('detailedDescription') or ''
        
        # Extract specifications - try multiple possible structures
        specifications = {}
        
        # Try "Parameters" first (as mentioned by user: ParameterText is key, ValueText is value)
        parameters = (
            product_data.get('Parameters') or
            product_data.get('parameters') or
            product_data.get('ProductAttributes') or
            product_data.get('productAttributes') or
            product_data.get('Attributes') or
            product_data.get('attributes') or
            product_data.get('Specifications') or
            product_data.get('specifications') or
            []
        )
        
        if isinstance(parameters, list):
            for param in parameters:
                if isinstance(param, dict):
                    # Try ParameterText/ValueText format first
                    param_name = (
                        param.get('ParameterText') or
                        param.get('parameterText') or
                        param.get('Parameter') or
                        param.get('parameter') or
                        param.get('Name') or
                        param.get('name') or
                        ''
                    )
                    value = (
                        param.get('ValueText') or
                        param.get('valueText') or
                        param.get('Value') or
                        param.get('value') or
                        ''
                    )
                    if param_name and value:
                        specifications[param_name] = value
        
        logger.debug(f"Extracted {len(specifications)} specifications from DigiKey product")
        
        # Extract pricing information from ProductVariations
        # ProductVariations contains different package types with pricing tiers (StandardPricing)
        pricing_tiers = []
        product_variations = product_data.get('ProductVariations') or product_data.get('productVariations') or []
        
        # Extract pricing from variations - typically we want the standard package type pricing
        # Each variation has StandardPricing array with BreakQuantity, UnitPrice, TotalPrice
        for variation in product_variations:
            standard_pricing = variation.get('StandardPricing') or variation.get('standardPricing') or []
            minimum_order_quantity = variation.get('MinimumOrderQuantity') or variation.get('minimumOrderQuantity') or 1
            
            # Extract each pricing tier
            for price_break in standard_pricing:
                break_quantity = price_break.get('BreakQuantity') or price_break.get('breakQuantity') or 1
                unit_price = price_break.get('UnitPrice') or price_break.get('unitPrice') or price_break.get('Price') or None
                
                if unit_price is not None:
                    pricing_tiers.append({
                        'minimum_order_quantity': max(break_quantity, minimum_order_quantity),
                        'price': float(unit_price),
                        'break_quantity': break_quantity
                    })
        
        # If no pricing tiers found, use the top-level UnitPrice as fallback
        if not pricing_tiers:
            unit_price = product_data.get('UnitPrice') or product_data.get('unitPrice') or product_data.get('Price') or None
            if unit_price is not None:
                pricing_tiers.append({
                    'minimum_order_quantity': 1,
                    'price': float(unit_price),
                    'break_quantity': 1
                })
        
        logger.debug(f"Extracted {len(pricing_tiers)} pricing tiers from DigiKey product")
        
        # Extract additional product information with multiple field name variations
        result = {
            'digikey_part_number': digikey_part_number,
            'manufacturer_part_number': manufacturer_part_number,
            'manufacturer': manufacturer,
            'manufacturer_id': manufacturer_id,
            'product_description': product_description,
            'detailed_description': detailed_description,
            'quantity_available': product_data.get('QuantityAvailable') or product_data.get('quantityAvailable') or product_data.get('Quantity') or 0,
            'unit_price': product_data.get('UnitPrice') or product_data.get('unitPrice') or product_data.get('Price') or None,  # Keep for backward compatibility
            'currency': self.locale_currency,  # Use the configured locale currency from integration settings
            'pricing_tiers': pricing_tiers,  # New: array of pricing tiers for priceCard
            'product_url': product_data.get('ProductUrl') or product_data.get('productUrl') or '',
            'primary_photo': product_data.get('PhotoUrl') or product_data.get('photoUrl') or product_data.get('PrimaryPhoto') or product_data.get('primaryPhoto') or product_data.get('ImageUrl') or product_data.get('imageUrl') or '',
            'datasheet_url': product_data.get('DataSheetUrl') or product_data.get('dataSheetUrl') or product_data.get('DatasheetUrl') or '',
            'rohs_status': (product_data.get('Classifications') or {}).get('RohsStatus', '') if isinstance(product_data.get('Classifications'), dict) else (product_data.get('RohsStatus') or product_data.get('rohsStatus') or product_data.get('RoHS') or ''),
            'reach_status': (product_data.get('Classifications') or {}).get('ReachStatus', '') if isinstance(product_data.get('Classifications'), dict) else '',
            'export_control_classification_number': (product_data.get('Classifications') or {}).get('ExportControlClassNumber', '') if isinstance(product_data.get('Classifications'), dict) else '',
            'production_status': product_data.get('ProductStatus', {}).get('Status', '') if isinstance(product_data.get('ProductStatus'), dict) else (product_data.get('ProductStatus') or product_data.get('productStatus') or ''),
            # Extract ManufacturerLeadWeeks and convert to days (weeks * 7)
            'estimated_factory_lead_days': self._parse_lead_weeks_to_days(product_data.get('ManufacturerLeadWeeks') or product_data.get('manufacturerLeadWeeks') or ''),
            'category': (product_data.get('ProductCategory') or {}).get('Value', '') if isinstance(product_data.get('ProductCategory'), dict) else (product_data.get('ProductCategory') or ''),
            'family': (product_data.get('ProductFamily') or {}).get('Value', '') if isinstance(product_data.get('ProductFamily'), dict) else (product_data.get('ProductFamily') or ''),
            'specifications': specifications,
            'technical_specs': [
                {'name': k, 'value': v} for k, v in specifications.items()
            ]
        }
        
        print(f"Transformed product details - digikey_part_number: '{result['digikey_part_number']}', manufacturer: '{result['manufacturer']}', specs count: {len(specifications)}")
        print(f"manufacturer_part_number: '{result['manufacturer_part_number']}'")
        if specifications:
            print(f"Specifications extracted (first 5): {dict(list(specifications.items())[:5])}")
        else:
            print("WARNING: No specifications extracted!")
        print(f"Full transformed result:\n{json.dumps(result, indent=2, default=str)}")
        
        return result


def get_digikey_client(organization):
    """
    Get or create DigiKey client instance for an organization
    
    Args:
        organization: Organization instance with integration_settings
        
    Returns:
        DigikeyClient instance or None if not configured
    """
    try:
        integration_settings = organization.integration_settings
        if not integration_settings:
            return None
        
        client_id = integration_settings.digikey_client_id
        client_secret = integration_settings.digikey_client_secret
        
        if not client_id or not client_secret:
            return None
        
        # Get locale settings with defaults
        locale_site = integration_settings.digikey_locale_site or "US"
        locale_currency = integration_settings.digikey_locale_currency or "USD"
        locale_language = integration_settings.digikey_locale_language or "en"
        
        return DigikeyClient(
            client_id, 
            client_secret,
            locale_site=locale_site,
            locale_currency=locale_currency,
            locale_language=locale_language
        )
    except Exception as e:
        logger.error(f"Failed to get DigiKey client: {e}")
        return None


def is_digikey_configured(organization):
    """Check if DigiKey API credentials are configured for an organization"""
    try:
        integration_settings = organization.integration_settings
        if not integration_settings:
            return False
        
        client_id = integration_settings.digikey_client_id
        client_secret = integration_settings.digikey_client_secret
        
        return bool(client_id and client_secret and client_id.strip() and client_secret.strip())
    except Exception:
        return False

