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


def _get_auth_header(data):
    if "api_key" in data:
        return {"Authorization": "Api-Key " + data["api_key"]}
    return {}


def _get_auth_data(data):
    if "password" in data:
        return {"password": data["password"]}
    return {}


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
            "delivery_address",
            "postal_code",
            "country",
            "billing_address",
            "use_number_revisions",
            "revision_format",
            "full_part_number_template",
            "formatted_revision_template",
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

        # Check if revision system settings changed and trigger migration
        revision_settings_changed = False
        if "use_number_revisions" in data and organization.use_number_revisions != data["use_number_revisions"]:
            revision_settings_changed = True
        if "revision_format" in data and organization.revision_format != data["revision_format"]:
            revision_settings_changed = True

        organization.save()
        
        # Note: Revision settings only affect newly created items going forward
        # Existing items retain their original part number format
        
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
            "customer_is_enabled",
            "document_is_enabled",
            "pcba_is_enabled",
            "assembly_is_enabled",
            "procurement_is_enabled",
            "requirement_is_enabled",
            "production_is_enabled",
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
        data = {"USD": 1}
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


@api_view(["GET"])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def check_corrupted_revisions(request):
    """Check if the organization has corrupted full_part_number values."""
    try:
        user_profile = get_object_or_404(Profile, user=request.user)
        org_id = user_profile.organization_id
        
        if org_id is None:
            return Response("No connected organization found", status=status.HTTP_204_NO_CONTENT)
        
        organization = get_object_or_404(Organization, id=org_id)
        
        # Only check if organization uses number revisions
        if not organization.use_number_revisions:
            return Response({"has_corrupted_revisions": False, "reason": "Organization uses letter revisions"})
        
        # Check for corrupted full_part_number values
        from parts.models import Part
        from assemblies.models import Assembly
        from pcbas.models import Pcba
        
        user_profiles = Profile.objects.filter(organization_id=org_id)
        user_ids = [profile.user_id for profile in user_profiles if profile.user_id]
        
        # Check parts
        parts = Part.objects.filter(created_by_id__in=user_ids)
        corrupted_parts = []
        
        for part in parts:
            if part.full_part_number and part.revision:
                # Determine correct prefix
                prefix = part.part_type.prefix if part.part_type else "PRT"
                correct_full_part_number = f"{prefix}{part.part_number}_{part.revision}"
                
                if part.full_part_number != correct_full_part_number:
                    corrupted_parts.append({
                        'id': part.id,
                        'current': part.full_part_number,
                        'correct': correct_full_part_number
                    })
        
        has_corrupted = len(corrupted_parts) > 0
        
        return Response({
            "has_corrupted_revisions": has_corrupted,
            "corrupted_count": len(corrupted_parts),
            "corrupted_items": corrupted_parts[:5] if has_corrupted else []  # Show first 5 examples
        })
        
    except Exception as e:
        return Response(f"Error checking corrupted revisions: {str(e)}", status=status.HTTP_400_BAD_REQUEST)


@api_view(["POST"])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def preview_part_number_template(request):
    """
    Preview how a part number template will be formatted.
    
    Request body:
        template: str - The template string (e.g., "<prefix><part_number><revision>")
        use_number_revisions: bool - Whether to use number-based revisions
    
    Returns:
        examples: list - List of example formatted part numbers for different scenarios
    """
    from organizations.revision_utils import build_full_part_number_from_template
    from datetime import datetime
    
    try:
        template = request.data.get('template', '<prefix><part_number><revision>')
        use_number_revisions = request.data.get('use_number_revisions', False)
        
        # Create sample datetime for date-based variables
        sample_date = datetime(2025, 1, 15, 10, 30, 0)  # Jan 15, 2025
        
        # Generate examples for different scenarios
        examples = []
        
        # Example 1: PRT, first revision
        examples.append({
            'description': 'Part - First revision',
            'formatted': build_full_part_number_from_template(
                template=template,
                prefix='PRT',
                part_number='10001',
                revision_count_major=0,
                revision_count_minor=0,
                use_number_revisions=use_number_revisions,
                project_number='PRJ001',
                created_at=sample_date,
            )
        })
        
        # Example 2: PCBA, second major revision
        examples.append({
            'description': 'PCBA - Second major revision',
            'formatted': build_full_part_number_from_template(
                template=template,
                prefix='PCBA',
                part_number='20045',
                revision_count_major=1,
                revision_count_minor=0,
                use_number_revisions=use_number_revisions,
                project_number='PRJ042',
                created_at=sample_date,
            )
        })
        
        # Example 3: ASM, with minor revision
        examples.append({
            'description': 'Assembly - With minor revision',
            'formatted': build_full_part_number_from_template(
                template=template,
                prefix='ASM',
                part_number='30012',
                revision_count_major=0,
                revision_count_minor=2,
                use_number_revisions=use_number_revisions,
                project_number='PRJ100',
                created_at=sample_date,
            )
        })
        
        return Response({
            'examples': examples,
            'template': template,
            'settings': {
                'use_number_revisions': use_number_revisions,
            }
        })
        
    except Exception as e:
        return Response(
            {'error': f'Error previewing template: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(['POST'])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def preview_formatted_revision_template(request):
    """
    Preview how a formatted revision template will be displayed.
    
    Request body:
        template: str - The template string (e.g., "<major_revision>-<minor_revision>")
        use_number_revisions: bool - Whether to use number-based revisions
        revision_format: str - "major-only" or "major-minor"
    
    Returns:
        examples: list - List of example formatted revisions for different scenarios
    """
    from organizations.revision_utils import build_full_part_number_from_template
    
    try:
        template = request.data.get('template', '<major_revision>')
        use_number_revisions = request.data.get('use_number_revisions', False)
        revision_format = request.data.get('revision_format', 'major-minor')
        
        # Generate examples for different scenarios
        examples = []
        
        # Example 1: First revision
        examples.append({
            'description': 'First revision',
            'formatted': build_full_part_number_from_template(
                template=template,
                prefix='',
                part_number='',
                revision_count_major=0,
                revision_count_minor=0,
                use_number_revisions=use_number_revisions,
            )
        })
        
        # Example 2: Second minor revision (only if major-minor format)
        if revision_format == 'major-minor':
            examples.append({
                'description': 'Second minor revision',
                'formatted': build_full_part_number_from_template(
                    template=template,
                    prefix='',
                    part_number='',
                    revision_count_major=0,
                    revision_count_minor=1,
                    use_number_revisions=use_number_revisions,
                )
            })
        
        # Example 3: Second major revision
        examples.append({
            'description': 'Second major revision',
            'formatted': build_full_part_number_from_template(
                template=template,
                prefix='',
                part_number='',
                revision_count_major=1,
                revision_count_minor=0,
                use_number_revisions=use_number_revisions,
            )
        })
        
        return Response({
            'examples': examples,
            'template': template,
            'settings': {
                'use_number_revisions': use_number_revisions,
                'revision_format': revision_format,
            }
        })
        
    except Exception as e:
        return Response(
            {'error': f'Error previewing template: {str(e)}'},
            status=status.HTTP_400_BAD_REQUEST
        )

