from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from purchasing.suppliermodel import Supplier
from .models import Customer
from .serializers import CustomerSerializer
from profiles.views import check_permissions_standard, check_user_auth_and_app_permission
from django.contrib.auth.decorators import login_required
from rest_framework.permissions import IsAuthenticated
from organizations.permissions import APIAndProjectAccess


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def edit_customer(request, customerId):
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "customers")
    if not permission:
        return response
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    if request.data == None or customerId == None:
        res = Customer.objects.all()
        serializer = CustomerSerializer(res, many=True)
        return Response(serializer.data, status=status.HTTP_400_BAD_REQUEST)
    customer = Customer.objects.get(id=customerId)
    serializer = CustomerSerializer(customer, data=request.data)
    if serializer.is_valid():
        serializer.save()
        customers = Customer.objects.all()
        serializerCustomers = CustomerSerializer(customers, many=True)
        if len(serializerCustomers.data) != 0:
            data = [serializer.data, serializerCustomers.data]
            return Response(data, status=status.HTTP_200_OK)
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


def next_customer_supplier_number():
    """Find next available customer number.
    Simply incerments the highest number.
    """
    customers = Customer.objects.all()
    suppliers = Supplier.objects.all()

    if len(customers) == 0 and len(suppliers) == 0:
        return 100
    highest_id = 100
    for item in customers:
        if item.customer_id == None:
            continue
        if highest_id < item.customer_id:
            highest_id = item.customer_id
    for item in suppliers:
        if item.supplier_id == None:
            continue
        if highest_id < item.supplier_id:
            highest_id = item.supplier_id
    return highest_id + 1


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def create_new_customer(request):
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "customers")
    if not permission:
        return response
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    try:
        data = request.data
        customer = Customer()
        customer.name = data["name"]
        customer.contact_name = data["contact_name"]
        customer.contact_email = data["contact_email"]
        customer.contact_phone_number = data["contact_phone_number"]
        customer.customer_id = next_customer_supplier_number()
        customer.customer_contact = request.user
        customer.save()
        serializer = CustomerSerializer(customer, many=False)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            f"create_new_customer failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def get_active_customers(request, **kwargs):
    if APIAndProjectAccess.has_validated_key(request):
        if not APIAndProjectAccess.check_wildcard_access(request):
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    active_customers = Customer.objects.filter(is_active=True).exclude(is_archived=True)
    serializer = CustomerSerializer(active_customers, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


# TODO: this view isbuggy
@api_view(("GET",))
@renderer_classes((JSONRenderer,))
def get_customer(request, customer_id):
    permission, response = check_user_auth_and_app_permission(request, "customers")
    if not permission:
        return response

    customer = Customer.objects.filter(id=customer_id)
    serializer = CustomerSerializer(customer, many=False)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
def get_customers(request):
    """Return all customers"""
    if request.user is None:
        return Response("No user", status=status.HTTP_401_UNAUTHORIZED)

    active_customers = Customer.objects.filter()  # TODO(archived=False)
    # print(active_customers)
    serializer = CustomerSerializer(active_customers, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
def get_unarchived_customers(request):
    """Return all unarchived customers. Including inactive."""
    permission, response = check_user_auth_and_app_permission(request, "customers")
    if not permission:
        return response

    unarchived_customers = Customer.objects.exclude(is_archived=True)
    serializer = CustomerSerializer(unarchived_customers, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
