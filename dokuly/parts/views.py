import logging
from datetime import datetime

from purchasing.priceUtilities import copy_price_to_new_revision
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from django.db.models import Q, F, Prefetch
from django.db.models.functions import Concat
from django.contrib.auth.decorators import login_required
from django.core.files.base import ContentFile
from django.shortcuts import get_object_or_404

from .serializers import (
    BomPartSerializer,
    GlobalSearchAssemblySerializer,
    GlobalSearchPartSerializer,
    GlobalSearchPcbaSerializer,
    PartSerializer,
    PartSerializerNoAlternate,
    PartTableSerializer,
    SimplePcbaSerializer,
    SimplePartSerializer,
    SimpleAsmSerializer,
)
from assemblies.models import Assembly
from pcbas.viewUtilities import increment_revision
from documents.models import MarkdownText, Reference_List
from projects.models import Project

from organizations.views import get_subscription_type
from files.models import Image
from parts.models import Part
from pcbas.models import Pcba
from part_numbers.methods import get_next_part_number

from purchasing.models import PurchaseOrder
from purchasing.suppliermodel import Supplier
from purchasing.priceModel import Price
from purchasing.serializers import PriceSerializer
from profiles.models import Profile
from profiles.views import check_user_auth_and_app_permission
from projects.models import Project
from organizations.permissions import APIAndProjectAccess
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from projects.viewsIssues import link_issues_on_new_object_revision
from profiles.utilityFunctions import (
    notify_on_new_revision, notify_on_release_approval,
    notify_on_state_change_to_release)

from projects.viewsTags import check_for_and_create_new_tags
from parts.viewUtilities import copy_markdown_tabs_to_new_revision


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def edit_release_state(request):
    """Intended as a an admin view to change the release state of an item."""
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "parts")
    if not permission:
        return response
    try:
        data = request.data
        if not "app" in request.data:
            return Response(
                "Invalid input, try again.", status=status.HTTP_400_BAD_REQUEST
            )
        if not "id" in request.data:
            return Response(
                "Invalid input, try again.", status=status.HTTP_400_BAD_REQUEST
            )

        id = data["id"]

        if data["app"] == "parts":
            part = Part.objects.get(id=id)
            part.release_state = data["release_state"]
            part.save()
            return Response(status=status.HTTP_200_OK)
        elif data["app"] == "assemblies":
            assembly = Assembly.objects.get(id=id)
            assembly.release_state = data["release_state"]
            assembly.save()
            return Response(status=status.HTTP_200_OK)
        elif data["app"] == "pcbas":
            pcba = Pcba.objects.get(id=id)
            pcba.release_state = data["release_state"]
            pcba.save()
            return Response(status=status.HTTP_200_OK)

        return Response(status=status.HTTP_400_BAD_REQUEST)

    except Exception as e:
        return Response(
            f"change_release_state failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(["GET"])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def get_single_part(request, pk, **kwargs):
    user = request.user
    try:
        alternative_parts_prefetch = Prefetch('alternative_parts_v2')
        markdown_notes_prefetch = Prefetch('markdown_notes')
        query = Part.objects.prefetch_related(
            alternative_parts_prefetch,
            markdown_notes_prefetch
        ).select_related('part_type').prefetch_related('tags')
        if APIAndProjectAccess.has_validated_key(request):
            part = get_object_or_404(Part, id=pk)
            if not part.internal:
                serializer = PartSerializer(part, context={'request': request})
                return Response(serializer.data, status=status.HTTP_200_OK)
            if not APIAndProjectAccess.check_project_access(request, part.project.pk):
                return Response("Not authorized", status=status.HTTP_401_UNAUTHORIZED)
            serializer = PartSerializer(part, context={'request': request})
            return Response(serializer.data, status=status.HTTP_200_OK)

        part = query.get(
            Q(project__project_members=user) | Q(project__isnull=True), id=pk
        )

        if part.is_archived:
            return Response("Part is archived", status=status.HTTP_204_NO_CONTENT)

        if not part.markdown_notes:
            markdown_notes = MarkdownText(
                created_by=user,
                text='',
            )
            markdown_notes.save()
            part.markdown_notes = markdown_notes
            part.save()

        serializer = PartSerializer(part, context={'request': request})
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Part.DoesNotExist:
        return Response("Part not found", status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            f"get_single_part failed: {e}", status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@ api_view(("GET",))
@ renderer_classes((JSONRenderer,))
@ login_required(login_url="/login")
def get_unarchived_parts(request):
    """Fetch all parts that are not archived."""
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "parts")
    if not permission:
        return response
    # Using exclude allows archived = Null to be fetched also.
    data = Part.objects.exclude(is_archived=True).only(
        "id",
        "part_number",
        "full_part_number",
        "display_name",
        "revision",
        "part_type",
        "release_state",
        "released_date",
        "description",
        "unit",
        "currency",
        "is_latest_revision",
        "mpn",
        "image_url",
        "manufacturer",
        "datasheet",
        "is_archived",
        "project",
        "part_information",
        "price_history",
        "stock",
        "price",
    )
    serializer = PartSerializerNoAlternate(data, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def get_latest_revisions(request, **kwargs):
    """Fetch the latest revision of all parts."""
    user = request.user
    part_query = Part.objects.all().exclude(is_archived=True).exclude(is_latest_revision=False).only(
        "id",
        "part_number",
        "full_part_number",
        "display_name",
        "revision",
        "part_type",
        "release_state",
        "released_date",
        "description",
        "unit",
        "currency",
        "is_latest_revision",
        "mpn",
        "image_url",
        "thumbnail",
        "manufacturer",
        "datasheet",
        "is_archived",
        "project",
        "price",
    )
    if APIAndProjectAccess.has_validated_key(request):
        if not APIAndProjectAccess.check_wildcard_access(request):
            part_query = part_query.filter(
                Q(project__in=APIAndProjectAccess.get_allowed_projects(
                    request)) | Q(project__isnull=True)
            )
        for part in part_query:
            print("After", part.full_part_number)
    else:
        part_query = part_query.filter(
            Q(project__project_members=user) | Q(project__isnull=True))

    serializer = PartSerializerNoAlternate(part_query, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@ api_view(("GET",))
@ renderer_classes((JSONRenderer,))
@ login_required(login_url="/login")
def get_on_order_for_part(request, part_id):
    """Fetch the amount of parts on order for a specific part."""
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "parts")
    if not permission:
        return response

    active_orders_for_part = PurchaseOrder.objects.filter(
        parts_array__in=[part_id], is_completed=False, status="Sent"
    )

    total_quantity_on_order = 0
    for order in active_orders_for_part:
        order_items = order.order_items
        for item in order_items:
            if item.get("part") == int(part_id):
                total_quantity_on_order += int(item.get("quantity"))

    return Response({"quantity": total_quantity_on_order}, status=status.HTTP_200_OK)


@ api_view(("GET",))
@ renderer_classes((JSONRenderer,))
@ login_required(login_url="/login")
def get_parts_table(request):
    user = request.user
    if request.user is None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    parts = (
        Part.objects.filter(Q(project__project_members=user)
                            | Q(project__isnull=True))
        .exclude(is_archived=True)
        .exclude(is_latest_revision=False)
        .only(
            "id",
            "part_number",
            "full_part_number",
            "mpn",
            "image_url",
            "thumbnail",
            "display_name",
            "part_type",
            "release_state",
            "released_date",
            "project",
            "last_updated",
            "revision",
            "is_latest_revision",
            "is_archived",
            "manufacturer",
            "current_total_stock",
            "external_part_number",
            "tags"
        )
        .prefetch_related("tags")
    )

    serializer = PartTableSerializer(parts, many=True, context={'request': request})
    return Response(serializer.data, status=status.HTTP_200_OK)


@ api_view(("GET",))
@ renderer_classes((JSONRenderer,))
@ login_required(login_url="/login")
def alt_parts_for_part(request, partIds):
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "parts")
    if not permission:
        return response
    strIds = partIds.split(",")
    ids = []
    if strIds != None:
        for i in strIds:
            partId = int(i)
            ids.append(partId)
    data = Part.objects.filter(
        Q(project__project_members=user) | Q(project__isnull=True), id__in=ids
    )
    serializer = PartSerializerNoAlternate(data, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def add_alternative_part(request, partID, alternativePartID):
    """
    API view function that handles adding an alternative part to a part's
    alternative_parts_v2 ManyToManyField. Only authenticated users can
    access this view via HTTP PUT requests.

    Args:
        request: Django HttpRequest object.
        partID (int): ID of the part to which the alternative part will be added.
        alternativePartID (int): ID of the alternative part to be added.

    Returns:
        On success: Response object with serialized Part data and a 200 status code.
        On failure (unauthorized): Response object with "Unauthorized" message and a 401 status code.
        On failure (bad request): Response object with a descriptive error message and a 400 status code.
    """
    # Check if the user is authenticated.
    permission, response = check_user_auth_and_app_permission(request, "parts")
    if not permission:
        return response

    try:
        part = Part.objects.get(id=partID)
        # Try to retrieve the alternative part and add it to the specified part.
        alternativePart = Part.objects.get(id=alternativePartID)
        part.alternative_parts_v2.add(alternativePart)
        part.save()

        # Return the serialized data of the modified part.
        serializer = PartSerializer(part)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Part.DoesNotExist:
        # Return a 404 response if the specified part does not exist.
        return Response(
            "The specified part does not exist.", status=status.HTTP_404_NOT_FOUND
        )

    except Part.MultipleObjectsReturned:
        # Return a 400 response if multiple parts with the same ID are found.
        return Response(
            "Multiple parts with the same ID were found.",
            status=status.HTTP_400_BAD_REQUEST,
        )

    except Exception as e:
        # Return a 400 response with a descriptive error message for all other exceptions.
        return Response(
            f"An error occurred while adding the alternative part: {str(e)}",
            status=status.HTTP_400_BAD_REQUEST,
        )


@ api_view(("DELETE",))
@ renderer_classes((JSONRenderer,))
def remove_alternative_part(request, partID, alternativePartID):
    """
    API view function that handles removing an alternative part from a part's
    alternative_parts_v2 ManyToManyField. Only authenticated users can
    access this view via HTTP PUT requests.

    Args:
        request: Django HttpRequest object.
        partID (int): ID of the part from which the alternative part will be removed.
        alternativePartID (int): ID of the alternative part to be removed.

    Returns:
        On success: Response object with serialized Part data and a 200 status code.
        On failure (unauthorized): Response object with "Unauthorized" message and a 401 status code.
        On failure (bad request): Response object with a descriptive error message and a 400 status code.
    """
    # Check if the user is authenticated.
    permission, response = check_user_auth_and_app_permission(request, "parts")
    if not permission:
        return response

    try:
        # Check whether the user has the necessary permissions to remove an alternative part from the specified part.
        part = Part.objects.get(id=partID)

        # Try to retrieve the alternative part and remove it from the specified part.
        alternativePart = Part.objects.get(id=alternativePartID)
        part.alternative_parts_v2.remove(alternativePart)
        part.save()

        # Return the serialized data of the modified part.
        serializer = PartSerializer(part)
        return Response(serializer.data, status=status.HTTP_200_OK)

    except Part.DoesNotExist:
        # Return a 404 response if the specified part does not exist.
        return Response(
            "The specified part does not exist.", status=status.HTTP_404_NOT_FOUND
        )

    except Part.MultipleObjectsReturned:
        # Return a 400 response if multiple parts with the same ID are found.
        return Response(
            "Multiple parts with the same ID were found.",
            status=status.HTTP_400_BAD_REQUEST,
        )

    except Exception as e:
        # Return a 400 response with a descriptive error message for all other exceptions.
        return Response(
            f"An error occurred while removing the alternative part: {str(e)}",
            status=status.HTTP_400_BAD_REQUEST,
        )


@ api_view(("GET",))
@ renderer_classes((JSONRenderer,))
@ login_required(login_url="/login")
def fetch_possible_bom_entries(request, asms, parts, pcbas):
    user = request.user
    if user is None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    res = {}
    if asms == 1:
        asmsQs = (
            Assembly.objects.filter(
                Q(project__project_members=user) | Q(project__isnull=True)
            )
            .exclude(is_archived=True)
            .only(
                "part_number",
                "full_part_number",
                "display_name",
                "revision",
                "is_latest_revision",
                "release_state",
                "price",
                "model_url",
                "thumbnail",
            )
            .order_by("-revision")
        )  # Optimized
        asmsRes = SimpleAsmSerializer(asmsQs, many=True).data  # New Serializer
        res["asms"] = asmsRes

    if parts == 1:
        partQs = (
            Part.objects.filter(
                Q(project__project_members=user) | Q(project__isnull=True)
            )
            .exclude(is_archived=True)
            .only(
                "id",
                "part_number",
                "full_part_number",
                "part_type",
                "display_name",
                "revision",
                "release_state",
                "is_latest_revision",
                "mpn",
                "image_url",
                "thumbnail",
                "unit",
            )
            .order_by("-revision")
        )  # Optimized
        partsRes = SimplePartSerializer(
            partQs, many=True).data  # New Serializer
        res["parts"] = partsRes

    if pcbas == 1:
        pcbaQs = (
            Pcba.objects.filter(
                Q(project__project_members=user) | Q(project__isnull=True)
            )
            .exclude(is_archived=True)
            .only(
                "id",
                "part_number",
                "full_part_number",
                "display_name",
                "revision",
                "release_state",
                "is_latest_revision",
                "thumbnail",
            )
            .order_by("-revision")
        )  # Optimized
        pcbasRes = SimplePcbaSerializer(
            pcbaQs, many=True).data  # New Serializer
        res["pcbas"] = pcbasRes

    return Response(res, status=status.HTTP_200_OK)


def fetch_all_prices(item_type, ids):
    if item_type == "assemblies":
        filters = {"assembly_id__in": ids}
        price_id_key = "assembly_id"
    elif item_type == "parts":
        filters = {"part_id__in": ids}
        price_id_key = "part_id"
    elif item_type == "pcbas":
        filters = {"pcba_id__in": ids}
        price_id_key = "pcba_id"

    prices = Price.objects.filter(**filters).select_related("supplier").order_by(price_id_key, "-created_at")
    price_dict = {}
    for price in prices:
        item_id = getattr(price, price_id_key)
        if item_id not in price_dict:
            price_dict[item_id] = []
        price_dict[item_id].append(price)
    return price_dict


@api_view(["GET"])
@renderer_classes([JSONRenderer])
@login_required(login_url="/login")
def get_bom_items(request, assembly_ids, part_ids, pcba_ids):
    user = request.user
    if user is None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    res = {}

    def parse_ids(ids):
        return list(map(int, ids.split(","))) if ids else []

    if assembly_ids != "-1":
        asms_ids = parse_ids(assembly_ids)
        asmsQs = (
            Assembly.objects.filter(
                (Q(project__project_members=user) | Q(project__isnull=True)),
                id__in=asms_ids,
                is_archived=False,
            )
            .only(
                "id", "part_number", "full_part_number", "display_name",
                "revision", "is_latest_revision", "release_state",
                "price", "model_url", "thumbnail"
            )
            .order_by("-revision")
        )
        asm_prices = fetch_all_prices("assemblies", asms_ids)
        res["asms"] = [
            {
                **SimpleAsmSerializer(asm).data,
                "prices": [PriceSerializer(price).data for price in asm_prices.get(asm.id, [])]
            }
            for asm in asmsQs
        ]

    if part_ids != "-1":
        parts_ids = parse_ids(part_ids)
        partQs = (
            Part.objects.filter(
                (Q(project__project_members=user) | Q(project__isnull=True)),
                Q(is_archived=False) | Q(is_archived=None),
                id__in=parts_ids,
            )
            .only(
                "id", "part_number", "full_part_number", "part_type",
                "display_name", "revision", "release_state",
                "is_latest_revision", "mpn", "image_url",
                "unit", "git_link", "manufacturer", "datasheet",
                "part_information", "thumbnail", "is_rohs_compliant"
            )
            .order_by("-revision")
        )
        part_prices = fetch_all_prices("parts", parts_ids)
        res["parts"] = [
            {
                **BomPartSerializer(part).data,
                "prices": [PriceSerializer(price).data for price in part_prices.get(part.id, [])]
            }
            for part in partQs
        ]

    if pcba_ids != "-1":
        pcbas_ids = parse_ids(pcba_ids)
        pcbaQs = (
            Pcba.objects.filter(
                (Q(project__project_members=user) | Q(project__isnull=True)),
                id__in=pcbas_ids,
                is_archived__in=[False, None],
            )
            .only(
                "id", "part_number", "full_part_number", "display_name",
                "revision", "release_state", "is_latest_revision",
                "thumbnail",
            )
            .order_by("-revision")
        )
        pcba_prices = fetch_all_prices("pcbas", pcbas_ids)
        res["pcbas"] = [
            {
                **SimplePcbaSerializer(pcba).data,
                "prices": [PriceSerializer(price).data for price in pcba_prices.get(pcba.id, [])]
            }
            for pcba in pcbaQs
        ]

    return Response(res, status=status.HTTP_200_OK)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def archive_part(request, pk, **kwargs):
    try:
        if request.user == None:
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
        if pk == None or type(pk) != int:
            return Response(
                "Non-valid part id, try again", status=status.HTTP_400_BAD_REQUEST
            )

        part = Part.objects.get(id=pk)
        if APIAndProjectAccess.has_validated_key(request):
            if part.internal and not APIAndProjectAccess.check_project_access(request, part.project.pk):
                return Response("Not authorized", status=status.HTTP_401_UNAUTHORIZED)
        else:
            if part.internal and not part.project.project_members.filter(id=request.user.id).exists():
                return Response("Not authorized", status=status.HTTP_401_UNAUTHORIZED)

        part.is_archived = True
        part.save()

        # Now there is no guarantee that the latest revision is marked correctly.
        batch_process_is_latest_revision_by_part_number(part.part_number)

        return Response(f"Part: {pk} archived", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"archive_part failed: {e}", status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@ api_view(("PUT",))
@ renderer_classes((JSONRenderer,))
@ login_required(login_url="/login")
def edit_revision_notes(request, partId):
    permission, response = check_user_auth_and_app_permission(request, "parts")
    if not permission:
        return response
    try:
        data = request.data
        if not "revision_notes" in data:
            return Response(
                "Invalid input, try again.", status=status.HTTP_400_BAD_REQUEST
            )
        part = Part.objects.get(id=partId)
        part.revision_notes = data["revision_notes"]
        part.save()
        serializer = PartSerializer(part, many=False)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"edit_revision_notes failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@ api_view(("PUT",))
@ renderer_classes((JSONRenderer,))
@ login_required(login_url="/login")
def edit_errata(request, partId):
    if request.user == None:
        return Response("Not Authorized", status=status.HTTP_401_UNAUTHORIZED)

    try:
        if not "errata" in request.data:
            return Response(
                "No data sent with the request", status=status.HTTP_400_BAD_REQUEST
            )

        part = Part.objects.get(pk=partId)
        part.errata = request.data["errata"]
        part.save()

        return Response("Errata Updated", status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            f"edit_errata failed: {e}", status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@ api_view(("PUT",))
@ renderer_classes((JSONRenderer,))
@ login_required(login_url="/login")
def update_backorderQty(request, partId):
    permission, response = check_user_auth_and_app_permission(request, "parts")
    if not permission:
        return response
    data = list(request.data.values())
    if data == None or data[0] == None:
        return Response("Invalid input, try again", status=status.HTTP_400_BAD_REQUEST)
    qty = data[0]
    Part.objects.filter(id=partId).update(backorder_quantity=qty)
    updatedPart = Part.objects.get(id=partId)
    serializer = PartSerializer(updatedPart)
    return Response(serializer.data, status=status.HTTP_200_OK)


@ api_view(("PUT",))
@ renderer_classes((JSONRenderer,))
@ login_required(login_url="/login")
def clear_sellers_data(request, partId):
    permission, response = check_user_auth_and_app_permission(request, "parts")
    if not permission:
        return response
    Part.objects.filter(id=partId).update(sellers=None)
    updatedPart = Part.objects.get(id=partId)
    if updatedPart.sellers != None:
        return Response(updatedPart.sellers, status=status.HTTP_409_CONFLICT)
    serializer = PartSerializer(updatedPart, many=False)
    return Response(
        {"res": "Data cleared for part %d" %
            (partId), "new_part": serializer.data},
        status=status.HTTP_200_OK,
    )


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def create_new_part(request, **kwargs):
    user = request.user
    if request.user == None:
        return Response("Not authorized", status=status.HTTP_401_UNAUTHORIZED)
    type = get_subscription_type(request.user, request)
    if type == "Free":
        if Part.objects.count() > 1000:
            return Response(
                "Cannot create more parts, upgrade account",
                status=status.HTTP_406_NOT_ACCEPTABLE,
            )
    data = request.data
    try:
        # Check if a part with the same mpn and manufacturer already exists
        if data.get("internal") == False or not data.get("internal"):
            existing_parts = Part.objects.filter(
                Q(mpn=data["mpn"]) & Q(manufacturer=data["manufacturer"])
            ).exclude(is_archived=True)
            if existing_parts.exists():
                serializer = PartSerializerNoAlternate(
                    existing_parts.first(), many=False
                )
                return Response(
                    serializer.data, status=status.HTTP_208_ALREADY_REPORTED
                )

        new_part = Part()
        if APIAndProjectAccess.has_validated_key(request):
            if "created_by" in data:
                new_part.created_by = User.objects.get(id=data["created_by"])
        else:
            new_part.created_by = user
        new_part.part_number = get_next_part_number()
        new_part.release_state = "Draft"
        new_part.is_latest_revision = True
        
        # Get organization_id from user profile for revision system
        organization_id = None
        if hasattr(user, 'profile') and user.profile.organization_id:
            organization_id = user.profile.organization_id
        
        # Set initial revision based on organization settings
        from organizations.revision_utils import get_organization_revision_settings
        if organization_id:
            use_number_revisions, revision_format, separator = get_organization_revision_settings(organization_id)
            if use_number_revisions:
                if revision_format == "major-minor":
                    new_part.revision = f"1{separator}0"
                else:
                    new_part.revision = "1"
            else:
                new_part.revision = "A"
        else:
            new_part.revision = "A"
        new_part.description = data["description"]
        new_part.datasheet = data["datasheet"]
        new_part.display_name = data["display_name"]
        new_part.image_url = data["image_url"]
        new_part.internal = data["internal"]
        new_part.external_part_number = data.get("external_part_number", "")

        if "git_link" in data:
            new_part.git_link = data["git_link"]
        if "manufacturer" in data:
            new_part.manufacturer = data["manufacturer"]
        if "mpn" in data:
            new_part.mpn = data["mpn"]

        prefix = "PRT"
        if "part_type" in data:
            new_part.part_type_id = data["part_type"]
            prefix = new_part.part_type.prefix
        
        # Format full_part_number based on organization revision settings
        if organization_id:
            use_number_revisions, revision_format, separator = get_organization_revision_settings(organization_id)
            if use_number_revisions:
                # For number revisions, use underscore separator
                new_part.full_part_number = f"{prefix}{new_part.part_number}_{new_part.revision}"
            else:
                # For letter revisions, use direct concatenation
                new_part.full_part_number = f"{prefix}{new_part.part_number}{new_part.revision}"
        else:
            # Default to letter revision format
            new_part.full_part_number = f"{prefix}{new_part.part_number}{new_part.revision}"

        if "unit" in data:
            new_part.unit = data["unit"]
        if "price" in data:
            new_part.price = data["price"]
        if "currency" in data:
            new_part.currency = data["currency"]
        if "distributor" in data:
            new_part.distributor = data["distributor"]

        if "model_url" in data:
            new_part.model_url = data["model_url"]
        if "project" in data:
            if data["project"] != -1 and data["project"] != None:
                if APIAndProjectAccess.has_validated_key(request):
                    if not APIAndProjectAccess.check_project_access(request, data["project"]):
                        return Response("Not authorized", status=status.HTTP_401_UNAUTHORIZED)
                try:
                    project = Project.objects.get(id=data["project"])
                    new_part.project = project
                except Project.DoesNotExist:
                    pass
        if "supplier" in data:
            if data["supplier"] != -1 and data["supplier"] != None:
                supplier = Supplier.objects.get(pk=data["supplier"])
                new_part.supplier = supplier
        if "part_information" in data:
            if data["part_information"] != None:
                new_part.part_information = data["part_information"]

        if "urls" in data:
            if data["urls"] != None:
                new_part.urls = data["urls"]

        if "component_vault_id" in data:
            if data["urls"] != None:
                new_part.component_vault_id = int(data["component_vault_id"])

        new_part.save()
        serializer = PartSerializer(new_part, many=False)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            f"create_new_part failed: {e}", status=status.HTTP_400_BAD_REQUEST
        )


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def edit_part(request, pk, **kwargs):
    if request.user == None:
        return Response("Not authorized", status=status.HTTP_401_UNAUTHORIZED)

    user = request.user
    data = request.data
    price_update = False
    if "price_update" in data:
        if data["price_update"]:
            price_update = True
    try:
        part = Part.objects.get(pk=pk)

        # Markdown notes can be changed on released parts
        if "markdown_notes" in data:
            markdown_notes_data = data["markdown_notes"]
            if part.markdown_notes:
                part.markdown_notes.text = markdown_notes_data
                part.markdown_notes.save()

        if part.release_state == "Released" and not price_update and not "markdown_notes" in data and not "tags" in data:
            return Response(
                "Can't edit a released part!", status=status.HTTP_400_BAD_REQUEST
            )

        if "release_state" in data and data["release_state"] != part.release_state:
            part.release_state = data["release_state"]

            notify_on_state_change_to_release(
                user=user,
                item=part,
                new_state=data["release_state"],
                app_name="parts",
            )

            if data["release_state"] == "Released":
                part.released_date = datetime.now()

        user = request.user
        if "is_approved_for_release" in data:
            if data["is_approved_for_release"] == False:
                part.quality_assurance = None
            # Ensures QA is only set once, not every time the form is updated.
            if (
                data["is_approved_for_release"] == True
                and part.quality_assurance == None
            ):
                if APIAndProjectAccess.has_validated_key(request):
                    if "created_by" in data:
                        profile = Profile.objects.get(
                            user__id=data["created_by"])
                        part.quality_assurance = profile
                else:
                    profile = Profile.objects.get(user__pk=user.id)
                    part.quality_assurance = profile

                notify_on_release_approval(item=part, user=user, app_name="parts")

        if "description" in data:
            part.description = data["description"]

        if "datasheet" in data:
            part.datasheet = data["datasheet"]

        if "display_name" in data:
            part.display_name = data["display_name"]

        if "git_link" in data:
            part.git_link = data["git_link"]

        if "image_url" in data:
            part.image_url = data["image_url"]

        if "internal" in data:
            part.internal = data["internal"]

        if "manufacturer" in data:
            part.manufacturer = data["manufacturer"]

        if "mpn" in data:
            part.mpn = data["mpn"]

        if "part_type" in data:
            part.part_type_id = data["part_type"]

        if "unit" in data:
            part.unit = data["unit"]

        if "price" in data:
            part.price = data["price"]

        if "currency" in data:
            part.currency = data["currency"]

        if "is_rohs_compliant" in data:
            part.is_rohs_compliant = data["is_rohs_compliant"]

        if "is_reach_compliant" in data:
            part.is_reach_compliant = data["is_reach_compliant"]

        if "is_ul_compliant" in data:
            part.is_ul_compliant = data["is_ul_compliant"]

        if "export_control_classification_number" in data:
            part.export_control_classification_number = data["export_control_classification_number"]

        if "country_of_origin" in data:
            part.country_of_origin = data["country_of_origin"]

        if "harmonized_system_code" in data:
            part.hs_code = data["harmonized_system_code"]

        if "project" in data:
            if data["project"] != -1 and data["project"] != None:
                if APIAndProjectAccess.has_validated_key(request):
                    if not APIAndProjectAccess.check_project_access(request, data["project"]):
                        return Response("Not authorized", status=status.HTTP_401_UNAUTHORIZED)
                try:
                    part.project = Project.objects.get(
                        id=int(data["project"]))
                except Exception as e:
                    print(str(e))

        if "supplier" in data:
            if data["supplier"] != -1 and data["supplier"] != None:
                supplier = Supplier.objects.get(pk=data["supplier"])
                part.supplier = supplier

        if "component_vault_id" in data:
            if data["urls"] != None:
                part.component_vault_id = int(data["component_vault_id"])

        if "tags" in data:
            error, message, tag_ids = check_for_and_create_new_tags(part.project, data["tags"])
            if error:
                return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)
            part.tags.set(tag_ids)

        if "external_part_number" in data:
            part.external_part_number = data.get("external_part_number", "")

        part.save()
        serializer = PartSerializer(part, many=False)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(f"edit_part failed: {e}", status=status.HTTP_400_BAD_REQUEST)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def remove_part_notes(request, pk, **kwargs):
    if request.user == None:
        return Response("Not authorized", status=status.HTTP_401_UNAUTHORIZED)

    user = request.user
    data = request.data

    try:
        part = Part.objects.get(pk=pk)
        part.markdown_notes = None
        part.save()

        serializer = PartSerializer(part, many=False)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(f"edit_part failed: {e}", status=status.HTTP_400_BAD_REQUEST)


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def new_revision(request, pk, **kwargs):

    old_part_rev = Part.objects.get(id=pk)

    if old_part_rev.project is not None:
        if APIAndProjectAccess.has_validated_key(request):
            if not APIAndProjectAccess.check_project_access(request, old_part_rev.project.pk):
                return Response("Not authorized", status=status.HTTP_401_UNAUTHORIZED)
        else:
            project = Project.objects.filter(
                pk=old_part_rev.project.pk, project_members=request.user)
            if not project.exists():
                return Response("Not authorized", status=status.HTTP_401_UNAUTHORIZED)

    if old_part_rev.is_latest_revision == False:
        return Response("Not latest Revision", status=status.HTTP_401_UNAUTHORIZED)

    try:
        reference_list = Reference_List.objects.get(
            id=old_part_rev.reference_list_id)
    except Reference_List.DoesNotExist:
        reference_list = None

    old_part_rev.is_latest_revision = False
    old_part_rev.save()

    new_part_rev = Part()
    new_part_rev.is_latest_revision = True

    new_part_rev.part_number = old_part_rev.part_number
    new_part_rev.part_type = old_part_rev.part_type

    prefix = old_part_rev.part_type.prefix
    # Get organization_id from user profile for revision system
    organization_id = None
    if hasattr(request.user, 'profile') and request.user.profile.organization_id:
        organization_id = request.user.profile.organization_id
    
    # Get revision type from request data (default to "major" for backward compatibility)
    revision_type = request.data.get('revision_type', 'major')
    
    new_part_rev.revision = increment_revision(old_part_rev.revision, organization_id, revision_type)
    
    # Format full_part_number based on organization revision settings
    from organizations.revision_utils import get_organization_revision_settings
    if organization_id:
        use_number_revisions, revision_format, separator = get_organization_revision_settings(organization_id)
        if use_number_revisions:
            # For number revisions, use underscore separator
            new_part_rev.full_part_number = f"{prefix}{new_part_rev.part_number}_{new_part_rev.revision}"
        else:
            # For letter revisions, use direct concatenation
            new_part_rev.full_part_number = f"{prefix}{new_part_rev.part_number}{new_part_rev.revision}"
    else:
        # Default to letter revision format
        new_part_rev.full_part_number = f"{prefix}{new_part_rev.part_number}{new_part_rev.revision}"

    new_part_rev.created_by = old_part_rev.created_by
    new_part_rev.display_name = old_part_rev.display_name
    new_part_rev.description = old_part_rev.description
    new_part_rev.release_state = "Draft"
    new_part_rev.external_part_number = old_part_rev.external_part_number

    new_part_rev.price_qty = old_part_rev.price_qty
    new_part_rev.price = old_part_rev.price
    new_part_rev.currency = old_part_rev.currency
    new_part_rev.supplier = old_part_rev.supplier

    new_part_rev.unit = old_part_rev.unit  # DEPRECATED
    if old_part_rev.project != None:
        new_part_rev.project = old_part_rev.project

    new_part_rev.internal = old_part_rev.internal
    new_part_rev.mpn = old_part_rev.mpn
    new_part_rev.manufacturer = old_part_rev.manufacturer
    new_part_rev.datasheet = old_part_rev.datasheet
    new_part_rev.production_status = old_part_rev.production_status
    new_part_rev.rohs_status_code = old_part_rev.rohs_status_code
    new_part_rev.distributor = old_part_rev.distributor
    new_part_rev.sellers = old_part_rev.sellers
    new_part_rev.specs = old_part_rev.specs
    new_part_rev.customSpecs = old_part_rev.customSpecs
    new_part_rev.alternative_parts = old_part_rev.alternative_parts
    new_part_rev.git_link = old_part_rev.git_link
    new_part_rev.is_reach_compliant = old_part_rev.is_reach_compliant
    new_part_rev.is_rohs_compliant = old_part_rev.is_rohs_compliant
    new_part_rev.is_ul_compliant = old_part_rev.is_ul_compliant

    new_part_rev.part_information = old_part_rev.part_information
    new_part_rev.component_vault_id = old_part_rev.component_vault_id

    if reference_list != None:  # Handle Reference document copy
        reference_list.pk = None  # Creates new object
        reference_list.save()
        # Attach new copied list to new item revision.
        new_part_rev.reference_list_id = reference_list.id

    new_part_rev.image_url = old_part_rev.image_url

    original_thumbnail = old_part_rev.thumbnail
    if original_thumbnail is not None:
        new_thumbnail = Image()
        new_thumbnail.file.save(
            original_thumbnail.image_name, ContentFile(
                original_thumbnail.file.read())
        )
        new_thumbnail.image_name = original_thumbnail.image_name
        new_thumbnail.save()
        new_part_rev.thumbnail = new_thumbnail

    # Copy markdown_notes to new revision
    if old_part_rev.markdown_notes:
        new_markdown_notes = MarkdownText.objects.create(
            text=old_part_rev.markdown_notes.text,
            created_by=old_part_rev.markdown_notes.created_by,
        )
        new_part_rev.markdown_notes = new_markdown_notes

    new_part_rev.save()

    copy_markdown_tabs_to_new_revision(old_part_rev, new_part_rev)

    # Copy over tags
    new_part_rev.tags.set(old_part_rev.tags.all())

    copy_price_to_new_revision(old_part_rev, new_part_rev)

    link_issues_on_new_object_revision('parts', old_part_rev, new_part_rev)

    notify_on_new_revision(new_revision=new_part_rev, app_name="parts", user=request.user)

    serializer = PartSerializer(new_part_rev)
    return Response(serializer.data, status=status.HTTP_200_OK)


@ api_view(("GET",))
@ renderer_classes((JSONRenderer,))
def get_revision_list(request, id):
    if request.user == None:
        return Response("Not Authorized", status=status.HTTP_401_UNAUTHORIZED)
    try:
        part = Part.objects.get(pk=id)
        pn = part.part_number
        parts = Part.objects.filter(part_number=pn).exclude(is_archived=True)
        serializer = PartSerializerNoAlternate(parts, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Part.DoesNotExist:
        return Response("Object not found", status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(
            f"get_revision_list failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def edit_part_information(request, pk, **kwargs):
    if request.user is None:
        return Response("Not authorized", status=status.HTTP_401_UNAUTHORIZED)

    try:
        part = Part.objects.get(pk=pk)

        if part.release_state == "Released":
            return Response(
                "Can't edit a released part!", status=status.HTTP_400_BAD_REQUEST
            )

        action = request.data.get("action")

        if action == "edit_key":
            old_key = request.data.get("old_key")
            new_key = request.data.get("new_key")
            if not old_key or not new_key:
                return Response(
                    "Both old_key and new_key are required for edit_key action",
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if old_key in part.part_information:
                part.part_information[new_key] = part.part_information.pop(
                    old_key)
            else:
                return Response(
                    f"{old_key} not found in part information",
                    status=status.HTTP_400_BAD_REQUEST,
                )
        elif action == "paste":
            entries = request.data.get("entries")
            if not entries or not isinstance(entries, dict):
                return Response(
                    "Entries must be a non-empty dictionary for paste action",
                    status=status.HTTP_400_BAD_REQUEST,
                )
            if part.part_information is None:
                part.part_information = {}
            part.part_information.update(entries)
        else:
            key_to_modify = request.data.get("key")
            value = request.data.get("value")

            if not key_to_modify or not action:
                return Response(
                    "Key and action are required", status=status.HTTP_400_BAD_REQUEST
                )

            if part.part_information is None:
                part.part_information = {}

            if action == "add" or action == "edit":
                if not value:
                    return Response(
                        "Value is required for add/edit actions",
                        status=status.HTTP_400_BAD_REQUEST,
                    )
                part.part_information[key_to_modify] = value
            elif action == "delete":
                if key_to_modify in part.part_information:
                    del part.part_information[key_to_modify]
                else:
                    return Response(
                        f"{key_to_modify} not found in part information",
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                return Response("Invalid action", status=status.HTTP_400_BAD_REQUEST)

        part.save()
        return Response(status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(
            f"edit_part_information failed: {e}", status=status.HTTP_400_BAD_REQUEST
        )


@ api_view(("GET",))
@ renderer_classes((JSONRenderer,))
def get_revisions(request, part_number):
    """Return all revisions of a particular part number."""
    permission, response = check_user_auth_and_app_permission(request, "parts")
    if not permission:
        return response

    items = Part.objects.filter(
        Q(part_number=part_number) & ~Q(is_archived=True))
    serializer = PartSerializerNoAlternate(items, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


def is_latest_revision(part_number, revision):
    """Check if the current item is the latest revision."""
    items = Part.objects.filter(
        part_number=part_number).exclude(is_archived=True)

    if len(items) == 1:
        return True

    def first_is_greater(first, second):
        """Returns True if rev_one is greatest."""
        if len(second) > len(first):
            return False

        for index, letter in enumerate(second):
            if letter >= first[index]:
                return False
        return True

    for item in items:
        if first_is_greater(item.revision, revision):
            return False
    return True


@api_view(["PUT"])
@renderer_classes([JSONRenderer])
def global_part_search(request):
    user = request.user
    try:
        if request.user is None:
            return Response("Not Authorized", status=status.HTTP_401_UNAUTHORIZED)

        data = request.data
        query = data.get("query", "")

        # Common filter for project membership or no project
        project_filter = Q(project__project_members=user) | Q(project__isnull=True)

        # Concatenate full_part_number and revision for searching
        full_part_number_with_revision = Concat(F('full_part_number'), F('revision'))

        # Query Parts, PCBAs, and Assemblies
        part_results = Part.objects.annotate(
            full_part_number_with_revision=full_part_number_with_revision
        ).filter(
            project_filter
            & Q(is_archived=False)
            & (
                Q(full_part_number__icontains=query)
                | Q(display_name__icontains=query)
                | Q(description__icontains=query)
                | Q(manufacturer__icontains=query)
                | Q(mpn__icontains=query)
                | Q(full_part_number_with_revision__icontains=query)
            )
        )

        pcba_results = Pcba.objects.annotate(
            full_part_number_with_revision=full_part_number_with_revision
        ).filter(
            project_filter
            & Q(is_archived=False)
            & (
                Q(full_part_number__icontains=query)
                | Q(display_name__icontains=query)
                | Q(description__icontains=query)
                | Q(full_part_number_with_revision__icontains=query)
            )
        )

        assembly_results = Assembly.objects.annotate(
            full_part_number_with_revision=full_part_number_with_revision
        ).filter(
            project_filter
            & Q(is_archived=False)
            & (
                Q(full_part_number__icontains=query)
                | Q(display_name__icontains=query)
                | Q(description__icontains=query)
                | Q(full_part_number_with_revision__icontains=query)
            )
        )

        # Serialize the results with the custom serializer
        part_serializer = GlobalSearchPartSerializer(part_results, many=True)
        pcba_serializer = GlobalSearchPcbaSerializer(pcba_results, many=True)
        assembly_serializer = GlobalSearchAssemblySerializer(assembly_results, many=True)

        # Combine the serialized results into a single array
        combined_results = part_serializer.data + pcba_serializer.data + assembly_serializer.data

        # Limit the results to at most 50 items
        limited_results = combined_results[:50]

        # Return the limited results
        return Response(limited_results, status=status.HTTP_200_OK)

    except Exception as e:
        return Response(f"Search failed: {e}", status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def batch_process_is_latest_revision_by_part_number(part_number):
    """This view runs through Parts and corrects the is_latest_revision field"""
    items = Part.objects.filter(
        part_number=part_number).exclude(is_archived=True)
    for item in items:
        item.is_latest_revision = is_latest_revision(
            item.part_number, item.revision)
        item.save()


@ api_view(("GET",))
@ renderer_classes((JSONRenderer,))
def batch_process_is_latest_revision_of_all_parts(request):
    """This view runs through all Parts and corrects the is_latest_revision field"""
    permission, response = check_user_auth_and_app_permission(request, "parts")
    if not permission:
        return response

    items = Part.objects.exclude(is_archived=True)
    for item in items:
        item.is_latest_revision = is_latest_revision(
            item.part_number, item.revision)
        item.save()

    return Response(status=status.HTTP_200_OK)


@ api_view(("GET",))
@ renderer_classes((JSONRenderer,))
def batch_process_full_part_number_on_all_parts(request):
    """This view runs through all Parts and corrects the full_part_number field"""
    permission, response = check_user_auth_and_app_permission(request, "parts")
    if not permission:
        return response

    items = Part.objects.exclude(is_archived=True)
    for item in items:
        item.full_part_number = f"PRT{item.part_number}"
        item.save()

    return Response(status=status.HTTP_200_OK)


@ api_view(("PUT",))
@ renderer_classes((JSONRenderer,))
@ login_required(login_url="/login")
def update_thumbnail(request, partId, imageId):
    permission, response = check_user_auth_and_app_permission(request, "parts")
    if not permission:
        return response

    print("Updating thumbnail for part", partId, "with image", imageId)

    try:
        part = Part.objects.get(pk=partId)
        part.thumbnail = Image.objects.get(pk=imageId)
        part.save()
        serializer = PartSerializer(part, many=False)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Part.DoesNotExist:
        return Response("Object not found", status=status.HTTP_404_NOT_FOUND)
