from rest_framework.decorators import api_view, renderer_classes
from rest_framework.response import Response
from rest_framework.renderers import JSONRenderer
from django.contrib.auth.decorators import login_required
from rest_framework import status

from parts.models import PartType
from .serializers import PartTypeSerializer
from profiles.views import check_user_auth_and_app_permission


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_part_types(request):
    permission, response = check_user_auth_and_app_permission(request, "parts")
    if not permission:
        return response
    try:
        part_types = PartType.objects.all()
        serializer = PartTypeSerializer(part_types, many=True)
        return Response(serializer.data)
    except Exception as e:
        return Response(
            f"get_part_types failed: {e}", status=status.HTTP_400_BAD_REQUEST
        )


@api_view(["POST"])
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def add_part_type(request):
    permission, response = check_user_auth_and_app_permission(request, "parts")
    if not permission:
        return response
    try:
        data = request.data
        part_type = PartType.objects.create(name=data["name"])
        part_type.prefix = data["prefix"]
        part_type.created_by = request.user
        if "description" in data:
            part_type.description = data["description"]
        if "default_unit" in data:
            part_type.default_unit = data["default_unit"]
        if "icon_url" in data:
            part_type.icon_url = data["icon_url"]

        part_type.save()
        return Response("Part type added successfully")
    except Exception as e:
        return Response(
            f"add_part_type failed: {e}", status=status.HTTP_400_BAD_REQUEST
        )


@api_view(["PUT"])
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def edit_part_type(request, id):
    permission, response = check_user_auth_and_app_permission(request, "parts")
    if not permission:
        return response
    try:
        data = request.data
        part_type = PartType.objects.get(pk=id)
        if "name" in data:
            part_type.name = data["name"]
        if "description" in data:
            part_type.description = data["description"]
        if "prefix" in data:
            part_type.prefix = data["prefix"]
        if "default_unit" in data:
            part_type.default_unit = data["default_unit"]
        if "icon_url" in data:
            part_type.icon_url = data["icon_url"]

        part_type.save()
        return Response("Part type added successfully")
    except Exception as e:
        return Response(
            f"add_part_type failed: {e}", status=status.HTTP_400_BAD_REQUEST
        )


@api_view(["POST"])
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def delete_part_type(request, id):
    permission, response = check_user_auth_and_app_permission(request, "parts")
    if not permission:
        return response
    try:
        part_type = PartType.objects.get(id=id)
        part_type.delete()
        return Response("Part type deleted successfully", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"delete_part_type failed: {e}", status=status.HTTP_400_BAD_REQUEST
        )
