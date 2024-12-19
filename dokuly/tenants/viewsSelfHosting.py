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
# from .models import Tenant, Domain, SignupInfo
from django.utils.crypto import get_random_string
# from .serializers import TenantSerializer, SignUpSerializer
from organizations.models import Organization, Subscription
from organizations.serializers import CustomerOrganizationSerializer, SubscriptionSerializer
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


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
def initialize_tenant_for_self_hosting(request):
    local_server = bool(int(os.environ.get('DJANGO_LOCAL_SERVER', 0)))
    if not local_server:
        return Response("", status=status.HTTP_404_NOT_FOUND)
    if request.method != 'PUT':
        return Response("", status=status.HTTP_404_NOT_FOUND)
    data = request.data
    try:
        signup = SignupInfo.objects.get(userid_username=data['userid'])
        max_allowed_active_users = 3
        try:
            if 'quantity' in signup.subscription_info:
                max_allowed_active_users = signup.subscription_info.get(
                    'quantity')
        except Exception as e:
            print(str(e))
            max_allowed_active_users = 3

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
            if domain_name == None:
                domain_name = "tenant"+str(len(qs)+1)  # Secondary domain
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
                    domain = Domain(domain=str(
                        f"{domain_name}.dokuly.localhost"), tenant=tenant, is_primary=True)
                else:
                    domain = Domain(domain=str(
                        f"{domain_name}.dokuly.com"), tenant=tenant, is_primary=True)
                domain.save()
                ascii_string = string.ascii_lowercase
                password = ''.join(random.choice(ascii_string)
                                   for i in range(int(random.randint(16, 22))))
                DomainNames.objects.create(
                    schema_name=domain
                )
                email = data.get("email", "")
                with tenant_context(tenant):
                    accountData = {
                        'email': email,
                        'first_name': first_name,
                        'last_name': last_name,
                        'password': password,
                        'username': username
                    }
                    serializer = RegisterSerializer(data=accountData)
                    serializer.is_valid(raise_exception=True)
                    user = serializer.save()
                    system_cost = 0
                    storage_limit = 1073741824
                    try:
                        if 'subscription_plan_id' in subscription_info:
                            if int(subscription_info['subscription_plan_id']) == 847269:
                                storage_limit = 10737418240
                            elif int(subscription_info['subscription_plan_id']) == 847241:
                                storage_limit = 10737418240 * 2
                    except Exception as e:
                        storage_limit = 1073741824
                    org = Organization.objects.create(
                        org_number='000',
                        name=domain_name,
                        tenant_id=domain_name,
                        stripe_subscription_ids=["deprecated"],
                        max_allowed_active_users=max_allowed_active_users,
                        current_system_cost=system_cost,
                        storage_limit=storage_limit
                    )
                    profile = Profile.objects.create(
                        id=user.id,
                        user=user,
                        first_name=first_name,
                        last_name=last_name,
                        work_email=email,
                        personal_phone_number=' ',
                        address=' ',
                        position=' ',
                        position_percentage='100',
                        role='Owner',
                        organization_id=org.id
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
                                checkout_status=True
                            )
                    except Exception as e:
                        print("Could not save subscription object", str(e))
                    try:
                        customer = Customer.objects.create(
                            name=domain_name,
                            contact_name='Admin',
                            contact_email=str(email),
                            contact_phone_number=' ',
                            description="Your very own customer, representing your business.",
                            customer_id=100,
                            customer_contact=user,
                            is_active=True,
                            favorite_project="100",
                            favorite_task="Timeadmin",
                        )
                    except Exception as e:
                        print(e)
                    if customer != None:
                        try:
                            project = Project.objects.create(
                                title='General',
                                description='A blank starter project, edit this to describe it in your own way or create a new one!',
                                project_number=100,
                                customer=customer,
                                project_contact=profile,
                            )
                        except Exception as e:
                            print(e)
                        Task.objects.create(
                            title='Project Management',
                            description='Time spent managing projects, customers and other dokuly items.',
                            project_id=project.id,
                        )
                        Task.objects.create(
                            title='Documentation',
                            description='Time spent creating, writing and revisioning documents.',
                            project_id=project.id,
                        )
                        Task.objects.create(
                            title='Design Work',
                            description='Time spent on company projects.',
                            project_id=project.id,
                        )
                        serializer = ProfileSerializer(profile, many=False)
                        url = "https://www.google-analytics.com/batch?"
                        params = {
                            "v": 1,
                            "tid": settings.GOOGLE_ANALYTICS_CLIENT_ID,
                            "cid": "555",
                            "t": "event",
                            "ec": "ecommerce",
                            "ea": "purchase"
                        }
                        req = requests.PreparedRequest()
                        req.prepare_url(url, params)
                        res = requests.post(req.url)
                        print(res)
                        user_obj = User.objects.get(id=user.id)
                        token = {
                            "token": AuthToken.objects.create(user_obj)[1],
                            "token_created:": datetime.now().strftime("%Y,%m,%d,%H,%M,%S")
                        }
                        resetLink = f"https://{domain_name}.dokuly.com/#/passwordRecovery/{token['token']}/{user_obj.id}"
                        if local_server:
                            resetLink = f"http://{domain_name}.dokuly.localhost:8000/#/passwordRecovery/{token['token']}/{user_obj.id}"
                        send_workspace_creation_email(
                            email, domain_name, resetLink, username)
                        send_mail(
                            subject='New Workspace Created',
                            message=f'We got a new workspace!: \
                            \nWorkspace name: {domain_name} \
                            \nName of the user: {first_name} - {last_name} \
                            \nEmail of the user: {email}',
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
                    subject='Error in tenant creation, inner try catch',
                    message=f'Error: {str(e)}',
                    from_email=settings.EMAIL_SENDER,
                    auth_user=settings.EMAIL_HOST_USER,
                    auth_password=settings.EMAIL_HOST_PASSWORD,
                    recipient_list=["dokuly@norskdatateknikk.no"],
                    fail_silently=False,
                )
                return Response(error, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response("No email entered in the request, try again", status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(str(e))
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)
