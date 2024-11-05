from rest_framework import routers
from django.urls.conf import path
from .api import ProfileViewSet
from . import views
from . import viewsNotification


urlpatterns = [
    path('api/profiles/allUsers/', views.fetch_users),
    path('api/profiles/alterPermission/', views.alter_permissions),
    path('api/profiles/update/allowedApps/', views.alter_allowed_apps),
    path('api/profiles/update/profileInfo/<int:userId>/',
         views.update_user_profile),
    path('api/profiles/update/activateUser/', views.activate_user),
    path('api/profiles/post/newUser/', views.new_user_and_profile),
    path('api/profiles/getUser/', views.fetch_current_user_profile),
    path('api/profiles/getUser/<int:userId>/', views.fetch_user_profile),
    path('api/profiles/sendResetPassMail/', views.send_reset_pass_mail),
    path('api/profiles/checkToken/', views.check_token),
    path('api/profiles/resetPass/<int:userId>/', views.reset_password_by_mail),
    path('api/profiles/checkEmail/', views.check_email_unique),
    path('api/profiles/enable2fa/', views.enable_2fa_totp),
    path('api/profiles/disable2fa/', views.remove_2fa_totp),
    path('api/profiles/verify2FA/', views.verify2FA),
    path('api/profiles/enable2faLogin/', views.enable_2fa_totp_from_login),
    # Paddle API
    path('api/profiles/manageSubscriptions/', views.manage_user_subscriptions),
    # Notifications
    path('api/profiles/get/notifications/',
         viewsNotification.get_unread_notifications),
    path('api/profiles/notifications/mark-as-viewed/<int:notification_id>/',
         viewsNotification.mark_notification_as_viewed),
    path('api/profiles/notifications/mark-all-as-viewed/',
         viewsNotification.mark_all_notifications_as_read),
]

router = routers.DefaultRouter()
router.register('api/profiles', ProfileViewSet, 'profiles')

urlpatterns += router.urls
