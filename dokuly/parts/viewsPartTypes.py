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
        # Validate that prefix and applies_to combination is unique
        prefix = data.get("prefix", "")
        applies_to = data.get("applies_to", "Part")

        # Check if a part type with the same prefix and applies_to already exists
        existing = PartType.objects.filter(prefix=prefix, applies_to=applies_to).first()
        if existing:
            return Response(
                f"A part type with prefix '{prefix}' already exists for {applies_to}",
                status=status.HTTP_400_BAD_REQUEST
            )

        part_type = PartType.objects.create(name=data["name"])
        part_type.prefix = prefix
        part_type.applies_to = applies_to
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
def edit_part_type(request, part_type_id):
    permission, response = check_user_auth_and_app_permission(request, "parts")
    if not permission:
        return response
    try:
        data = request.data
        part_type = PartType.objects.get(pk=part_type_id)

        # Validate prefix and applies_to combination if either is being changed
        new_prefix = data.get("prefix", part_type.prefix)
        new_applies_to = data.get("applies_to", part_type.applies_to)

        # Check if another part type with the same prefix and applies_to already exists
        existing = PartType.objects.filter(
            prefix=new_prefix,
            applies_to=new_applies_to
        ).exclude(pk=part_type_id).first()
        if existing:
            return Response(
                f"A part type with prefix '{new_prefix}' already exists for {new_applies_to}",
                status=status.HTTP_400_BAD_REQUEST
            )

        if "name" in data:
            part_type.name = data["name"]
        if "description" in data:
            part_type.description = data["description"]
        if "prefix" in data:
            part_type.prefix = data["prefix"]
        if "applies_to" in data:
            part_type.applies_to = data["applies_to"]
        if "default_unit" in data:
            part_type.default_unit = data["default_unit"]
        if "icon_url" in data:
            part_type.icon_url = data["icon_url"]

        part_type.save()
        return Response("Part type updated successfully")
    except Exception as e:
        return Response(
            f"edit_part_type failed: {e}", status=status.HTTP_400_BAD_REQUEST
        )


@api_view(["POST"])
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def delete_part_type(request, part_type_id):
    permission, response = check_user_auth_and_app_permission(request, "parts")
    if not permission:
        return response
    try:
        part_type = PartType.objects.get(id=part_type_id)
        part_type.delete()
        return Response("Part type deleted successfully", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"delete_part_type failed: {e}", status=status.HTTP_400_BAD_REQUEST
        )
