from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.contrib.auth.decorators import login_required
from datetime import datetime

from .models import Eco
from .serializers import EcoSerializer
from profiles.views import check_user_auth_and_app_permission
from profiles.models import Profile
from documents.models import MarkdownText


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def create_eco(request):
    """Create a new ECO."""
    permission, response = check_user_auth_and_app_permission(request, "assemblies") # TODO make permission specific to ECOs
    if not permission:
        return response

    try:
        data = request.data
        eco = Eco()
        eco.created_by = request.user
        eco.release_state = "Draft"

        if "display_name" in data:
            eco.display_name = data["display_name"]

        if "responsible" in data and data["responsible"]:
            try:
                eco.responsible = Profile.objects.get(id=data["responsible"])
            except Profile.DoesNotExist:
                pass

        # Create markdown description
        description = MarkdownText.objects.create(
            created_by=request.user,
            text="",
        )
        eco.description = description

        eco.save()

        serializer = EcoSerializer(eco)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(f"Failed creating ECO: {str(e)}", status=status.HTTP_400_BAD_REQUEST)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def edit_eco(request, pk):
    """Edit an existing ECO. Cannot edit if released."""
    permission, response = check_user_auth_and_app_permission(request, "assemblies")  # TODO make permission specific to ECOs
    if not permission:
        return response

    try:
        eco = Eco.objects.get(pk=pk)
    except Eco.DoesNotExist:
        return Response("ECO not found", status=status.HTTP_404_NOT_FOUND)

    if eco.release_state == "Released":
        return Response("Cannot edit a released ECO!", status=status.HTTP_400_BAD_REQUEST)

    data = request.data

    if "display_name" in data:
        eco.display_name = data["display_name"]

    if "description" in data:
        if eco.description:
            eco.description.text = data["description"]
            eco.description.save()
        else:
            description = MarkdownText.objects.create(
                created_by=request.user,
                text=data["description"],
            )
            eco.description = description

    if "responsible" in data:
        if data["responsible"]:
            try:
                eco.responsible = Profile.objects.get(id=data["responsible"])
            except Profile.DoesNotExist:
                pass
        else:
            eco.responsible = None

    if "release_state" in data:
        eco.release_state = data["release_state"]
        if data["release_state"] == "Released":
            eco.released_date = datetime.now()
            eco.released_by = request.user

    if "is_approved_for_release" in data:
        if data["is_approved_for_release"] == False:
            eco.quality_assurance = None
        # Ensures QA is only set once, not every time the form is updated.
        if data["is_approved_for_release"] == True and eco.quality_assurance == None:
            profile = Profile.objects.get(user__pk=request.user.id)
            eco.quality_assurance = profile

    eco.save()

    serializer = EcoSerializer(eco)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("DELETE",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def delete_eco(request, pk):
    """Delete an ECO. Cannot delete if released."""
    permission, response = check_user_auth_and_app_permission(request, "assemblies") # TODO make permission specific to ECOs
    if not permission:
        return response

    try:
        eco = Eco.objects.get(pk=pk)
    except Eco.DoesNotExist:
        return Response("ECO not found", status=status.HTTP_404_NOT_FOUND)

    if eco.release_state == "Released":
        return Response("Cannot delete a released ECO!", status=status.HTTP_400_BAD_REQUEST)

    eco.delete()
    return Response("ECO deleted", status=status.HTTP_204_NO_CONTENT)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def get_eco(request, pk):
    """Get a single ECO by ID."""
    permission, response = check_user_auth_and_app_permission(request, "assemblies")  # TODO make permission specific to ECOs
    if not permission:
        return response

    try:
        eco = Eco.objects.get(pk=pk)
    except Eco.DoesNotExist:
        return Response("ECO not found", status=status.HTTP_404_NOT_FOUND)

    serializer = EcoSerializer(eco)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def get_all_ecos(request):
    """Get all ECOs."""
    permission, response = check_user_auth_and_app_permission(request, "assemblies")  # TODO make permission specific to ECOs
    if not permission:
        return response

    ecos = Eco.objects.all().order_by("-created_at")
    serializer = EcoSerializer(ecos, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)