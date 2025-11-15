from documents.models import Protection_Level

from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status

from django.db import models

from .serializers import ProtectionLevelSerializer

from profiles.views import check_permissions_standard, check_user_auth_and_app_permission


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
def fetch_protection_levels(request):
    """Fetch all protection levels."""
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "documents")
    if not permission:
        return response
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    
    protection_levels = Protection_Level.objects.all()
    serializer = ProtectionLevelSerializer(protection_levels, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
def new_protection_level(request):
    """Create a new protection level."""
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "documents")
    if not permission:
        return response
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    
    data = request.data
    if data == None:
        protection_levels = Protection_Level.objects.all()
        serializer = ProtectionLevelSerializer(protection_levels, many=True)
        return Response(serializer.data, status=status.HTTP_400_BAD_REQUEST)
    
    # Check if name already exists
    if Protection_Level.objects.filter(name=data["name"]).exists():
        return Response(
            "Protection level with this name already exists", 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    # Get the highest level and increment by 1, or default to 0 if no protection levels exist
    max_level = Protection_Level.objects.aggregate(models.Max('level'))['level__max']
    next_level = (max_level + 1) if max_level is not None else 0
    
    protection_level = Protection_Level.objects.create(
        name=data["name"],
        description=data.get("description", ""),
        level=data.get("level", next_level),  # Use provided level or auto-increment
    )
    
    protection_levels = Protection_Level.objects.all()
    serializer = ProtectionLevelSerializer(protection_levels, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
def edit_protection_level(request, protection_level_id):
    """Edit an existing protection level."""
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "documents")
    if not permission:
        return response
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    
    if request.data == None or protection_level_id == None:
        protection_levels = Protection_Level.objects.all()
        serializer = ProtectionLevelSerializer(protection_levels, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    data = request.data
    
    try:
        protection_level = Protection_Level.objects.get(id=protection_level_id)
    except Protection_Level.DoesNotExist:
        return Response("Protection level not found", status=status.HTTP_404_NOT_FOUND)
    
    if "name" in data:
        # Check if name already exists (excluding current object)
        if Protection_Level.objects.filter(name=data["name"]).exclude(id=protection_level_id).exists():
            return Response(
                "Protection level with this name already exists", 
                status=status.HTTP_400_BAD_REQUEST
            )
        protection_level.name = data["name"]
    
    if "description" in data:
        protection_level.description = data["description"]
    
    if "level" in data:
        protection_level.level = data["level"]
    
    protection_level.save()
    
    protection_levels = Protection_Level.objects.all()
    serializer = ProtectionLevelSerializer(protection_levels, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("DELETE",))
@renderer_classes((JSONRenderer,))
def delete_protection_level(request, protection_level_id):
    """Delete a protection level."""
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "documents")
    if not permission:
        return response
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    
    try:
        protection_level = Protection_Level.objects.get(id=protection_level_id)
    except Protection_Level.DoesNotExist:
        return Response("Protection level not found", status=status.HTTP_404_NOT_FOUND)
    
    # Check if any documents are using this protection level
    if protection_level.documents.exists():
        return Response(
            "Cannot delete protection level that is in use by documents", 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    protection_level.delete()
    
    protection_levels = Protection_Level.objects.all()
    serializer = ProtectionLevelSerializer(protection_levels, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
