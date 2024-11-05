from .models import Organization
from django.db.models import Q
from django.core.exceptions import ValidationError
from .models import Subscription
from django.conf import settings
from organizations.models import Subscription, Organization
from profiles.models import Profile
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.db.models import Sum
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
