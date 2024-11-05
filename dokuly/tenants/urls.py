from django.urls import path
from rest_framework import routers
from . import views
from . import viewsSelfHosting

# Public page signup flow goes:
# 0. User hits the start free trial button
# 1. /api/checkout/details/ - Fetches the checkout details
# 2. Paddle checkout page
# 3. If successful checkout -> /api/paddle/webhook/ is called
# 4. Call api/verify/checkout/ to verify the checkout, this polls on successful webhook
# 5. If verified, we call api/create-checkout-session-free-beta/ (This is only for free tier)
# 6. This creates a tenant and returns the tenant details

# URL Configuration
urlpatterns = [
    # Tenant views
    path('api/tenant/deleteTenant/', views.delete_tenant),
    path('api/tenants/createOrUpdate/', views.create_or_update_tenant),
    path('api/tenants/checkDuplicate/', views.check_duplicate_tenant),
    path('api/tenants/fetchTenant/', views.fetch_tenants),
    path('api/tenants/fetchDomains/', views.fetch_domains),
    path('api/tenants/server/check-local/', views.check_localserver),
    path('api/tenants/getMaxUsers/', views.check_max_users_on_subscription),
    path('api/ping-server/', views.ping_server),
    # Free beta, self checkout post stripe
    path("api/create-checkout-session-free-beta/",
         views.create_checkout_free_beta),
    # Paddle API - Public
    path('api/checkout/details/', views.get_checkout_details,
         name='checkout-details'),
    # Paddle Webhooks
    path('api/paddle/webhook/', views.paddle_webhook, name="paddle-webhook"),
    path('api/paddle/tenantwebhook/',
         views.paddle_tenant_webhook, name="paddle-webhook"),

    path('api/verify/checkout/', views.verify_checkout_paddle),
    path('api/verify/tenantCheckout/', views.verify_paddle_tenant_checkout),
    path("api/removeFailedSubscription/", views.remove_failed_subscription),

    path('api/organizations/verifyTenantSubscription/',
         views.verify_new_subscription),
    path('api/verify/tenantCheckoutParams/',
         views.verify_urlparams_pre_checkout),
    path('api/check-server-status/', views.check_server_status),
    path('api/verify-checkout-session/', views.verify_checkout_session),

    # Self hosting specific views
    path("api/selfhosting/initTenant/",
         viewsSelfHosting.initialize_tenant_for_self_hosting),

    # DEPRECATED
    path('api/stripe-config/', views.fetch_stripe_config),
    path('api/signup/fetchPrices/', views.fetch_prices),
    path('api/create-checkout-session/', views.create_checkout_session),
    path("api/createCheckoutSession/", views.create_checkout_public),
]
