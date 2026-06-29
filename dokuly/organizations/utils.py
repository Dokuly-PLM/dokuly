from .models import Organization
from organizations.models import IntegrationSettings
from organizations.models import Subscription, Organization
from .models import Subscription
from profiles.models import Profile

from django.db.models import Q
from django.core.exceptions import ValidationError
from django.conf import settings
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models import Sum
from django.core.mail import get_connection, EmailMessage, EmailMultiAlternatives


def get_dokuly_base_url(request=None):
    """
    Return the base URL (scheme + host) for this Dokuly instance.

    Priority:
      1. DOKULY_BASE_URL env var — explicit override, always wins.
      2. request.build_absolute_uri('/') — auto-detected from the incoming
         HTTP request (scheme, host, port all correct automatically).
         Works for any IP, hostname, HTTP or HTTPS with zero config.
      3. http://<LOCAL_FORWARD_IP> — legacy fallback when no request is available.

    The returned value has NO trailing slash.
    """
    base = getattr(settings, "DOKULY_BASE_URL", None)
    if base:
        return base.rstrip("/")
    if request is not None:
        return request.build_absolute_uri("/").rstrip("/")
    # Last-resort fallback (no request context, no env var)
    local_forward_ip = getattr(settings, "LOCAL_FORWARD_IP", "localhost:8000")
    return f"http://{local_forward_ip}"


def get_email_settings(organization=None):
    """
    Return SMTP settings for the given organization, preferring values stored
    in IntegrationSettings over the env-var defaults in settings.py.

    Returns a dict with keys:
        host, port, host_user, host_password, sender, use_tls, use_ssl
    """
    # Env / settings.py defaults (legacy fallback)
    result = {
        "host": getattr(settings, "EMAIL_HOST", None),
        "port": getattr(settings, "EMAIL_PORT", None),
        "host_user": getattr(settings, "EMAIL_HOST_USER", None),
        "host_password": getattr(settings, "EMAIL_HOST_PASSWORD", None),
        "sender": getattr(settings, "EMAIL_SENDER", None),
        "use_tls": getattr(settings, "EMAIL_USE_TLS", True),
        "use_ssl": getattr(settings, "EMAIL_USE_SSL", False),
    }

    if organization is None:
        return result

    try:
        integration_settings = IntegrationSettings.objects.filter(
            organization=organization
        ).first()
        if integration_settings:
            if integration_settings.email_host:
                result["host"] = integration_settings.email_host
            if integration_settings.email_port is not None:
                result["port"] = integration_settings.email_port
            if integration_settings.email_host_user:
                result["host_user"] = integration_settings.email_host_user
            if integration_settings.email_host_password:
                result["host_password"] = integration_settings.email_host_password
            if integration_settings.email_sender:
                result["sender"] = integration_settings.email_sender
            result["use_tls"] = integration_settings.email_use_tls
            result["use_ssl"] = integration_settings.email_use_ssl
    except Exception:
        pass  # If anything goes wrong, fall back to env settings

    return result


def send_email_with_org_settings(organization, subject, message, recipient_list,
                                  html_message=None, fail_silently=False):
    """
    Send an email using the SMTP settings configured for the given organization.
    Falls back to env-var settings when no DB settings are present.
    """

    email_cfg = get_email_settings(organization)

    try:
        port = int(email_cfg["port"]) if email_cfg["port"] else 587
    except (TypeError, ValueError):
        port = 587

    connection = get_connection(
        backend="django.core.mail.backends.smtp.EmailBackend",
        host=email_cfg["host"] or "",
        port=port,
        username=email_cfg["host_user"] or "",
        password=email_cfg["host_password"] or "",
        use_tls=email_cfg["use_tls"],
        use_ssl=email_cfg["use_ssl"],
        fail_silently=fail_silently,
    )

    from_email = email_cfg["sender"] or email_cfg["host_user"] or ""

    if html_message:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=message,
            from_email=from_email,
            to=recipient_list,
            connection=connection,
        )
        msg.attach_alternative(html_message, "text/html")
    else:
        msg = EmailMessage(
            subject=subject,
            body=message,
            from_email=from_email,
            to=recipient_list,
            connection=connection,
        )

    msg.send(fail_silently=fail_silently)
import requests


def cancel_paddle_subscription(subscription_id):
    """
    Cancel a paddle subscription
    """
    try:
        local_server = settings.LOCAL_SERVER
        url = "https://vendors.paddle.com/api/2.0/subscription/users_cancel"
        if local_server:
            url = "https://sandbox-vendors.paddle.com/api/2.0/subscription/users_cancel"
        # Cancel the subscription
        response = requests.post(
            url,
            data={
                "subscription_id": subscription_id,
                "vendor_id": settings.PADDLE_VENDOR_ID,
                "vendor_auth_code": settings.PADDLE_AUTH_CODE,
            },
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            }
        )

        print(response.json())

        # Check if the request was successful
        if response.status_code == 200:
            return True
        else:
            return False
    except Exception as e:
        print(str(e))
        return False


def update_paddle_subscription_count(
        subscription_id, count):
    """
    Update the quantity of a paddle subscription
    """
    try:
        local_server = settings.LOCAL_SERVER
        url = "https://vendors.paddle.com/api/2.0/subscription/users/update"
        if local_server:
            url = "https://sandbox-vendors.paddle.com/api/2.0/subscription/users/update"
        # print(count, type(count))
        # Cancel the subscription
        response = requests.post(
            url,
            data={
                "subscription_id": subscription_id,
                "vendor_id": settings.PADDLE_VENDOR_ID,
                "vendor_auth_code": settings.PADDLE_AUTH_CODE,
                "quantity": count,
            },
            headers={
                "Content-Type": "application/x-www-form-urlencoded",
                "Accept": "application/json"
            }
        )

        print(response.json())

        res = response.json()

        if "error" in res:
            return False

        # Check if the request was successful
        if "success" in res:
            return res["success"]  # Either True or False
        else:
            return False
    except Exception as e:
        print(str(e))
        return False


def update_subscriptions_from_paddle(user):
    try:
        profile = Profile.objects.get(user=user)
        if profile.role not in ["Owner"]:
            return

        # Determine the correct API URL
        url = "https://vendors.paddle.com/api/2.0/subscription/users"
        if settings.LOCAL_SERVER:
            url = "https://sandbox-vendors.paddle.com/api/2.0/subscription/users"

        # Fetch and update all subscriptions
        subscriptions = Subscription.objects.all()
        for sub in subscriptions:
            try:
                # Fetch subscription data
                response = requests.post(
                    url,
                    data={
                        "subscription_id": sub.subscription_data.get("subscription_id"),
                        "vendor_id": settings.PADDLE_VENDOR_ID,
                        "vendor_auth_code": settings.PADDLE_AUTH_CODE,
                    },
                    headers={
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Accept": "application/json"
                    }
                )
                res = response.json()
                if not res.get("success"):
                    continue

                # Update the subscription data
                # Adjust based on actual API response structure
                subscription_data = res['response'][0]
                new_data = sub.subscription_data
                new_data.update({
                    "status": subscription_data.get("state"),
                    "quantity": subscription_data.get("quantity")
                })
                sub.count = subscription_data.get("quantity")
                sub.save()
            except Exception as e:
                print(f"Failed to fetch or update subscription data: {e}")
        return subscriptions
    except Exception as e:
        print(f"Failed to update subscriptions: {e}")
        return False


def deactivate_extra_users(organization: Organization, allowed_users: int):
    if not isinstance(organization, Organization):
        raise ValueError(
            "The provided organization is not a valid Organization object.")

    with transaction.atomic():
        # Fetch profiles associated with the organization, excluding 'Viewer' role
        profiles = Profile.objects.filter(organization_id=organization.pk).exclude(
            role='Viewer').order_by('-role')

        # Count active users, excluding 'Viewer'
        active_profiles = profiles.filter(is_active=True)
        active_count = active_profiles.count()

        # Deactivate users if necessary
        if active_count > allowed_users:
            deactivate_count = active_count - allowed_users
            for role_priority in ['User', 'Developer', 'Admin']:
                if deactivate_count <= 0:
                    break
                users_to_deactivate = active_profiles.filter(
                    role=role_priority)
                count_to_deactivate = min(
                    users_to_deactivate.count(), deactivate_count)

                # Update the first 'count_to_deactivate' users to be inactive
                users_to_deactivate_ids = users_to_deactivate.values_list('id', flat=True)[
                    :count_to_deactivate]

                Profile.objects.filter(id__in=list(
                    users_to_deactivate_ids)).update(is_active=False)

                deactivate_count -= count_to_deactivate


def update_organization_users(organization: Organization):
    if not isinstance(organization, Organization):
        raise ValueError(
            "The provided organization is not a valid Organization object.")

    # Aggregate the total allowed users from all subscriptions for the organization
    total_allowed_users = Subscription.objects.filter(
        organization=organization).aggregate(Sum('count'))['count__sum']

    if total_allowed_users is not None:
        deactivate_extra_users(organization, total_allowed_users)
    else:
        raise ValueError(
            "No subscriptions found or allowed users information is missing for the organization.")
