import re
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from django.contrib.auth.decorators import login_required
from django.db.models import Q
from django.contrib.postgres.search import SearchVector

from rest_framework import status
from datetime import datetime
from datetime import date

from .models import Supplier
from .serializers import PriceSerializer
from profiles.models import Profile
from parts.models import Part
from .priceModel import Price
from profiles.views import check_permissions_standard
from profiles.serializers import ProfileSerializer

from django.contrib.auth.models import User
from accounts.serializers import UserSerializer
from profiles.views import check_permissions_ownership, check_permissions_standard


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_latest_prices(request, app, id):
    """Returns a list of all active prices for an item."""
    user = request.user
    if user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    try:
        filters = {"is_latest_price": True}
        if app == "parts":
            filters["part_id"] = id
        elif app == "assemblies":
            filters["assembly_id"] = id
        elif app == "pcbas":
            filters["pcba_id"] = id
        else:
            return Response("Invalid app", status=status.HTTP_400_BAD_REQUEST)

        prices = Price.objects.filter(**filters).select_related("supplier")
        serializer = PriceSerializer(prices, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"get_latest_prices failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_price_history(request, app, id):
    """Returns a list of all prices for an item."""
    user = request.user
    if user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    try:
        filters = {}
        if app == "parts":
            filters["part_id"] = id
        elif app == "assemblies":
            filters["assembly_id"] = id
        elif app == "pcbas":
            filters["pcba_id"] = id
        else:
            return Response("Invalid app", status=status.HTTP_400_BAD_REQUEST)

        prices = Price.objects.filter(**filters).select_related("supplier")
        serializer = PriceSerializer(prices, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"get_price_history failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def add_new_price(request, app, id):
    """Add a new price entry."""
    user = request.user
    if user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    try:
        data = request.data

        price = Price()
        price.price = data["price"]
        price.minimum_order_quantity = data["minimum_order_quantity"]
        price.currency = data["currency"]
        price.is_latest_price = True
        price.created_by = request.user

        if app == "parts":
            price.part_id = id
        elif app == "assemblies":
            price.assembly_id = id
        elif app == "pcbas":
            price.pcba_id = id
        else:
            return Response("Undefined App", status=status.HTTP_400_BAD_REQUEST)

        if "supplier_id" in data and data["supplier_id"] != None:
            price.supplier_id = data["supplier_id"]

        price.save()

        serializer = PriceSerializer(price, many=False)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            f"create_new_supplier failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def edit_price(request, price_id):
    """Edit a price entry. We save all previous prices to enable price history for parts."""
    user = request.user
    if user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    try:
        data = request.data

        price = Price.objects.get(id=price_id)
        # If the last change was made earlier than today, then we create a new price entry
        if price.created_at.date() < date.today():
            price.is_latest_price = False
            price.save()
            # Then make a copy of the old price
            price.id = None
            price.created_at = datetime.now()
            price.is_latest_price = True

        if "price" in data:
            price.price = data["price"]
        if "minimum_order_quantity" in data:
            price.minimum_order_quantity = data["minimum_order_quantity"]
        if "currency" in data:
            price.currency = data["currency"]
        if "supplier_id" in data and data["supplier_id"] != None:
            price.supplier_id = data["supplier_id"]

        price.save()

        serializer = PriceSerializer(price, many=False)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"edit_price failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(("DELETE",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def delete_or_deactivate_price(request, price_id):
    """Edit a price entry. We save all previous prices to enable price history for parts."""
    user = request.user
    if user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    try:
        price = Price.objects.get(id=price_id)
        # If the last change was made earlier than today, then we create a new price entry
        if price.created_at.date() < date.today():
            price.is_latest_price = False
            price.save()
        else:
            # Actuallu delete part
            price.delete()

        return Response("Part deleted", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"delete_or_deactivate_price failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
