from django.db.models import Prefetch
from organizations.serializers import SubscriptionSerializer, OrganizationManagerSerializer
from organizations.models import Organization, Subscription
# from tenants.models import Tenant
# from django_tenants.utils import schema_context, tenant_context, get_tenant_model, remove_www
import pyotp
import os
import string
import random
from django.contrib.auth.decorators import login_required
from knox.models import AuthToken
from datetime import datetime
from rest_framework.authentication import BasicAuthentication
from django.contrib.auth.decorators import permission_required
from knox.auth import TokenAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework import viewsets, permissions
from django.core.mail import send_mail
from django.conf import settings
from accounts.serializers import UserSerializer, RegisterSerializer, LoginSerializer, UserSerializerNoPersonal
from django.contrib.auth.models import User
from django.contrib.postgres.search import SearchVector
from django.db.models import Q
from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from .models import Profile
from .serializers import ProfileSerializer
from django.db import transaction
from django.shortcuts import get_object_or_404
from .utilityFunctions import send_reset_password_mail_with_template
from django.db.models import Count, F, Sum
import json

# Permissions helpers
# TODO change 'User' with 'Developer'

# Deprecated


def check_permissions_standard(user):
    """DEPRECATED Check if user has "Developer" status or greater.
    """
    user_profile = Profile.objects.get(user__pk=user.id)
    role = user_profile.role
    if not user.is_authenticated:
        return Response("User not authenticated", status=status.HTTP_403_FORBIDDEN)
    if role == "Viewer" or role == "User" or role == "Admin" or role == "Owner":
        return True
    return False


def check_authentication(user):
    if user == None:
        return False
    return True


def check_permissions_admin(user):
    """Check if the user has admin status or greater.
    """
    user_profile = Profile.objects.get(user__pk=user.id)
    role = user_profile.role
    if not user.is_authenticated:
        return False
    if role == "Admin" or role == "Owner":
        return True
    return False


def check_permissions_owner(user):
    """Check if the user has owner status.
    """
    user_profile = Profile.objects.get(user__pk=user.id)
    role = user_profile.role
    if not user.is_authenticated:
        return False
    if role == "Owner":
        return True
    return False

# TODO create method to check for view permission.
# View permission should be granted by a perproject basis.
# If somewone is allowed to view an object, and is "Developer" and above, then they should also be allowed to edit the item.


def check_permissions_ownership(user, target):
    user_profile = Profile.objects.get(user__pk=user.id)
    role = user_profile.role
    if not user.is_authenticated:
        return False
    if role == "Admin" or role == "Owner":
        return True
    if user == target:
        return True
    return False


def check_permissions_access(user, target, assignees):
    user_profile = Profile.objects.get(user__pk=user.id)
    role = user_profile.role
    if not user.is_authenticated:
        return False
    if role == "Admin" or role == "Owner":
        return True
    for assignee in assignees:
        if target == assignee:
            return True
    return False


def check_user_auth_and_app_permission(request, app_name):
    """Check if the request's user is authenticated and has the specified app in their allowed_apps list, 
    and if the request method is POST or PUT, check if the user's role is not 'Viewer'.

    Args:
        request: The HTTP request object containing the user and method.
        app_name (str): The name of the app. Possible apps include:
        "timesheet", "customers", "projects", "requirements", "documents",
        "parts", "assemblies", "pcbas", "production", "procurement".

    Returns:
        tuple: (bool, Response) - True and None if authorized, False and Response object if not.
    """
    user = request.user
    if not user:
        return (False, Response("Not Authorized", status=status.HTTP_401_UNAUTHORIZED))

    try:
        user_profile = Profile.objects.get(user=user)

        # Check if the user's role is 'Viewer' and the method is POST or PUT
        if request.method in ["POST", "PUT", "DELETE"] and user_profile.role == "Viewer":
            return (False, Response("Not Authorized: Viewers cannot modify content", status=status.HTTP_403_FORBIDDEN))

        if app_name in user_profile.allowed_apps:
            return (True, None)
        else:
            return (False, Response(f"Not Authorized to access this app: {app_name}", status=status.HTTP_403_FORBIDDEN))
    except Profile.DoesNotExist:
        return (False, Response("User profile not found", status=status.HTTP_404_NOT_FOUND))


def check_permissions_alter_persmissions(user, target):
    user_profile = Profile.objects.get(user__pk=user.id)
    target_profile = Profile.objects.get(user__pk=target.id)
    role = user_profile.role
    targetRole = target_profile.role
    if not user.is_authenticated:
        return False
    if user == target and role == "Owner":
        return True
    if user == target:
        return False
    if targetRole == "Owner" and role == "Admin":
        return False
    if targetRole == "Admin" and role == "Admin":
        return False
    if targetRole == "Admin" and role == "Owner":
        return True
    if role == "Admin" or role == "Owner":
        return True
    return False


# def check_tenant_exist(subdomain):
#     foundMatchingSchema = False
#     with schema_context("public"):
#         try:
#             tenant_model = get_tenant_model().objects.get(schema_name=subdomain)
#             foundMatchingSchema = True
#         except get_tenant_model().DoesNotExist:
#             foundMatchingSchema = False
#     return foundMatchingSchema


@api_view(('POST', 'PUT'))
@renderer_classes((JSONRenderer, ))
def verify2FA(request):
    data = request.data
    if 'onLogin' in data:
        if not data['onLogin']:
            user = request.user
            check = check_authentication(user)
            if not check:
                return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    if 'onLogin' not in data:
        user = request.user
        check = check_authentication(user)
        if not check:
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    data = request.data
    if 'code' not in data:
        return Response("No code sent with the request", status=status.HTTP_400_BAD_REQUEST)
    if data['code'] == None:
        return Response("No code sent with the request", status=status.HTTP_400_BAD_REQUEST)
    if 'onMissing' in data:
        if data['onMissing']:
            try:
                login_data = {
                    'username': data['username'], 'password': data['password']}
                serializer_login = LoginSerializer(data=login_data)
                serializer_login.is_valid(raise_exception=True)
                user = serializer_login.validated_data
                profile = Profile.objects.get(user=user)
                totp = pyotp.TOTP(profile.mfa_hash)
                if totp.verify(data['code']):
                    if not profile.mfa_validated:
                        profile.mfa_validated = True
                        profile.save()
                    user.last_login = datetime.now()
                    user.save()
                    return Response({
                        "user": UserSerializer(user).data,
                        "token": AuthToken.objects.create(user)[1],
                        "token_created": datetime.now().strftime("%d,%m,%Y,%H,%M,%S")
                    })  # Return tokens here
                else:
                    return Response(status=status.HTTP_406_NOT_ACCEPTABLE)
            except Profile.DoesNotExist:
                return Response(status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                return Response(status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_400_BAD_REQUEST)
    if 'onConfirm' in data:
        if data['onConfirm']:
            try:
                profile = Profile.objects.get(user__pk=user.id)
                totp = pyotp.TOTP(profile.mfa_hash)
                if totp.verify(data['code']):
                    return Response("Verified", status=status.HTTP_200_OK)
                else:
                    return Response(status=status.HTTP_406_NOT_ACCEPTABLE)
            except Profile.DoesNotExist:
                return Response(status=status.HTTP_404_NOT_FOUND)
            except Exception as e:
                return Response(status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_400_BAD_REQUEST)
    if 'onLogin' in data:
        if data['onLogin']:
            login_data = {
                'username': data['username'], 'password': data['password']}
            serializer_login = LoginSerializer(data=login_data)
            serializer_login.is_valid(raise_exception=True)
            user = serializer_login.validated_data
            profile = Profile.objects.get(user=user)
            totp = pyotp.TOTP(profile.mfa_hash)
            try:
                if totp.verify(data['code']):
                    user = User.objects.get(id=profile.user.id)
                    if not profile.mfa_validated:
                        profile.mfa_validated = True
                        profile.save()
                    user.last_login = datetime.now()
                    user.save()
                    return Response({
                        "user": UserSerializer(user).data,
                        "token": AuthToken.objects.create(user)[1],
                        "token_created": datetime.now().strftime("%d,%m,%Y,%H,%M,%S")
                    })  # Return tokens here
                else:
                    return Response(status=status.HTTP_406_NOT_ACCEPTABLE)
            except Exception as e:
                return Response(status=status.HTTP_400_BAD_REQUEST)
    try:
        profile = Profile.objects.get(user__pk=user.id)
        totp = pyotp.TOTP(profile.mfa_hash)
        if totp.verify(data['code']):
            profile.mfa_validated = True
            profile.save()
            return Response(status=status.HTTP_200_OK)
        else:
            profile.mfa_hash = None
            profile.mfa_validated = False
            return Response(status=status.HTTP_409_CONFLICT)
    except Profile.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(('POST', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def enable_2fa_totp(request):
    user = request.user
    check = check_authentication(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    try:
        profile = Profile.objects.get(user__pk=user.id)
        hash = pyotp.random_base32(128)
        profile.mfa_hash = hash
        profile.save()
        uri = pyotp.totp.TOTP(hash).provisioning_uri(
            profile.work_email, issuer_name="Dokuly")
        return Response(uri, status=status.HTTP_200_OK)
    except Profile.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
def enable_2fa_totp_from_login(request):
    data = request.data
    if data == None:
        return Response("Invalid request", status=status.HTTP_400_BAD_REQUEST)
    try:
        login_data = {'username': data['username'],
                      'password': data['password']}
        serializer_login = LoginSerializer(data=login_data)
        serializer_login.is_valid(raise_exception=True)
        user = serializer_login.validated_data
        profile = Profile.objects.get(user=user)
        hash = pyotp.random_base32(128)
        profile.mfa_hash = hash
        profile.save()
        uri = pyotp.totp.TOTP(hash).provisioning_uri(
            profile.work_email, issuer_name="Dokuly")
        return Response(uri, status=status.HTTP_200_OK)
    except Profile.DoesNotExist:
        return Response(status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(status=status.HTTP_400_BAD_REQUEST)


@api_view(('POST', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def remove_2fa_totp(request):
    user = request.user
    check = check_authentication(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    try:
        profile = Profile.objects.get(user=user.id)
        profile.mfa_hash = None
        profile.save()
        return Response("2FA removed", status=status.HTTP_200_OK)
    except Profile.DoesNotExist:
        return Response("Profile not found", status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
@permission_classes((IsAuthenticated, ))
def fetch_users(request):
    user = request.user
    if user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    users = UserSerializerNoPersonal(User.objects.all(), many=True).data
    profiles = ProfileSerializer(Profile.objects.all(), many=True).data
    data = []
    for profile in profiles:
        entry = profile
        entry['username'] = next((x for x in users if x['id'] == profile['user']))[
            'username']
        entry['email'] = next((x for x in users if x['id'] == profile['user']))[
            'email']
        data.append(entry)
    return Response(data, status=status.HTTP_200_OK)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def fetch_current_user_profile(request):
    user = request.user
    if user == None:
        return Response("No user", status=status.HTTP_204_NO_CONTENT)
    user_profile = Profile.objects.get(user__pk=user.id)
    has_mfa = False
    if user_profile.mfa_hash != None:
        has_mfa = True
    data = ProfileSerializer(user_profile, many=False).data
    data['has_mfa'] = has_mfa
    return Response(data, status=status.HTTP_200_OK)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def fetch_user_profile(request, userId):
    user = request.user
    if user == None:
        return Response("No user", status=status.HTTP_204_NO_CONTENT)
    user_profile = Profile.objects.get(user__pk=userId)

    data = ProfileSerializer(user_profile, many=False).data
    return Response(data, status=status.HTTP_200_OK)


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def alter_permissions(request):
    user = request.user
    target = 0
    if 'user_id' in request.data:
        target = User.objects.get(id=request.data['user_id'])
    if user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    check = check_permissions_alter_persmissions(user, target)
    if not check:
        return Response("Unauthorized. Only Owner can demote and create Admins", status=status.HTTP_401_UNAUTHORIZED)
    data = request.data
    if data == None or data['user_id'] == None:
        res = Profile.objects.all()
        serializer = ProfileSerializer(res, many=True)
        return Response(serializer.data, status=status.HTTP_400_BAD_REQUEST)
    Profile.objects.filter(user__pk=data['user_id']).update(role=data['role'])
    check = Profile.objects.get(user__pk=data['user_id'])
    serializer = ProfileSerializer(check, many=False)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(('PUT',))
@renderer_classes((JSONRenderer,))
@login_required(login_url='/login')
def alter_allowed_apps(request):
    try:
        user = request.user
        data = request.data
        target = User.objects.get(id=request.data.get('user_id'))
        if not user:
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

        if not check_permissions_alter_persmissions(user, target):
            return Response("Unauthorized. Only Owner can demote and create Admins", status=status.HTTP_401_UNAUTHORIZED)

        allowed_apps = data.get('allowed_apps', None)
        if isinstance(allowed_apps, str):
            try:
                allowed_apps = json.loads(allowed_apps)
            except json.JSONDecodeError:
                return Response("Malformed allowed apps data", status=status.HTTP_400_BAD_REQUEST)

        if not isinstance(allowed_apps, list) or allowed_apps is None:
            return Response("Allowed apps must be a list", status=status.HTTP_400_BAD_REQUEST)

        current_profile = Profile.objects.get(user=target)


        current_profile.allowed_apps = allowed_apps
        current_profile.save()
        serializer = ProfileSerializer(current_profile)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(f"alter_allowed_apps failed: {e}", status=status.HTTP_400_BAD_REQUEST)



def count_subscription_types():
    subscriptions = Subscription.objects.annotate(plan_name=F(
        'subscription_data__plan_name')).values('plan_name').annotate(total=Sum('count'))
    return {sub['plan_name']: sub['total'] for sub in subscriptions}


def count_users_by_allowed_apps():
    profiles = Profile.objects.all()
    user_counts = {}
    for profile in profiles:
        for app in profile.allowed_apps:
            user_counts[app] = user_counts.get(app, 0) + 1
    return user_counts


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def update_user_profile(request, userId):
    try:
        user = request.user
        if user == None:
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
        check = check_permissions_ownership(user, userId)
        if not check:  # Check permissions
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
        data = request.data
        if data == None or userId == None:
            res = Profile.objects.all()
            serializer = ProfileSerializer(res, many=True)
            return Response(serializer.data, status=status.HTTP_400_BAD_REQUEST)

        profile = Profile.objects.get(user__pk=userId)

        if "address" in data:
            profile.address = data['address']
        if "first_name" in data:
            profile.first_name = data['first_name']
        if "last_name" in data:
            profile.last_name = data['last_name']
        if "personal_number" in data:
            profile.personal_number = data['personal_number']
        if "position" in data:
            profile.position = data['position']
        if "position_percentage" in data:
            profile.position_percentage = data['position_percentage']
        if "salary_account" in data:
            profile.salary_account = data['salary_account']
        if "personal_email" in data:
            profile.personal_email = data['personal_email']
        if "personal_phone_number" in data:
            profile.personal_phone_number = data['personal_phone_number']
        if "work_email" in data:
            profile.work_email = data['work_email']
        if "is_active" in data:
            profile.is_active = data['is_active']
        if "notify_user_on_issue_creation" in data:
            profile.notify_user_on_issue_creation = data['notify_user_on_issue_creation']
        if "notify_user_on_issue_close" in data:
            profile.notify_user_on_issue_close = data['notify_user_on_issue_close']
        if "notify_user_on_item_new_revision" in data:
            profile.notify_user_on_item_new_revision = data['notify_user_on_item_new_revision']
        if "notify_user_on_item_passed_review" in data:
            profile.notify_user_on_item_passed_review = data['notify_user_on_item_passed_review']
        if "notify_user_on_item_released" in data:
            profile.notify_user_on_item_released = data['notify_user_on_item_released']
        if "notify_user_on_added_to_project" in data:
            profile.notify_user_on_added_to_project = data['notify_user_on_added_to_project']
        if "notify_user_on_became_project_owner" in data:
            profile.notify_user_on_became_project_owner = data['notify_user_on_became_project_owner']

        profile.save()

        res = Profile.objects.all().exclude(user__pk=user.id)
        res = list(res) + [profile]
        # Add the new profile to the list
        serializer = ProfileSerializer(res, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(f"update_user_profile failed: {e}", status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def activate_user(request):
    user = request.user
    if user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    data = request.data
    if data == None or data['user_id'] == None:
        res = Profile.objects.all()
        serializer = ProfileSerializer(res, many=True)
        return Response(serializer.data, status=status.HTTP_400_BAD_REQUEST)
    Profile.objects.filter(user__pk=data['user_id']).update(is_active=True)
    res = Profile.objects.all()
    serializer = ProfileSerializer(res, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(('POST', ))
@renderer_classes((JSONRenderer, ))
@transaction.atomic
def new_user_and_profile(request):
    try:
        if 'adminPass' in request.data:  # Temp access point for posting users
            if str(request.data['adminPass']) == str(os.getenv('adminPass')):
                print("Access granted")
            else:
                return Response("Unauthorized, non matching passwords", status=status.HTTP_401_UNAUTHORIZED)
        else:
            user = request.user
            if user == None:
                return Response("Unauthorized, error code 1", status=status.HTTP_401_UNAUTHORIZED)
            check = check_permissions_standard(user)
            if not check:
                return Response("Unauthorized, error code 2", status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        if data is None:
            res = Profile.objects.all()
            serializer = ProfileSerializer(res, many=True)
            return Response(serializer.data, status=status.HTTP_400_BAD_REQUEST)

        # Generate a random password
        password = generate_random_password()

        accountData = {
            'email': data.get('work_email'),
            'first_name': data.get('first_name'),
            'last_name': data.get('last_name'),
            'password': password,  # Use the generated password
            'username': data.get('username')
        }

        serializer = RegisterSerializer(data=accountData)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        organization = None
        try:
            organization = Organization.objects.last()
        except Organization.DoesNotExist:
            organization = None
        user = serializer.save()
        newUser = User.objects.last()
        role = "User"
        allowed_apps = ["timesheet", "customers", "projects",
                        "documents", "parts", "assemblies", "pcbas",
                        "production", "procurement"]

        if 'role' in data:
            role = data['role']
            if data['role'] == "Viewer":
                allowed_apps = []

        if organization != None:
            profile = Profile.objects.create(
                id=user.id,
                user=user,
                first_name=data.get('first_name'),
                last_name=data.get('last_name'),
                work_email=data.get('work_email'),
                role=role,
                organization_id=organization.id,
                allowed_apps=allowed_apps
            )
        else:
            profile = Profile.objects.create(
                id=user.id,
                user=user,
                first_name=data.get('first_name'),
                last_name=data.get('last_name'),
                work_email=data.get('work_email'),
                role=role,
                allowed_apps=allowed_apps
            )
        try:
            local_server = bool(int(os.environ.get('DJANGO_LOCAL_SERVER', 0)))
            token = {
                "token": AuthToken.objects.create(user)[1],
                "token_created:": datetime.now().strftime("%Y,%m,%d,%H,%M,%S")
            }
            resetLink = f"https://{organization.tenant_id}.dokuly.com/#/passwordRecovery/{token['token']}/{user.id}"
            if local_server:
                resetLink = f"http://{organization.tenant_id}.dokuly.localhost:8000/#/passwordRecovery/{token['token']}/{user.id}"
            send_reset_password_mail_with_template(
                organization, user, profile.first_name, data.get('work_email'), resetLink)
        except Exception as e:
            return Response(f"Failed to send password reset email: {e}", status=status.HTTP_400_BAD_REQUEST)
        newProfiles = Profile.objects.all()
        profilesSerializer = ProfileSerializer(newProfiles, many=True)
        return Response(profilesSerializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(f"new_user_and_profile failed: {e}", status=status.HTTP_400_BAD_REQUEST)


def send_new_user_password_reset(organization, user, first_name, email):
    try:
        token = {
            "token": AuthToken.objects.create(user)[1],
            "token_created:": datetime.now().strftime("%Y,%m,%d,%H,%M,%S")
        }
        resetLink = f"https://{organization.tenant_id}.dokuly.com/#/passwordRecovery/{token['token']}/{user.id}"
        send_mail(
            subject='Welcome to Dokuly',
            message=f'Hello {first_name}\n\n You have been added to the {organization.name} workspace. Please click the link below to set your password.\nClick here to reset you password: {resetLink}\n\n\nBest Regards,\nDokuly Team',
            from_email=settings.EMAIL_SENDER,
            auth_user=settings.EMAIL_HOST_USER,
            auth_password=settings.EMAIL_HOST_PASSWORD,
            recipient_list=[email],
            fail_silently=False,
        )
        return Response("Mail sent", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(f"send_reset_pass_mail failed: {e}", status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def generate_random_password(length=25):
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(random.choice(characters) for i in range(length))

@api_view(('PUT', 'POST', 'GET'))
@renderer_classes((JSONRenderer, ))
def send_reset_pass_mail(request):
    try:
        if request.data == None:
            return Response("No content", status=status.HTTP_400_BAD_REQUEST)
        recipient = ""
        if 'workEmail' in request.data:
            recipient = request.data['workEmail']
        if recipient == "":
            return Response("No target", status=status.HTTP_400_BAD_REQUEST)
        user_profile = Profile.objects.get(
            work_email=request.data['workEmail'])
        user = User.objects.get(id=user_profile.user.id)
        if user == None:
            return Response("User not found", status=status.HTTP_204_NO_CONTENT)
        token = {
            "token": AuthToken.objects.create(user)[1],
            "token_created:": datetime.now().strftime("%Y,%m,%d,%H,%M,%S")
        }
        resetLink = f"http://{settings.LOCAL_FORWARD_IP}/#/passwordRecovery/{token['token']}/{user.id}"
        send_mail(
            subject='Password Recovery',
            message=f'Hello {user.username}\n\nSomeone has requested to reset the password connected to this email account.\nIF THIS WAS NOT YOU IGNORE THIS EMAIL\nClick here to reset you password: {resetLink}\n\n\nBest Regards,\nDokuly Team',
            from_email=settings.EMAIL_SENDER,
            auth_user=settings.EMAIL_HOST_USER,
            auth_password=settings.EMAIL_HOST_PASSWORD,
            recipient_list=[recipient],
            fail_silently=False,
        )
        return Response("Mail sent", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(f"send_reset_pass_mail failed: {e}", status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(('PUT',))
@renderer_classes((JSONRenderer, ))
def check_token(request):
    data = request.data
    if data == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    validate = TokenAuthentication.authenticate_header(
        TokenAuthentication, request)
    if validate == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    user = User.objects.get(id=data['user'])
    if user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    return Response("", status=status.HTTP_200_OK)


@api_view(('PUT',))
@renderer_classes((JSONRenderer, ))
def reset_password_by_mail(request, userId):
    try:
        data = request.data
        validate = TokenAuthentication.authenticate_header(
            TokenAuthentication, request)
        if validate == None:
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
        if userId == None or data == None:
            return Response("Invalid server parameters", status=status.HTTP_400_BAD_REQUEST)
        if 'password' in data:
            try:
                user = User.objects.get(id=userId)
                user.set_password(data['password'])
                user.save()
                request._auth.delete()
                return Response("Success", status=status.HTTP_202_ACCEPTED)
            except User.DoesNotExist:
                return Response("User not found", status=status.HTTP_404_NOT_FOUND)
        return Response("Invalid server parameters", status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        return Response(f"send_reset_pass_mail failed: {e}", status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(('POST', ))
@renderer_classes((JSONRenderer, ))
def check_email_unique(request):
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    try:
        profiles = ProfileSerializer(Profile.objects.all(), many=True).data
        d = request.data
        for profile in profiles:
            if profile['work_email'] == d['email']:
                return Response(False, status=status.HTTP_409_CONFLICT)
        return Response(True, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(('PUT',))
@renderer_classes((JSONRenderer, ))
def admin_reset_user_password(request, userId):
    """
    Admin-only endpoint to reset a user's password without requiring email.
    This is useful for deployments without an email server configured.
    """
    try:
        # Check authentication
        if not request.user or not request.user.is_authenticated:
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if user is Owner
        try:
            user_profile = Profile.objects.get(user=request.user)
            if user_profile.role not in ["Owner"]:
                return Response("Only Owner can reset passwords", status=status.HTTP_403_FORBIDDEN)
        except Profile.DoesNotExist:
            return Response("User profile not found", status=status.HTTP_404_NOT_FOUND)
        
        # Validate request data
        data = request.data
        if not data or 'password' not in data:
            return Response("Password is required", status=status.HTTP_400_BAD_REQUEST)
        
        password = data['password']
        if len(password) < 8:
            return Response("Password must be at least 8 characters", status=status.HTTP_400_BAD_REQUEST)
        
        # Reset the password
        try:
            target_user = User.objects.get(id=userId)
            target_user.set_password(password)
            target_user.save()
            return Response("Password reset successfully", status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response("User not found", status=status.HTTP_404_NOT_FOUND)
            
    except Exception as e:
        return Response(f"admin_reset_user_password failed: {e}", status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(('PUT',))
@renderer_classes((JSONRenderer, ))
def admin_reset_user_2fa(request, userId):
    """
    Admin-only endpoint to reset a user's 2FA settings.
    Resets mfa_hash and mfa_validated for the target user.
    Similar to the 2FA reset in organization enforce_2fa handling.
    """
    try:
        # Check authentication
        if not request.user or not request.user.is_authenticated:
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
        
        # Check if user is Owner
        try:
            user_profile = Profile.objects.get(user=request.user)
            if user_profile.role not in ["Owner"]:
                return Response("Only Owner can reset 2FA", status=status.HTTP_403_FORBIDDEN)
        except Profile.DoesNotExist:
            return Response("User profile not found", status=status.HTTP_404_NOT_FOUND)
        
        # Reset the 2FA for target user
        try:
            target_user = User.objects.get(id=userId)
            target_profile = Profile.objects.get(user=target_user)
            target_profile.mfa_hash = None
            target_profile.mfa_validated = False
            target_profile.save()
            return Response("2FA reset successfully", status=status.HTTP_200_OK)
        except User.DoesNotExist:
            return Response("User not found", status=status.HTTP_404_NOT_FOUND)
        except Profile.DoesNotExist:
            return Response("User profile not found", status=status.HTTP_404_NOT_FOUND)
            
    except Exception as e:
        return Response(f"admin_reset_user_2fa failed: {e}", status=status.HTTP_500_INTERNAL_SERVER_ERROR)
