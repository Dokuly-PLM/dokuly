from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static

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
    path("", include("serialnumbers.urls")),
    path("", include("sales_opportunities.urls")),
    path("", include("reimbursements.urls")),
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

    path("__debug__/", include("debug_toolbar.urls")),
] + static(settings.STATIC_ROOT, document_root=settings.STATIC_ROOT)
