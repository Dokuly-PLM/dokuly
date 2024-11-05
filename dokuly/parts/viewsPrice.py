from datetime import datetime

from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status

from django.contrib.auth.decorators import login_required

from parts.models import Part
from pcbas.models import Pcba
from assemblies.models import Assembly
from purchasing.suppliermodel import Supplier
from profiles.views import check_user_auth_and_app_permission


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def update_price(request, app, item_id):
    permission, response = check_user_auth_and_app_permission(request, app)
    if not permission:
        return response

    try:
        data = request.data

        item = None
        if app == "parts":
            item = Part.objects.get(pk=item_id)
        elif app == "pcbas":
            item = Pcba.objects.get(pk=item_id)
        elif app == "assemblies":
            item = Assembly.objects.get(pk=item_id)

        if "price" in data:
            item.price = data["price"]

        if "currency" in data:
            item.currency = data["currency"]

        if "supplier" in data:
            if data["supplier"] == -1:
                item.supplier = None

            if data["supplier"] != -1 and data["supplier"] != None:
                supplier = Supplier.objects.get(pk=data["supplier"])
                item.supplier = supplier

        item.save()
        return Response("Sucsessuflly updated price", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(f"update_price failed: {e}", status=status.HTTP_400_BAD_REQUEST)
