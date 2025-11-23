"""
Nexar API Client for Nexar integration
Handles OAuth2 authentication and part search functionality
"""

import os
import requests
from datetime import datetime, timedelta
from django.core.cache import cache
import logging

logger = logging.getLogger(__name__)


def get_nexar_credentials_from_db():
    """Get Nexar credentials from IntegrationSettings in database"""
    try:
        from organizations.models import IntegrationSettings
        from profiles.models import Profile
        
        # Get the first available integration settings
        # In a multi-tenant system, this would be user-specific
        integration_settings = IntegrationSettings.objects.first()
        
        if integration_settings:
            return {
                'client_id': integration_settings.nexar_client_id,
                'client_secret': integration_settings.nexar_client_secret
            }
        return None
    except Exception as e:
        logger.warning(f"Could not fetch Nexar credentials from database: {e}")
        return None


class NexarClient:
    """Client for Nexar API with OAuth2 token management"""
    
    TOKEN_URL = "https://identity.nexar.com/connect/token"
    API_URL = "https://api.nexar.com/graphql"
    TOKEN_CACHE_KEY = "nexar_access_token"
    TOKEN_EXPIRY_KEY = "nexar_token_expiry"
    
    def __init__(self, client_id=None, client_secret=None):
        # Try credentials in this order:
        # 1. Explicitly passed credentials (for user-specific calls)
        # 2. Database credentials (IntegrationSettings)
        
        if client_id and client_secret:
            self.client_id = client_id
            self.client_secret = client_secret
        else:
            # Get credentials from database
            db_creds = get_nexar_credentials_from_db()
            if db_creds and db_creds['client_id'] and db_creds['client_secret']:
                self.client_id = db_creds['client_id']
                self.client_secret = db_creds['client_secret']
            else:
                self.client_id = None
                self.client_secret = None
        
        if not self.client_id or not self.client_secret:
            raise ValueError("Nexar credentials not found. Please configure them in Admin → Settings → Integrations → Nexar")
    
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
        """Fetch a new access token from Nexar OAuth endpoint"""
        try:
            response = requests.post(
                self.TOKEN_URL,
                data={
                    'grant_type': 'client_credentials',
                    'client_id': self.client_id,
                    'client_secret': self.client_secret,
                    'scope': 'supply.domain'
                },
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            response.raise_for_status()
            
            data = response.json()
            access_token = data['access_token']
            expires_in = data.get('expires_in', 3600)  # Default to 1 hour
            
            # Cache the token with expiry time
            expiry_time = datetime.now() + timedelta(seconds=expires_in)
            cache.set(self.TOKEN_CACHE_KEY, access_token, expires_in)
            cache.set(self.TOKEN_EXPIRY_KEY, expiry_time, expires_in)
            
            logger.info("Successfully fetched new Nexar access token")
            return access_token
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to fetch Nexar access token: {e}")
            raise
    
    def search_parts(self, mpn, limit=10):
        """
        Search for parts by MPN using Nexar GraphQL API
        
        Args:
            mpn (str): Manufacturer Part Number to search for
            limit (int): Maximum number of results to return
            
        Returns:
            list: List of part dictionaries with relevant fields
        """
        token = self.get_access_token()
        
        # GraphQL query for part search
        query = """
        query SearchParts($mpn: String!, $limit: Int!) {
          supSearch(q: $mpn, limit: $limit) {
            results {
              part {
                id
                mpn
                name
                manufacturer {
                  name
                  id
                }
                shortDescription
                category {
                  name
                  path
                }
                descriptions {
                  text
                  creditString
                }
                specs {
                  attribute {
                    name
                    shortname
                  }
                  displayValue
                }
                bestDatasheet {
                  url
                  name
                }
                medianPrice1000 {
                  price
                  currency
                }
                totalAvail
                manufacturerUrl
                bestImage {
                  url
                  creditString
                }
              }
            }
          }
        }
        """
        
        variables = {
            "mpn": mpn,
            "limit": limit
        }
        
        try:
            response = requests.post(
                self.API_URL,
                json={'query': query, 'variables': variables},
                headers={
                    'Authorization': f'Bearer {token}',
                    'Content-Type': 'application/json'
                }
            )
            response.raise_for_status()
            
            data = response.json()
            
            # Check for GraphQL errors
            if 'errors' in data:
                logger.error(f"GraphQL errors: {data['errors']}")
                return []
            
            # Extract and transform results
            results = data.get('data', {}).get('supSearch', {}).get('results', [])
            return self._transform_results(results)
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to search Nexar parts: {e}")
            return []
    
    def _transform_results(self, results):
        """Transform Nexar API results to our format"""
        transformed = []
        
        for item in results:
            part = item.get('part', {})
            
            # Get display name - prefer shortDescription (concise), fallback to MPN
            # The 'name' field is often too long, combining multiple descriptions
            short_desc = part.get('shortDescription', '').strip()
            mpn = part.get('mpn', '').strip()
            
            # Use shortDescription if available and not too long, otherwise use MPN
            if short_desc and len(short_desc) <= 150:
                display_name = short_desc
            elif mpn:
                display_name = mpn
            else:
                # Fallback to truncated 'name' field if nothing else available
                name = part.get('name', '').strip()
                display_name = name[:147] + '...' if len(name) > 150 else name
            
            # Get description (prefer short description, fallback to first description)
            description = part.get('shortDescription', '')
            if not description and part.get('descriptions'):
                description = part['descriptions'][0].get('text', '')
            
            # Get category info
            category = ''
            if part.get('category'):
                category = part['category'].get('name', '')
            
            # Get datasheet URL and name
            datasheet_url = ''
            datasheet_name = ''
            if part.get('bestDatasheet'):
                datasheet_url = part['bestDatasheet'].get('url', '')
                datasheet_name = part['bestDatasheet'].get('name', '')
            
            # Get image URL
            image_url = ''
            if part.get('bestImage'):
                image_url = part['bestImage'].get('url', '')
            
            # Get pricing info
            price = None
            currency = 'USD'
            if part.get('medianPrice1000'):
                price = part['medianPrice1000'].get('price')
                currency = part['medianPrice1000'].get('currency', 'USD')
            
            # Get manufacturer
            manufacturer = ''
            manufacturer_id = ''
            if part.get('manufacturer'):
                manufacturer = part['manufacturer'].get('name', '')
                manufacturer_id = part['manufacturer'].get('id', '')
            
            # Process specs - extract temperature and filter for display
            specs = part.get('specs', [])
            technical_specs = []
            min_temp = None
            max_temp = None
            
            for spec in specs:
                attr = spec.get('attribute', {})
                attr_name = attr.get('name', '')
                attr_shortname = attr.get('shortname', '')
                display_value = spec.get('displayValue', '')
                
                # Extract temperature values
                if attr_shortname in ['operating_temperature', 'temp_operating', 'operating_temp']:
                    if 'min' in attr_name.lower() or 'minimum' in attr_name.lower():
                        min_temp = display_value
                    elif 'max' in attr_name.lower() or 'maximum' in attr_name.lower():
                        max_temp = display_value
                    technical_specs.append({
                        'name': attr_name,
                        'value': display_value
                    })
                else:
                    # Add other specs
                    technical_specs.append({
                        'name': attr_name,
                        'value': display_value
                    })
            
            # Build the result - internal IDs are separate from technical_specs
            result = {
                'nexar_part_id': part.get('id', ''),
                'mpn': part.get('mpn', ''),
                'display_name': display_name,
                'manufacturer': manufacturer,
                'manufacturer_id': manufacturer_id,
                'category': category,
                'description': description,
                'datasheet': datasheet_url,
                'datasheet_name': datasheet_name,
                'image_url': image_url,
                'price': price,
                'currency': currency,
                'total_avail': part.get('totalAvail', 0),
                'manufacturer_url': part.get('manufacturerUrl', ''),
                'technical_specs': technical_specs
            }
            
            # Add temperature fields if found
            if min_temp:
                result['min_operating_temp'] = min_temp
            if max_temp:
                result['max_operating_temp'] = max_temp
            
            transformed.append(result)
        
        return transformed


# Singleton instance
_nexar_client = None


def get_nexar_client():
    """Get or create Nexar client instance"""
    global _nexar_client
    if _nexar_client is None:
        _nexar_client = NexarClient()
    return _nexar_client




def is_nexar_configured():
    """Check if Nexar API credentials are configured in database"""
    db_creds = get_nexar_credentials_from_db()
    return bool(db_creds and db_creds['client_id'] and db_creds['client_secret'])

