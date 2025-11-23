from django.urls import path
from rest_framework import routers
from . import views
from . import viewsApiKey
from . import viewsRules
from . import viewsIntegrations

# URL Configuration
urlpatterns = [
    # Organization mutations
    path("api/organizations/get/byUserId/", views.fetch_organization),
    path("api/organizations/get/testUser/", views.fetch_test_user),
    path("api/organizations/create/<int:id>/", views.create_organization),
    path("api/organizations/update/<int:id>/", views.update_organization),

    path("api/organizations/manageActiveModules/", views.manage_active_modules),
    # Subscriptions
    path("api/subscriptions/getProducts/", views.get_checkout_details),
    path(
        "api/checkOrganizationSubscription/", views.check_organization_subscription_type
    ),
    path("api/organizations/removeSubscription/", views.remove_subscription),
    path("api/organizations/refreshSubscriptionData/",
         views.refresh_subscription_data),

    # Currency mutations
    path("api/currency/get/conversion_rates/", views.get_currency_pairs),
    path("api/currency/get/organization_currency/",
         views.get_organization_currency),

    # API Key management
    path("api/organizations/generateAPIKey/", viewsApiKey.generate_api_key),
    path("api/organizations/listAPIKeys/", viewsApiKey.list_api_keys),
    path("api/organizations/deleteAPIKey/<str:key_id>/",
         viewsApiKey.delete_api_key),

    # Rules management
    path("api/rules/get/", viewsRules.fetch_organization_rules),
    path("api/rules/update/", viewsRules.update_organization_rules),
    path("api/rules/check/assembly/<int:assembly_id>/", viewsRules.check_assembly_rules),
    path("api/rules/check/pcba/<int:pcba_id>/", viewsRules.check_pcba_rules),
    path("api/rules/check/part/<int:part_id>/", viewsRules.check_part_rules),
    path("api/rules/check/document/<int:document_id>/", viewsRules.check_document_rules),
    
    # Integration settings
    path("api/integrations/get/", viewsIntegrations.get_integration_settings),
    path("api/integrations/update/", viewsIntegrations.update_integration_settings),
    path("api/integrations/nexar/sellers/", viewsIntegrations.get_nexar_sellers),
    
    # Revision system fixes
    path("api/organizations/checkCorruptedRevisions/", views.check_corrupted_revisions),
    path("api/organizations/previewPartNumberTemplate/", views.preview_part_number_template),
    path("api/organizations/previewFormattedRevisionTemplate/", views.preview_formatted_revision_template),
]
