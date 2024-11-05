from rest_framework import status, response
from django.shortcuts import render
from django.http import HttpResponse
from production.models import Production
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from django.core.mail import send_mail
from profiles.models import Profile
from profiles.serializers import ProfileSerializer
from files.serializers import FileSerializer
from files.models import File
from accounts.models import User
from accounts.serializers import UserSerializer
from organizations.models import Organization
from django.conf import settings
from django.db.models import Q
from .models import Tenant, Domain, SignupInfo
from django.utils.crypto import get_random_string
from .serializers import TenantSerializer, SignUpSerializer
from organizations.models import Organization, Subscription
from organizations.serializers import (
    CustomerOrganizationSerializer,
    SubscriptionSerializer,
)
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from knox.auth import TokenAuthentication
import json
import os
import datetime
from dateutil.relativedelta import relativedelta
from django_tenants.utils import schema_context, tenant_context, get_tenant_model
from projects.models import Project, Task
from customers.models import Customer
from accounts.serializers import RegisterSerializer
from knox.models import AuthToken
import string
import random
import requests
from json import loads
from datetime import datetime
from datetime import date
from domains.models import DomainNames
from domains.serializers import DomainSerializer
from django.contrib.auth.models import AnonymousUser
import uuid
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
import collections
import base64
from django.db.models import Exists, OuterRef
from django.contrib.postgres.fields import JSONField
from organizations.views import validate_token
from django.shortcuts import get_object_or_404
from django.db.models import Sum, F
from Crypto.PublicKey import RSA
from Crypto.Signature import PKCS1_v1_5
import phpserialize
from .utils import send_email_confirmation, send_workspace_creation_email
from documents.models import Document_Prefix
from django.http import QueryDict
from organizations.utils import cancel_paddle_subscription

try:
    from Crypto.Hash import SHA1
except ImportError:
    # Maybe it's called SHA
    from Crypto.Hash import SHA as SHA1


@api_view(("POST", "PUT"))
@renderer_classes((JSONRenderer,))
@csrf_exempt
def verify_checkout_paddle(request):
    # if checkout is good return true and 200
    data = request.data
    try:
        if "checkout_id" in data:
            existing_signup = SignupInfo.objects.filter(
                subscription_info__contains={
                    "checkout_id": data["checkout_id"]}
            ).first()
            if existing_signup:
                # Do something with the existing_signup object
                return Response(
                    SignUpSerializer(existing_signup, many=False).data,
                    status=status.HTTP_200_OK,
                )
            else:
                # Create a new SignupInfo object or perform other actions
                return Response(
                    "No response from paddle yet", status=status.HTTP_204_NO_CONTENT
                )
        return Response(False, status=status.HTTP_406_NOT_ACCEPTABLE)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(("PUT", "POST"))
@renderer_classes((JSONRenderer,))
@csrf_exempt
def verify_paddle_tenant_checkout(request):
    # if checkout is good return true and 200
    data = request.data
    try:
        if "checkout_id" in data:
            if "tenant" in data:
                with schema_context(data["tenant"]):
                    print("Attempt creating subscription")
                    existing_signup = Subscription.objects.filter(
                        subscription_data__contains={
                            "checkout_id": data["checkout_id"]}
                    ).first()
                    existing_signup.checkout_status = True
                    existing_signup.save()
                    if existing_signup:
                        # Do something with the existing_signup object
                        return Response(
                            SubscriptionSerializer(
                                existing_signup, many=False).data,
                            status=status.HTTP_200_OK,
                        )
                    else:
                        # Create a new SignupInfo object or perform other actions
                        return Response(
                            "No response from paddle yet",
                            status=status.HTTP_204_NO_CONTENT,
                        )
        return Response(False, status=status.HTTP_406_NOT_ACCEPTABLE)
    except Exception as e:
        print(str(e))
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


def fetch_paddle_products(paddle_endpoint):
    BEARER_TOKEN = settings.PADDLE_API_AUTH_CODE
    headers = {"Authorization": f"Bearer {BEARER_TOKEN}"}
    response = requests.get(paddle_endpoint, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        return None  # or handle error differently


@api_view(("PUT", "POST"))
@renderer_classes((JSONRenderer,))
def verify_urlparams_pre_checkout(request):
    data = request.data
    if data is None:
        return Response({"detail": "No data"}, status=status.HTTP_400_BAD_REQUEST)

    organization_id = data.get("organization_id", None)
    tenant = data.get("tenant", None)
    checkout_id = data.get("checkout_id", None)
    token = data.get("token", None)

    if organization_id is None:
        return Response(
            {"detail": "Organization id not valid"}, status=status.HTTP_400_BAD_REQUEST
        )

    if tenant is None:
        return Response(
            {"detail": "Invalid tenant"}, status=status.HTTP_400_BAD_REQUEST
        )

    try:
        with schema_context(tenant):
            # Try to get user from token
            user = validate_token(token)
            if user is None:
                return Response(
                    {"detail": "User not found"}, status=status.HTTP_400_BAD_REQUEST
                )

            # Add checkout_status=False to filter
            exists = (
                Subscription.objects.annotate(
                    has_checkout_id=Exists(
                        Subscription.objects.filter(
                            organization_id=organization_id,
                            checkout_status=True,
                            subscription_data__checkout_id=checkout_id,
                            subscription_data__subscription_id__isnull=False,
                        )
                    )
                )
                .filter(has_checkout_id=True)
                .exists()
            )

            if exists:
                return Response(
                    {"detail": "Checkout ID found, checkout already completed"},
                    status=status.HTTP_204_NO_CONTENT,
                )
            else:
                return Response(
                    {"detail": "Checkout ID not found"}, status=status.HTTP_200_OK
                )

    except Exception as e:
        return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@csrf_exempt
def verify_new_subscription(request):
    data = request.data
    if data is None:
        return Response("No data", status=status.HTTP_400_BAD_REQUEST)

    if "organization_id" not in data:
        return Response("Organization id missing", status=status.HTTP_400_BAD_REQUEST)

    if data["organization_id"] is None:
        return Response("Organization id not valid", status=status.HTTP_400_BAD_REQUEST)
    print(data)
    try:
        with schema_context(data["tenant"]):
            # Try to get user from token
            user = validate_token(data["token"])
            if user is None:
                return Response("User not found", status=status.HTTP_400_BAD_REQUEST)

            # Check for Subscription with the specified checkout_id
            exists = (
                Subscription.objects.annotate(
                    has_checkout_id=Exists(
                        Subscription.objects.filter(
                            organization_id=data["organization_id"],
                            subscription_data__checkout_id=OuterRef(
                                "subscription_data__checkout_id"
                            ),
                        )
                    )
                )
                .filter(has_checkout_id=True)
                .exists()
            )

            users = ProfileSerializer(Profile.objects.all(), many=True).data
            active_users = 0
            org = get_object_or_404(Organization, id=data["organization_id"])

            allowed_users = (
                Subscription.objects.filter(organization=org).aggregate(
                    total_quantity=Sum("count")
                )["total_quantity"]
                or 0
            )
            active_users = Profile.objects.filter(
                is_active=True).exclude(role="Viewer").count()

            # Deactivate users if needed
            if active_users > allowed_users:
                # Deactivate users in priority order until we reach the limit
                for role in ["User", "Developer", "Admin"]:
                    num_to_deactivate = active_users - allowed_users
                    if num_to_deactivate > 0:
                        users_to_deactivate = Profile.objects.filter(role=role)[
                            :num_to_deactivate
                        ]

                        # Collect IDs to use in a filtered update
                        users_to_deactivate_ids = users_to_deactivate.values_list(
                            "id", flat=True
                        )

                        # Update using the collected IDs
                        Profile.objects.filter(id__in=users_to_deactivate_ids).update(
                            is_active=False
                        )

                        # Update the active_users counter
                        active_users -= len(users_to_deactivate_ids)
            if exists:
                return Response(
                    "Checkout ID found, checkout already completed",
                    status=status.HTTP_200_OK,
                )
            else:
                return Response(
                    "Checkout ID not found", status=status.HTTP_400_BAD_REQUEST
                )

    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@renderer_classes((JSONRenderer,))
@csrf_exempt
def get_checkout_details(request):
    print("Calling the checkout view")
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


def get_plan_name_from_product_id(product_id):
    local_server = bool(int(os.environ.get("DJANGO_LOCAL_SERVER", 0)))
    if isinstance(product_id, str):
        try:
            product_id = int(product_id)
        except ValueError:
            return "Invalid Product ID"
    if local_server:
        if product_id == 61182:
            return "Dokuly Pro"
        elif product_id == 70048:
            return "Dokuly Pro + Requirements"
        else:
            return "Unknown"
    if product_id == 847269:
        return "Dokuly Pro"
    elif product_id == 847241:
        return "Dokuly Pro + Requirements"
    else:
        return ""


@api_view(("GET", "POST", "PUT"))
@renderer_classes((JSONRenderer,))
@csrf_exempt
def paddle_webhook(request):
    data = request.data
    if data == None:
        return Response(
            "No data gotten from paddle", status=status.HTTP_400_BAD_REQUEST
        )
    passthrough_data = loads(data.get("passthrough", "{}"))
    custom_flag = passthrough_data.get("tenantCheckout", None)
    if custom_flag != None:  # This is a tenant checkout, not signup, do nothing
        print("Tenant flag found in paddle_webhook, doing nothing.")
        return Response("", status=status.HTTP_204_NO_CONTENT)
    if request.method == "POST":
        try:
            data = convert_querydict_to_dict(data)
            if not is_valid_signature(data):
                # Bad Request
                return Response(
                    "Unable to verify webhook signature",
                    status=status.HTTP_400_BAD_REQUEST,
                )
            new_sub_info = {
                "quantity": data.get("quantity"),
                "checkout_id": data.get("checkout_id"),
                "status": data.get("status"),
                "user_id": data.get("user_id"),
                "subscription_plan_id": data.get("subscription_plan_id"),
                "subscription_id": data.get("subscription_id"),
                "plan_name": get_plan_name_from_product_id(data.get("subscription_plan_id")),
                "update_url": data.get("update_url"),
            }
            SignupInfo.objects.create(subscription_info=new_sub_info)
            return Response("", status=status.HTTP_200_OK)  # OK
        except Exception as e:
            print(str(e))
            return Response(str(e), status=status.HTTP_400_BAD_REQUEST)
    else:
        # Method Not Allowed
        return Response("", status=status.HTTP_405_METHOD_NOT_ALLOWED)


@api_view(("GET", "POST", "PUT"))
@renderer_classes((JSONRenderer,))
@csrf_exempt
def paddle_tenant_webhook(request):
    data = request.data
    passthrough_data = loads(data.get("passthrough", "{}"))
    custom_flag = passthrough_data.get("tenantCheckout", None)
    if custom_flag == None:  # Missing tenant flag, do nothing
        print("Tenant flag not found in paddle_tenant_webhook, doing nothing.")
        return Response("", status=status.HTTP_204_NO_CONTENT)
    if data == None:
        return Response(
            "No data gotten from paddle", status=status.HTTP_400_BAD_REQUEST
        )
    if request.method == "POST":
        try:
            if not is_valid_signature(data):
                # Bad Request
                return Response(
                    "Unable to verify webhook signature",
                    status=status.HTTP_400_BAD_REQUEST,
                )
            print("Webhook for tenants called")
            with schema_context(passthrough_data.get("tenant")):
                # Try to get user from token
                user = validate_token(passthrough_data.get("token"))
                if user == None:
                    return Response(
                        "User not found", status=status.HTTP_400_BAD_REQUEST
                    )
                new_sub_info = {
                    "quantity": data.get("quantity"),
                    "checkout_id": data.get("checkout_id"),
                    "status": data.get("status"),
                    "user_id": data.get("user_id"),
                    "subscription_plan_id": data.get("subscription_plan_id"),
                    "subscription_id": data.get("subscription_id"),
                    "plan_name": get_plan_name_from_product_id(data.get("subscription_plan_id")),
                    "update_url": data.get("update_url"),
                }
                org = Organization.objects.get(
                    id=passthrough_data.get("organization_id")
                )
                Subscription.objects.create(
                    organization=org,
                    subscription_data=new_sub_info,
                    count=data.get("quantity"),
                )
                return Response("", status=status.HTTP_200_OK)  # OK
        except Exception as e:
            print(str(e))
            return Response(str(e), status=status.HTTP_400_BAD_REQUEST)
    else:
        # Method Not Allowed
        return Response("", status=status.HTTP_405_METHOD_NOT_ALLOWED)


def is_valid_signature(input_data):
    if input_data == None:
        return False
    """
    Validates Paddle's webhook signature.
    """
    pub_key_string = settings.PADDLE_PUBLIC_KEY
    public_key_encoded = pub_key_string[26:-25].replace("\n", "")
    public_key_der = base64.b64decode(public_key_encoded)

    # input_data represents all of the POST fields sent with the request
    # Get the p_signature parameter & base64 decode it.
    signature = input_data["p_signature"]

    # Remove the p_signature parameter from a copy of the data
    input_data_copy = input_data.copy()
    del input_data_copy["p_signature"]

    # Ensure all the data fields are strings
    for field in input_data_copy:
        input_data_copy[field] = str(input_data_copy[field])

    # Sort the data
    sorted_data = collections.OrderedDict(sorted(input_data_copy.items()))

    # and serialize the fields
    serialized_data = phpserialize.dumps(sorted_data)

    # verify the data
    key = RSA.importKey(public_key_der)
    digest = SHA1.new()
    digest.update(serialized_data)
    verifier = PKCS1_v1_5.new(key)
    signature = base64.b64decode(signature)
    if verifier.verify(digest, signature):
        return True
    return False


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
def remove_failed_subscription(request):
    data = request.data
    if data == None:
        return Response("No data", status=status.HTTP_400_BAD_REQUEST)
    try:
        # The tenant isnt created yet, so no schema context is used here
        if "checkout_id" not in data:
            return Response("No checkout id in data", status=status.HTTP_400_BAD_REQUEST)
        signup_object = SignupInfo.objects.get(
            subscription_info__checkout_id=data["checkout_id"]
        )
        signup_sub_id = signup_object.subscription_info.get(
            "subscription_id", None)
        if signup_sub_id == None:
            return Response("No subscription id in data", status=status.HTTP_400_BAD_REQUEST)
        ok = cancel_paddle_subscription(
            signup_sub_id)
        if ok:
            return Response("Errant subscription canceled", status=status.HTTP_200_OK)
        raise Exception("Error canceling subscription, paddle query error.")
    except Exception as e:
        try:
            send_mail(
                subject="Error in tenant creation, inner try catch",
                message=f"Error: {str(e)}",
                from_email=settings.EMAIL_SENDER,
                auth_user=settings.EMAIL_HOST_USER,
                auth_password=settings.EMAIL_HOST_PASSWORD,
                recipient_list=["dokuly@norskdatateknikk.no"],
                fail_silently=False,
            )
        except Exception as e:
            pass
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@csrf_exempt
def create_checkout_public(request):
    local_server = bool(int(os.environ.get("DJANGO_LOCAL_SERVER", 0)))
    if local_server:
        domain_url = f"http://dokuly.localhost:8000"
    else:
        domain_url = f"https://dokuly.com"
    data = request.data
    if "pricing_id" not in data or "quantity" not in data:
        return Response("Request payload error", status=status.HTTP_400_BAD_REQUEST)
    try:
        price = None
        if price != None:
            return Response("", status=status.HTTP_200_OK)
        else:
            return Response("Stripe error", status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(
    (
        "GET",
        "POST",
    )
)
@renderer_classes((JSONRenderer,))
@csrf_exempt
def create_checkout_session(request):
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    if settings.ALLOW_NEW_TENANT_SUBSCRIPTIONS == 0:
        return Response(
            "Service temporarily offline, try again later",
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    domain_url = ""
    local_server = bool(int(os.environ.get("DJANGO_LOCAL_SERVER", 0)))
    if local_server:
        domain_url = f"http://{str(request.tenant)}.dokuly.localhost:8000"
    else:
        domain_url = f"https://{str(request.tenant)}.dokuly.com"
    d = request.data
    try:
        price = None
        if price == None:
            return Response("Error loading price", status=status.HTTP_400_BAD_REQUEST)
        if d["anually"] == True:
            return Response("", status=status.HTTP_200_OK)
        else:
            return Response("", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
def check_max_users_on_subscription(request):
    if request.user is None:
        return Response("Unauthorized", status=status.HTTP_400_BAD_REQUEST)

    try:
        profile = get_object_or_404(Profile, user__pk=request.user.id)
        org = get_object_or_404(Organization, id=profile.organization_id)
        allowed_users = 0

        try:
            subscriptions = Subscription.objects.filter(organization=org)
            subscriptions_data = SubscriptionSerializer(
                subscriptions, many=True).data

            quantities = []

            for sub in subscriptions_data:
                quantity = sub["count"]

                # Type checking and conversion
                if isinstance(quantity, str):
                    if quantity.isdigit():
                        quantity = int(quantity)
                    else:
                        print(f"Invalid quantity: {quantity}")
                        continue

                quantities.append(quantity)

            allowed_users = sum(quantities)

            if len(subscriptions) == 0:
                allowed_users = 3  # This is a free tier account
            if str(request.tenant) == "nd":
                allowed_users = 99

        except Exception as e:
            print(str(e))
            allowed_users = 1

        # Calculate active_users
        active_users = Profile.objects.filter(
            is_active=True).exclude(role="Viewer").count()
        viewer_users = Profile.objects.filter(
            is_active=True, role__iexact="Viewer").count()

        return Response(
            {"allowed_active_users": allowed_users, "active_users": active_users,
             "viewer_users": viewer_users, "allowed_viewer_users": org.max_allowed_active_viewer_users},
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        return Response(str(e), status=status.HTTP_406_NOT_ACCEPTABLE)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@csrf_exempt
def fetch_prices(request):
    if settings.ALLOW_NEW_TENANT_SUBSCRIPTIONS == 0:
        return Response(
            "Service temporarily offline, try again later",
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    try:
        return Response("", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@csrf_exempt
def check_server_status(request):
    if settings.ALLOW_NEW_TENANT_SUBSCRIPTIONS == 0:
        return Response(
            "Service temporarily offline, try again later",
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    else:
        return Response("Service available", status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@csrf_exempt
def ping_server(request):
    return Response("Pong", status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@csrf_exempt
def fetch_stripe_config(request):
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    if settings.ALLOW_NEW_TENANT_SUBSCRIPTIONS == 0:
        return Response(
            "Service temporarily offline, try again later",
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    if request.method == "GET":
        stripe_config = {"publicKey": settings.STRIPE_PUBLISHABLE_KEY}
        return Response(stripe_config, status=status.HTTP_200_OK)


@api_view(
    (
        "GET",
        "PUT",
    )
)
@renderer_classes((JSONRenderer,))
@csrf_exempt
def verify_checkout_session(request):
    if settings.ALLOW_NEW_TENANT_SUBSCRIPTIONS == 0:
        return Response(
            "Service temporarily offline, try again later",
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    data = request.data
    if "session_id" not in data:
        return Response(
            "Cannot verify the checkout session.", status=status.HTTP_400_BAD_REQUEST
        )
    try:
        # Fetch the session
        validate = TokenAuthentication.authenticate_header(
            TokenAuthentication, request)
        if validate == None:
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
        return Response("Session Verified", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_406_NOT_ACCEPTABLE)


@api_view(
    (
        "GET",
        "PUT",
    )
)
@renderer_classes((JSONRenderer,))
@csrf_exempt
def check_duplicate_tenant(request):
    if settings.ALLOW_NEW_TENANT_SUBSCRIPTIONS == 0:
        return Response(
            "Service temporarily offline, try again later",
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    data = request.data
    if "user_id" not in data:
        return Response("Error with user id")
    try:
        signup = SignupInfo.objects.get(userid_username=data["user_id"])
        domain = signup.domain
        qs = Tenant.objects.all()
        for object in qs:
            schema_name = str(object.schema_name)
            if str(domain) == str(schema_name):
                return Response(
                    "Error, this workspace has already been created, or is under construction",
                    status=status.HTTP_406_NOT_ACCEPTABLE,
                )
        return Response("Valid input, creating tenant...", status=status.HTTP_200_OK)
    except Exception as e:
        print(str(e), data["user_id"])
        return Response("Something went wrong", status=status.HTTP_400_BAD_REQUEST)


@api_view(
    (
        "GET",
        "PUT",
    )
)
@renderer_classes((JSONRenderer,))
@csrf_exempt
def check_localserver(request):
    local_server = bool(int(os.environ.get("DJANGO_LOCAL_SERVER", 0)))
    if local_server:
        return Response(1, status=status.HTTP_200_OK)
    return Response(0, status=status.HTTP_204_NO_CONTENT)


@api_view(
    (
        "POST",
        "PUT",
    )
)
@renderer_classes((JSONRenderer,))
def create_or_update_tenant(request):
    if settings.ALLOW_NEW_TENANT_SUBSCRIPTIONS == 0:
        return Response(
            "Service temporarily offline, try again later",
            status=status.HTTP_503_SERVICE_UNAVAILABLE,
        )
    data = request.data
    if "session_id" not in data:
        return Response("Session id not found", status=status.HTTP_400_BAD_REQUEST)
    if data["session_id"] == None:
        return Response("Data error, session id", status=status.HTTP_400_BAD_REQUEST)
    errors = False
    try:
        signup = SignupInfo.objects.get(userid_username=data["userid"])
        max_allowed_active_users = 3
        try:
            if "quantity" in signup.subscription_info:
                max_allowed_active_users = signup.subscription_info.get(
                    "quantity")
        except Exception as e:
            print("Quantity error, not found:", str(e))
            max_allowed_active_users = 3
        email = signup.email
        if email.endswith(".ru"):
            return Response(
                "Service temporarily offline, try again later",
                status=status.HTTP_503_SERVICE_UNAVAILABLE,
            )
        if email != None:
            domain_name = signup.domain
            username = signup.username
            full_name = signup.full_name
            subscription_info = signup.subscription_info
            first_name = ""
            last_name = ""
            if " " in signup.full_name:
                if len(signup.full_name.split(" ")) > 1:
                    first_name = signup.full_name.split(" ")[0]
                    last_name = signup.full_name.split(" ")[1]
            else:
                first_name = signup.full_name
                last_name = signup.full_name[0]
            qs = Tenant.objects.all()
            local_server = bool(int(os.environ.get("DJANGO_LOCAL_SERVER", 0)))
            if domain_name == None:
                domain_name = "tenant" + str(len(qs) + 1)  # Secondary domain
            try:
                tenant = Tenant(
                    schema_name=str(domain_name),
                    name=str(domain_name),
                    paid_until=str(date.today() + relativedelta(months=3)),
                    on_trial=False,
                )
                tenant.save()
                domain = None
                if local_server:
                    domain = Domain(
                        domain=str(f"{domain_name}.dokuly.localhost"),
                        tenant=tenant,
                        is_primary=True,
                    )
                else:
                    domain = Domain(
                        domain=str(f"{domain_name}.dokuly.com"),
                        tenant=tenant,
                        is_primary=True,
                    )
                domain.save()
                ascii_string = string.ascii_lowercase
                password = "".join(
                    random.choice(ascii_string)
                    for i in range(int(random.randint(16, 22)))
                )
                DomainNames.objects.create(schema_name=domain)
                with tenant_context(tenant):
                    accountData = {
                        "email": email,
                        "first_name": first_name,
                        "last_name": last_name,
                        "password": password,
                        "username": username,
                    }
                    serializer = RegisterSerializer(data=accountData)
                    serializer.is_valid(raise_exception=True)
                    user = serializer.save()
                    system_cost = 0
                    storage_limit = 1073741824
                    allowed_apps = [
                        'timesheet', 'customers', 'projects', 'requirements',
                        'documents', 'parts', 'assemblies', 'pcbas', 'production', 'procurement'
                    ]
                    try:
                        if subscription_info != None:
                            if "requirements" in subscription_info.get("plan_name"):
                                if subscription_info["requirements"] == True:
                                    allowed_apps.append("requirements")
                                if subscription_info.get("plan_name") == "Requirements":
                                    allowed_apps = [
                                        "requirements", "documents", "timesheet", "customers", "projects"]
                    except Exception as e:
                        print("Subscription info error", e)
                    try:
                        if "subscription_plan_id" in subscription_info:
                            if int(subscription_info["subscription_plan_id"]) == 847269:
                                storage_limit = 10737418240
                            elif (
                                int(subscription_info["subscription_plan_id"]) == 847241
                            ):
                                storage_limit = 10737418240 * 2
                    except Exception as e:
                        storage_limit = 1073741824

                    org = Organization.objects.create(
                        org_number="000",
                        name=domain_name,
                        tenant_id=domain_name,
                        stripe_subscription_ids=["deprecated"],
                        max_allowed_active_users=max_allowed_active_users,
                        current_system_cost=system_cost,
                        storage_limit=storage_limit,
                    )

                    profile = Profile.objects.create(
                        id=user.id,
                        user=user,
                        first_name=first_name,
                        last_name=last_name,
                        work_email=email,
                        personal_phone_number=" ",
                        address=" ",
                        position=" ",
                        position_percentage="100",
                        role="Owner",
                        organization_id=org.id,
                    )
                    customer = None
                    try:
                        if subscription_info != None:
                            count = 1
                            if subscription_info.get("quantity") == None:
                                count = 0
                            else:
                                count = subscription_info.get("quantity")
                            Subscription.objects.create(
                                organization=org,
                                subscription_data=subscription_info,
                                count=count,
                                checkout_status=True,
                            )
                    except Exception as e:
                        print("Could not save subscription object", str(e))
                    try:
                        customer = Customer.objects.create(
                            name=domain_name,
                            contact_name="Admin",
                            contact_email=str(email),
                            contact_phone_number=" ",
                            description="Your very own customer, representing your business.",
                            customer_id=100,
                            customer_contact=user,
                            is_active=True,
                            favorite_project="100",
                            favorite_task="Timeadmin",
                        )
                    except Exception as e:
                        print("Customer error:", str(e))
                    if customer != None:
                        try:
                            project = Project.objects.create(
                                title="General",
                                description="A blank starter project, edit this to describe it in your own way or create a new one!",
                                project_number=100,
                                customer=customer,
                                project_contact=profile
                            )
                            if project:
                                project.project_members.set([user])
                        except Exception as e:
                            print("Could not create project", str(e))
                        Task.objects.create(
                            title="Project Management",
                            description="Time spent managing projects, customers and other dokuly items.",
                            project_id=project.id,
                        )
                        Task.objects.create(
                            title="Documentation",
                            description="Time spent creating, writing and revisioning documents.",
                            project_id=project.id,
                        )
                        Task.objects.create(
                            title="Design Work",
                            description="Time spent on company projects.",
                            project_id=project.id,
                        )
                        try:
                            Document_Prefix.objects.create(
                                prefix="TMP",
                                display_name="Template",
                                description="A template document",
                            )
                        except Exception as e:
                            print(e)
                        serializer = ProfileSerializer(profile, many=False)
                        url = "https://www.google-analytics.com/batch?"
                        params = {
                            "v": 1,
                            "tid": settings.GOOGLE_ANALYTICS_CLIENT_ID,
                            "cid": "555",
                            "t": "event",
                            "ec": "ecommerce",
                            "ea": "purchase",
                        }
                        req = requests.PreparedRequest()
                        req.prepare_url(url, params)
                        res = requests.post(req.url)
                        print(res)
                        user_obj = User.objects.get(id=user.id)
                        token = {
                            "token": AuthToken.objects.create(user_obj)[1],
                            "token_created:": datetime.now().strftime(
                                "%Y,%m,%d,%H,%M,%S"
                            ),
                        }
                        resetLink = f"https://{domain_name}.dokuly.com/#/passwordRecovery/{token['token']}/{user_obj.id}"
                        if local_server:
                            resetLink = f"http://{domain_name}.dokuly.localhost:8000/#/passwordRecovery/{token['token']}/{user_obj.id}"
                        send_workspace_creation_email(
                            email, domain_name, resetLink, username
                        )
                        send_mail(
                            subject="New Workspace Created",
                            message=f"We got a new workspace!: \
                            \nWorkspace name: {domain_name} \
                            \nName of the user: {first_name} - {last_name} \
                            \nEmail of the user: {email}",
                            from_email=settings.EMAIL_SENDER,
                            auth_user=settings.EMAIL_HOST_USER,
                            auth_password=settings.EMAIL_HOST_PASSWORD,
                            recipient_list=["dokuly@norskdatateknikk.no"],
                            fail_silently=False,
                        )
                        print("\n MAILS SENT \n")
                    return Response(serializer.data, status=status.HTTP_201_CREATED)
            except Exception as e:
                error = str(e)
                errors = True
                send_mail(
                    subject="Error in tenant creation, inner try catch",
                    message=f"Error: {str(e)}",
                    from_email=settings.EMAIL_SENDER,
                    auth_user=settings.EMAIL_HOST_USER,
                    auth_password=settings.EMAIL_HOST_PASSWORD,
                    recipient_list=["dokuly@norskdatateknikk.no"],
                    fail_silently=False,
                )
                return Response(error, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(
                "No email entered in the request, try again",
                status=status.HTTP_400_BAD_REQUEST,
            )
    except Exception as e:
        print(str(e))
        errors = True
        send_mail(
            subject="Error in loading variables for tenant creation, outer try catch",
            message=f"Error: {str(e)}",
            from_email=settings.EMAIL_SENDER,
            auth_user=settings.EMAIL_HOST_USER,
            auth_password=settings.EMAIL_HOST_PASSWORD,
            recipient_list=["dokuly@norskdatateknikk.no"],
            fail_silently=False,
        )
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)
    finally:
        if not errors:
            SignupInfo.objects.filter(userid_username=data["userid"]).update(
                is_created=True
            )


@api_view(("GET", "PUT"))
@renderer_classes((JSONRenderer,))
def fetch_tenants(request):
    d = request.data
    if "adminPass" in request.data:  # Temp access point for posting users
        if str(d.get("adminPass")) == str(os.getenv("adminPass")):
            print("Access granted")
            try:
                qs = Tenant.objects.all()
                tenants = []
                for object in qs:
                    name = str(object.name)
                    id = str(object.pk)
                    paid_until = str(object.paid_until)
                    schema_name = str(object.schema_name)
                    on_trial = str(object.on_trial)
                    JSON_string = str(
                        "{'id':"
                        + id
                        + ",'name':"
                        + name
                        + ",'schema_name':"
                        + schema_name
                        + ",'paid_until':"
                        + paid_until
                        + ",'on_trial':"
                        + on_trial
                        + "}"
                    )
                    tenants.append(JSON_string)
                return Response(tenants, status=status.HTTP_200_OK)
            except Exception as e:
                return Response(e, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(
                "Unauthorized, error code 3", status=status.HTTP_401_UNAUTHORIZED
            )
    else:
        return Response(
            "Unauthorized, error code 1", status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(("GET", "PUT"))
@renderer_classes((JSONRenderer,))
def fetch_domains(request):
    d = request.data
    if "adminPass" in request.data:  # Temp access point for posting users
        if str(d.get("adminPass")) == str(os.getenv("adminPass")):
            print("Access granted")
            try:
                qs = Domain.objects.all()
                domains = []
                for object in qs:
                    domain = str(object.domain)
                    id = str(object.pk)
                    JSON_string = str(
                        "{'id':" + id + ",'domain':" + domain + "}")
                    domains.append(JSON_string)
                return Response(domains, status=status.HTTP_200_OK)
            except Exception as e:
                return Response(e, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response(
                "Unauthorized, error code 3", status=status.HTTP_401_UNAUTHORIZED
            )
    else:
        return Response(
            "Unauthorized, error code 1", status=status.HTTP_401_UNAUTHORIZED
        )


@api_view(("DELETE",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def delete_tenant(request):
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    if request.tenant == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    if request.method != "DELETE":
        return Response("Method not allowed", status=status.HTTP_400_BAD_REQUEST)
    try:
        profile = Profile.objects.get(user__pk=request.user.id)
        serializer = ProfileSerializer(profile, many=False)
        data = serializer.data
        if "role" not in data:
            return Response(
                "Error in user profile object", status=status.HTTP_400_BAD_REQUEST
            )
        if data["role"] != "Owner":
            return Response("Unauthorized", stauts=status.HTTP_400_BAD_REQUEST)
        local_server = bool(int(os.environ.get("DJANGO_LOCAL_SERVER", 0)))
        schema_name = ""
        if local_server:
            schema_name = str(request.tenant) + ".dokuly.localhost"
        else:
            schema_name = str(request.tenant) + ".dokuly.com"
        try:
            # Unsafe, but need to access public to drop tenant
            with schema_context("public"):
                try:
                    try:
                        DomainNames.objects.get(
                            schema_name=schema_name).delete()
                    except Exception as e:
                        print(str(e))
                    tenantToDelete = Tenant.objects.get(
                        schema_name=request.tenant)
                    tenantToDelete.delete(force_drop=True)
                    if local_server:
                        return Response(
                            "http://dokuly.localhost:8000", status=status.HTTP_200_OK
                        )
                    return Response("https://dokuly.com", status=status.HTTP_200_OK)
                except Tenant.DoesNotExist:
                    return Response(
                        "Tenant not found", status=status.HTTP_400_BAD_REQUEST
                    )
        except Exception as e:
            return Response(
                str(e) + ", Outer exception triggered",
                status=status.HTTP_400_BAD_REQUEST,
            )
    except Profile.DoesNotExist or User.DoesNotExist:
        return Response(
            "Profile not found, aborting", status=status.HTTP_400_BAD_REQUEST
        )


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
def create_checkout_free_beta(request):
    try:
        data = request.data
        password = get_random_string(length=30)
        user = User.objects.create_user(
            username=uuid.uuid4(), password=password, email=data["email"]
        )
        token = {
            "token": AuthToken.objects.create(user)[1],
            "token_created:": datetime.now().strftime("%Y,%m,%d,%H,%M,%S"),
        }
        local_server = bool(int(os.environ.get("DJANGO_LOCAL_SERVER", 0)))
        if "signup_id" in data:
            SignupInfo.objects.filter(id=data["signup_id"]).update(
                email=data.get("email"),
                full_name=data.get("fullName"),
                username=data.get("username"),
                domain=data.get("domain"),
                userid_username=user.username,
            )
            signup_after = SignupInfo.objects.get(id=data["signup_id"])
            print(signup_after.domain)
        else:
            signup = SignupInfo.objects.create(
                email=data["email"],
                full_name=data["fullName"],
                username=data["username"],
                domain=data["domain"],
                userid_username=user.username,
            )
        email = data.get("email")
        if "noEmail" in data:
            if data["noEmail"]:
                return Response(
                    {"user_id": user.username, "session_id": token["token"]},
                    status=status.HTTP_200_OK,
                )
        if local_server:
            domain_url = settings.NGROK_TESTING_SERVER
            if domain_url is None:
                domain_url = "http://dokuly.localhost:8000/"
        else:
            domain_url = f"https://dokuly.com"
        confirmation_link = (
            domain_url
            + f"?success=true&user_id={user.username}&session_id={token['token']}#/success"
        )
        send_email_confirmation(email, confirmation_link)
        return Response(
            {"msg": "Confirmation mail sent", "userid": user.username},
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        mailError = ""
        try:
            send_mail(
                subject="Error in signup",
                message=f"Error: {str(e)}",
                from_email=settings.EMAIL_SENDER,
                auth_user=settings.EMAIL_HOST_USER,
                auth_password=settings.EMAIL_HOST_PASSWORD,
                recipient_list=["dokuly@norskdatateknikk.no"],
                fail_silently=False,
            )
        except Exception as innerException:
            print(str(innerException))
            mailError = str(innerException)
        return Response(
            {"outer_ex": str(e), "inner_ex": mailError},
            status=status.HTTP_400_BAD_REQUEST,
        )


def convert_querydict_to_dict(querydict):
    if isinstance(querydict, QueryDict):
        # Converts QueryDict to regular dict, taking the last value for each key
        return querydict.dict()
    return querydict
