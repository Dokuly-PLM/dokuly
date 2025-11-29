from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from drf_yasg.views import get_schema_view
from drf_yasg import openapi
from rest_framework import permissions
from API.v1.schema import api_info, APIV1SchemaGenerator
import os

# Check if we're in testing mode
testing_server = bool(int(os.environ.get("DJANGO_TESTING_SERVER", 0)))

# Swagger/OpenAPI Documentation
# Only expose API v1 endpoints (exclude internal endpoints)
# Using custom generator to filter endpoints by path prefix
schema_view = get_schema_view(
    api_info,
    public=True,
    permission_classes=[permissions.AllowAny],
    authentication_classes=[],  # No authentication required for viewing docs
    generator_class=APIV1SchemaGenerator,  # Filter to only /api/v1/ endpoints
)

urlpatterns = [
    path("", include("django_expiring_token.urls")),
    path("", include("frontend.urls")),
    path("", include("accounts.urls")),
    path("", include("profiles.urls")),
    path("", include("timetracking.urls")),
    path("", include("projects.urls")),
    path("", include("customers.urls")),
    path("", include("parts.urls")),
    path("", include("part_numbers.urls")),
    path("", include("assemblies.urls")),
    path("", include("inventory.urls")),
    path("", include("documents.urls")),
    path("", include("images.urls")),
    path("", include("pcbas.urls")),
    path("", include("production.urls")),
    path("", include("purchasing.urls")),
    path("", include("todos.urls")),
    path("", include("sales_opportunities.urls")),
    path("", include("requirements.urls")),
    path("", include("assembly_bom.urls")),
    path("", include("files.urls")),
    path("", include("organizations.urls")),
    path("", include("tenants.urls")),

    # Dokuly API
    path("", include("API.v1.urls_assemblies")),
    path("", include("API.v1.urls_documents")),
    path("", include("API.v1.urls_parts")),
    path("", include("API.v1.urls_pcbas")),
    path("", include("API.v1.urls_production")),
    path("", include("API.v1.urls_migrations")),
    path("", include("API.v1.urls_projects")),
    path("", include("API.v1.urls_customers")),
    
    # Swagger/OpenAPI Documentation URLs
    path('swagger/', schema_view.with_ui('swagger', cache_timeout=0), name='schema-swagger-ui'),
    path('redoc/', schema_view.with_ui('redoc', cache_timeout=0), name='schema-redoc'),
    path('swagger.json', schema_view.without_ui(cache_timeout=0), name='schema-json'),
]

# Only include debug_toolbar URLs if not in testing mode
if not testing_server:
    urlpatterns.append(path("__debug__/", include("debug_toolbar.urls")))

urlpatterns += static(settings.STATIC_ROOT, document_root=settings.STATIC_ROOT)
