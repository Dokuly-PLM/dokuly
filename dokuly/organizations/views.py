from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.db import transaction
from profiles.models import Profile
from profiles.serializers import ProfileSerializer
from .serializers import (
    CustomerOrganizationSerializer,
    OrgComponentVaultAPIKeySerializer,
    OrganizationManagerSerializer,
    SubscriptionSerializer,
)
from .models import Organization, Subscription
from django.contrib.auth.decorators import login_required
import os
import uuid
import requests
from datetime import datetime, timezone, timedelta
from knox.models import AuthToken
from knox.settings import CONSTANTS
from django.utils import timezone
from django.conf import settings
from profiles.views import check_permissions_owner
from organizations.utils import (cancel_paddle_subscription,
                                 update_organization_users,
                                 update_paddle_subscription_count,
                                 update_subscriptions_from_paddle)


def validate_token(token):
    objs = AuthToken.objects.filter(
        token_key=token[: CONSTANTS.TOKEN_KEY_LENGTH])

    if len(objs) == 0:
        return None

    token_obj = objs.first()

    # Check if the token has expired using the 'expiry' field
    if token_obj.expiry < timezone.now():
        return None

    return token_obj.user


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def refresh_subscription_data(request):
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    user = request.user
    if not check_permissions_owner(user):
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    try:
        new_subscriptions = update_subscriptions_from_paddle(user)
        serializer = SubscriptionSerializer(new_subscriptions, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def remove_subscription(request):
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    user = request.user
    if not check_permissions_owner(user):
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    try:
        # If the count of the subscription id is eq to quantity to remove, cancel the subscription
        # Else, put the new quantity in the subscription
        data = request.data
        if "subscription_id" not in data and "quantity" not in data:
            return Response("Invalid query parameters", status=status.HTTP_400_BAD_REQUEST)
        subscription_id = data["subscription_id"]
        quantity = data["quantity"]
        if not isinstance(quantity, int):
            quantity = int(quantity)
        organization = Organization.objects.get(
            id=user.profile.organization_id)
        subscription = Subscription.objects.get(
            subscription_data__subscription_id=subscription_id)
        current_quantity = subscription.count

        if current_quantity == quantity:
            ok = cancel_paddle_subscription(subscription_id)
            if ok:
                subscription.delete()
                try:
                    update_organization_users(organization)
                except Exception as e:
                    print(str(e))
                    pass
                return Response("Subscription cancelled", status=status.HTTP_200_OK)
            return Response("Failed to cancel subscription", status=status.HTTP_400_BAD_REQUEST)

        else:
            new_count = current_quantity - quantity
            if new_count < 0 or new_count > current_quantity:
                return Response("Invalid quantity", status=status.HTTP_400_BAD_REQUEST)
            ok = update_paddle_subscription_count(
                subscription_id, new_count)
            if ok:
                subscription.count = new_count
                subscription.subscription_data["quantity"] = new_count
                subscription.save()
                try:
                    update_organization_users(organization)
                except Exception as e:
                    print(str(e))
                    pass
                return Response("Subscription updated", status=status.HTTP_200_OK)
            return Response("Failed to update subscription", status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(str(e))
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def get_checkout_details(request):
    data = request.data
    try:
        local_server = bool(int(os.environ.get("DJANGO_LOCAL_SERVER", 0)))
        if local_server:
            if "index" in data:
                if data["index"] == 1:
                    product_id = 61182
                    return Response(
                        {
                            "product_id": product_id,
                        }
                    )
                elif data["index"] == 2:
                    product_id = 70048
                    return Response(
                        {
                            "product_id": product_id,
                        }
                    )
        if "index" in data:
            if data["index"] == 1:
                product_id = 847269
                return Response(
                    {
                        "product_id": product_id,
                    }
                )
            elif data["index"] == 2:
                product_id = 847241
                return Response(
                    {
                        "product_id": product_id,
                    }
                )
        return Response("Missing index in data", status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(("GET", "PUT"))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def send_request_to_component_vault(request):
    if request.user == None:
        return Response("Invalid query parameters", status=status.HTTP_401_UNAUTHORIZED)
    data = request.data

    if not ("password" in data or "api_key" in data):
        return Response(
            "No key sent with the request", status=status.HTTP_400_BAD_REQUEST
        )

    if "method" not in data:
        return Response(
            "No method sent with the request", status=status.HTTP_400_BAD_REQUEST
        )

    method = data["method"].upper()

    request_func_map = {
        "PUT": put_request,
        "GET": get_request,
        "POST": post_request,
    }

    if method not in request_func_map:
        return Response(
            f"Method not allowed, {method}", status=status.HTTP_405_METHOD_NOT_ALLOWED
        )

    response = request_func_map[method](data)

    if not response.ok:
        # Handle other non-success status codes here (if needed)
        return Response(response.text, status=status.HTTP_400_BAD_REQUEST)

    response_data = ""
    try:
        response_data = response.json()
    except Exception as e:
        response_data = response.text  # Might not contain any json, try text
        print(str(e))

    return Response(response_data, status=status.HTTP_200_OK)


def get_request(data):
    url = "https://componentvault.com"
    return requests.get(
        f"{url}/{data['request']}",
        headers=_get_auth_header(data),
        data=_get_auth_data(data),
    )


def put_request(data):
    url = "https://componentvault.com"
    return requests.put(
        f"{url}/{data['request']}",
        headers=_get_auth_header(data),
        data=_get_auth_data(data),
    )


def post_request(data):
    url = "https://componentvault.com"
    return requests.post(
        f"{url}/{data['request']}",
        headers=_get_auth_header(data),
        data=_get_auth_data(data),
    )


def _get_auth_header(data):
    if "api_key" in data:
        return {"Authorization": "Api-Key " + data["api_key"]}
    return {}


def _get_auth_data(data):
    if "password" in data:
        return {"password": data["password"]}
    return {}


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def fetch_component_vault_api_key(request):
    if request.user == None:
        return Response("Invalid query parameters", status=status.HTTP_401_UNAUTHORIZED)
    try:
        user = request.user
        user_profile = Profile.objects.get(user__pk=user.id)
        userSerializer = ProfileSerializer(user_profile, many=False)
        org_id = -1
        if "organization_id" in userSerializer.data:
            if userSerializer.data["organization_id"] != None:
                org_id = userSerializer.data["organization_id"]
        if org_id == -1:
            return Response(
                "No connected organization found", status.HTTP_204_NO_CONTENT
            )
        # Cannot use only here as it skips the decryption of the API key, e.g. no .only("component_vault_api_key")
        org = Organization.objects.get(id=org_id)
        serializer = OrgComponentVaultAPIKeySerializer(org, many=False)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(["GET"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def fetch_organization(request):
    try:
        user_profile = get_object_or_404(Profile, user=request.user)
        org_id = user_profile.organization_id
        if org_id is None:
            return Response(
                "No connected organization found", status.HTTP_204_NO_CONTENT
            )

        organization = get_object_or_404(Organization, id=org_id)
        org_serializer = OrganizationManagerSerializer(organization)
        return Response(org_serializer.data, status=status.HTTP_200_OK)

    except Profile.DoesNotExist:
        return Response("User profile not found", status=status.HTTP_404_NOT_FOUND)
    except Organization.DoesNotExist:
        return Response("Organization not found", status=status.HTTP_404_NOT_FOUND)


@api_view(["POST"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def create_organization(request):
    if not request.data:
        return Response("Invalid data", status=status.HTTP_400_BAD_REQUEST)

    org_count = Organization.objects.count()
    local_server = bool(int(os.environ.get("DJANGO_LOCAL_SERVER", 0)))
    if org_count >= 1 and not local_server:
        return Response("Limit reached", status=status.HTTP_204_NO_CONTENT)

    serializer = CustomerOrganizationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        Profile.objects.update(organization_id=serializer.data["id"])
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def update_organization(request, id):
    organization = get_object_or_404(Organization, id=id)
    data = request.data

    with transaction.atomic():
        for field in [
            "org_number",
            "name",
            "num_employees",
            "description",
            "file_ids",
            "image_ids",
            "logo_id",
            "test_user",
            "enforce_2fa",
            "component_vault_api_key",
            "delivery_address",
            "postal_code",
            "country",
            "billing_address",
        ]:
            if field in data:
                setattr(organization, field, data[field])

        if "currency" in data:
            organization.currency = data["currency"]
            organization.currency_update_time = (
                timezone.now()
            )  # Set the update time to now

        if "logo" in data:
            file = request.FILES["logo"]
            organization.logo.save(f"{uuid.uuid4().hex}/{file.name}", file)

        if "enforce_2fa" in data and organization.enforce_2fa != data["enforce_2fa"]:
            if not data["enforce_2fa"]:
                Profile.objects.all().update(mfa_hash=None, mfa_validated=False)

        organization.save()
        Profile.objects.update(organization_id=organization.id)
        update_currency_pairs()    # Update the currency pairs

    serializer = CustomerOrganizationSerializer(organization)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(["PUT"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def manage_active_modules(request):
    organization = Organization.objects.get(
        id=request.user.profile.organization_id)
    data = request.data

    with transaction.atomic():
        for field in [
            "time_tracking_is_enabled",
            "document_is_enabled",
            "pcba_is_enabled",
            "assembly_is_enabled",
            "procurement_is_enabled",
            "requirement_is_enabled",
        ]:
            if field in data:
                setattr(organization, field, data[field])

        organization.save()

    serializer = CustomerOrganizationSerializer(organization)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
def configure_test_user(request, id):
    """A separate edit view to separate out test_user configuration."""
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    if request.data == None or id == None:
        return Response("Invalid query parameters", status=status.HTTP_400_BAD_REQUEST)

    if request.method == "PUT":
        data = request.data
        if "test_user" in data:
            Organization.objects.filter(id=id).update(
                test_user=data["test_user"])
        org = Organization.objects.get(id=id)
        entry = {"test_user": org.test_user}
        return Response(entry, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
def fetch_test_user(request):
    """A separate view to fetch the test_user configuration."""
    if request.user == None:
        return Response("Invalid query parameters", status=status.HTTP_400_BAD_REQUEST)
    user = request.user
    user_profile = Profile.objects.get(user__pk=user.id)
    userSerializer = ProfileSerializer(user_profile, many=False)
    org_id = -1
    if "organization_id" in userSerializer.data:
        if userSerializer.data["organization_id"] != None:
            org_id = userSerializer.data["organization_id"]
    if org_id == -1:
        return Response("No connected organization found", status.HTTP_204_NO_CONTENT)
    org = Organization.objects.get(id=org_id)
    entry = {"id": org.id, "test_user": org.test_user}
    return Response(entry, status=status.HTTP_200_OK)


def update_currency_pairs():
    """View to update the currency pairs."""
    organization = Organization.objects.get(id=1)
    from_currency = Organization.objects.get(id=1).currency
    # TODO: Incorporate basic currency based on organization
    if settings.CURRENCY_API == None or settings.CURRENCY_API == "":
        data = {"USD/NOK": 10.5, "USD/EUR": 0.93, "USD/GBP": 0.79}
        return data
    url = f"{settings.CURRENCY_API}{from_currency}"
    response = requests.get(url)
    data = response.json()
    organization.currency_update_time = datetime.now(timezone.utc)
    organization.currency_conversion_rates = data["conversion_rates"]
    organization.save()
    print("Currency pairs updated with the following currency: " + organization.currency)
    return data["conversion_rates"]


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_currency_pairs(request):
    """A separate view to fetch the currency pairs."""
    organization = Organization.objects.get(
        id=request.user.profile.organization_id)
    if organization.currency_update_time == None:
        return Response(update_currency_pairs(), status=status.HTTP_200_OK)
    if organization.currency_update_time < datetime.now(timezone.utc) - timedelta(
        hours=24
    ):
        return Response(update_currency_pairs(), status=status.HTTP_200_OK)
    return Response(organization.currency_conversion_rates, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_organization_currency(request):
    """A separate view to fetch the organization currency."""
    organization = Organization.objects.get(
        id=request.user.profile.organization_id)
    return Response(organization.currency, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def check_organization_subscription_type(request):
    if request.user == None:
        return Response("Invalid query parameters", status=status.HTTP_401_UNAUTHORIZED)
    user = request.user
    try:
        user_profile = Profile.objects.get(user__pk=user.id)
        userSerializer = ProfileSerializer(user_profile, many=False)
        org_id = -1
        if "organization_id" in userSerializer.data:
            if userSerializer.data["organization_id"] != None:
                org_id = userSerializer.data["organization_id"]
        if org_id == -1:
            return Response(
                "No connected organization found", status.HTTP_204_NO_CONTENT
            )
        type = get_subscription_type(request.user, request)
        return Response(type, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


def get_subscription_type(user, request):
    local_server = bool(int(os.environ.get("DJANGO_LOCAL_SERVER", 0)))
    if local_server:
        return "Professional"
    if str(request.tenant) == "nd":
        return "Professional"
    try:
        user_profile = Profile.objects.get(user__pk=user.id)
        userSerializer = ProfileSerializer(user_profile, many=False)
        org_id = -1
        if "organization_id" in userSerializer.data:
            if userSerializer.data["organization_id"] != None:
                org_id = userSerializer.data["organization_id"]
        if org_id == -1:
            return Response(
                "No connected organization found", status.HTTP_204_NO_CONTENT
            )
        type = "Free"
        subscriptions = Subscription.objects.all()
        if len(subscriptions) != 0:
            if (
                int(subscriptions[0].subscription_data.get(
                    "subscription_plan_id"))
                == 847269
            ):
                type = "Professional"
            elif (
                int(subscriptions[0].subscription_data.get(
                    "subscription_plan_id"))
                == 847241
            ):
                type = "Professional"
        else:
            type = "Free"
        return type
    except Exception as e:
        print(str(e))
        return None
