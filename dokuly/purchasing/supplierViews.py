from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from .models import Supplier
from .serializers import SupplierSerializer
from profiles.models import Profile
from parts.models import Part
from profiles.views import check_permissions_standard, check_user_auth_and_app_permission
from profiles.serializers import ProfileSerializer
from django.db.models import Q
from django.contrib.postgres.search import SearchVector
from django.contrib.auth.models import User
from accounts.serializers import UserSerializer
from profiles.views import check_permissions_ownership, check_permissions_standard
from django.contrib.auth.decorators import login_required
from customers.views import next_customer_supplier_number
from files.models import Image

# Create your views here.


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def get_all_suppliers(request):
    """Returns a list of all suppliers.
    Note: Read access is not restricted - all authenticated users can view suppliers.
    """
    # No permission check for reading suppliers - all authenticated users can view
    # This allows users to select suppliers when creating prices even without procurement permission
    
    suppliers = Supplier.objects.all()
    serializerSupplier = SupplierSerializer(suppliers, many=True)

    return Response(serializerSupplier.data, status=status.HTTP_200_OK)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def get_supplier(request, supplier_id):
    """Returns a single purchase order.
    """
    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "procurement")
    if not permission:
        return response

    supplier = Supplier.objects.get(pk=supplier_id)
    serializerSupplier = SupplierSerializer(supplier, many=False)

    return Response(serializerSupplier.data, status=status.HTTP_200_OK)


@api_view(('POST', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def create_supplier(request):
    """Creates a new purchase order.
    """
    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "procurement")
    if not permission:
        return response
    try:
        data = request.data
        supplier = Supplier()
        supplier.name = data["name"]
        supplier.supplier_id = next_customer_supplier_number()
        supplier.address = data["address"]
        supplier.contact = data["contact"]
        supplier.phone = data["phone"]
        supplier.email = data["email"]
        supplier.notes = data["notes"]
        supplier.default_currency = data["default_currency"]
        supplier.default_payment_terms = data.get("default_payment_terms", "")
        supplier.default_shipping_terms = data.get("default_shipping_terms", "")
        supplier.archived = False

        supplier.created_by = user
        supplier.save()

        serializer = SupplierSerializer(supplier, many=False)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(f"create_new_supplier failed: {e}", status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def update_supplier(request, supplier_id):
    """Updates a supplier.
    """
    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "procurement")
    if not permission:
        return response

    supplier = Supplier.objects.get(pk=supplier_id)
    serializer = SupplierSerializer(supplier, data=request.data)

    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(('DELETE', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def delete_supplier(request, supplier_id):
    """Deletes a purchase order.
    """
    user = request.user
    permission, response = check_user_auth_and_app_permission(
        request, "procurement")
    if not permission:
        return response

    supplier = Supplier.objects.get(pk=supplier_id)
    supplier.delete()

    return Response(status=status.HTTP_204_NO_CONTENT)


@ api_view(("PUT",))
@ renderer_classes((JSONRenderer,))
@ login_required(login_url="/login")
def update_thumbnail(request, supplierID, imageID):
    permission, response = check_user_auth_and_app_permission(
        request, "procurement")
    if not permission:
        return response

    try:
        supplier = Supplier.objects.get(pk=supplierID)
        supplier.thumbnail = Image.objects.get(pk=imageID)
        supplier.save()
        serializer = SupplierSerializer(supplier, many=False)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Part.DoesNotExist:
        return Response("Object not found", status=status.HTTP_404_NOT_FOUND)
