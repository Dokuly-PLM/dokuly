"""
Swagger/OpenAPI schema configuration for Dokuly API v1
"""
from drf_yasg import openapi
from drf_yasg.views import get_schema_view
from drf_yasg.generators import OpenAPISchemaGenerator
from rest_framework import permissions


class APIV1SchemaGenerator(OpenAPISchemaGenerator):
    """
    Custom schema generator that only includes API v1 endpoints.
    Filters out all internal endpoints that are not under /api/v1/
    """
    def __init__(self, info, version=None, url=None, patterns=None, urlconf=None):
        """
        Initialize with only API v1 URL patterns.
        """
        # Import API v1 URL patterns
        from API.v1 import urls_parts, urls_assemblies, urls_documents, urls_pcbas
        from API.v1 import urls_production, urls_migrations, urls_projects, urls_customers
        
        # Combine all API v1 URL patterns
        api_v1_patterns = (
            urls_parts.urlpatterns +
            urls_assemblies.urlpatterns +
            urls_documents.urlpatterns +
            urls_pcbas.urlpatterns +
            urls_production.urlpatterns +
            urls_migrations.urlpatterns +
            urls_projects.urlpatterns +
            urls_customers.urlpatterns
        )
        
        # Pass only API v1 patterns to parent
        super().__init__(info, version, url, patterns=api_v1_patterns, urlconf=urlconf)
    
    def get_endpoints(self, request):
        """
        Override to filter endpoints to only include /api/v1/ paths.
        Since we're only passing API v1 patterns to the parent, this is mainly
        a safety check to ensure we don't accidentally include other endpoints.
        get_endpoints returns a dictionary: {path: [(method, view), ...]}
        """
        # Create a mock request without authentication for schema generation
        # This allows the schema to be generated without requiring auth
        if request is None:
            from django.test import RequestFactory
            factory = RequestFactory()
            request = factory.get('/')
        
        endpoints = super().get_endpoints(request)
        
        # Filter to only include API v1 endpoints (safety check)
        # endpoints is a dict: {path: [(method, view), ...]}
        filtered = {}
        for path, methods in endpoints.items():
            # Only include paths that start with /api/v1/
            if path and path.startswith('/api/v1/'):
                filtered[path] = methods
        
        return filtered

# API Information
api_info = openapi.Info(
    title="Dokuly PLM API",
    default_version='v1',
    description="""
    # Dokuly Product Lifecycle Management API Documentation
    
    Welcome to the Dokuly PLM API v1 documentation. This API provides programmatic access to manage products, parts, assemblies, PCBAs, documents, and more.
    
    ## Authentication
    
    The API supports two authentication methods:
    
    ### 1. Token Authentication
    Use Django Knox tokens for authentication. Include the token in the Authorization header:
    ```
    Authorization: Token <your-token>
    ```
    Tokens expire after 96 hours.
    
    ### 2. API Key Authentication
    Use organization-specific API keys with project restrictions. Include the API key in the Authorization header:
    ```
    Authorization: Api-Key <your-api-key>
    ```
    
    ## Base URL
    
    - **Production**: `https://your-domain.com/api/v1/`
    - **Development**: `http://localhost:8000/api/v1/`
    
    
    ## Project-Based Access Control
    
    All main entities (Parts, Assemblies, PCBAs, Documents) are linked to Projects. API access is filtered based on:
    - User's project membership
    - API key project restrictions (if using API key authentication)
    
    ## Revision Control
    
    The Dokuly system implements comprehensive revision control for all main entities:
    - **Latest Revisions**: Only one revision per entity has `is_latest_revision=True`
    - **Revision Numbering**: Configurable per organization (number-based or major-minor)
    - **Revision Notes**: Document changes between revisions
    - **Errata**: Track errors and corrections
    
    For more information, see the [Developer Reference Guide](../DEVELOPER_REFERENCE_GUIDE.md).
    """,
    terms_of_service="https://dokuly.com/terms/",
    contact=openapi.Contact(email="support@dokuly.com"),
    license=openapi.License(name="MIT License"),
)

# Schema view configuration
# Uses custom generator to filter only API v1 endpoints
schema_view = get_schema_view(
    api_info,
    public=True,
    permission_classes=[permissions.AllowAny],  # Allow public access to API docs
    authentication_classes=[],  # No authentication required for viewing docs
    generator_class=APIV1SchemaGenerator,  # Use custom generator to filter endpoints
)

