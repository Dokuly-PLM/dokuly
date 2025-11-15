from django.urls import path
from rest_framework import routers
from . import views
from . import viewsApiKey

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

    
    # Revision system fixes
    path("api/organizations/checkCorruptedRevisions/", views.check_corrupted_revisions),
]
