from rest_framework import status
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .issuesModel import Issues
from parts.models import Part, StarredPart
from pcbas.models import Pcba, StarredPcba
from assemblies.models import Assembly, StarredAssembly
from parts.serializers import PartTableSerializer
from pcbas.serializers import PcbaTableSerializer
from assemblies.serializers import AssemblyTableSerializer
from .serializers import IssuesSerializer
from eco.models import Eco
from eco.serializers import EcoSerializer


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def get_for_you_data(request):
    """
    Get personalized "For You" data for the current user:
    - Unreleased parts, assemblies, and PCBAs created by the user
    - Open issues created by the user
    - Stats/counts for each category
    """
    user = request.user
    if user is None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    # Common filter for project membership or no project
    project_filter = Q(project__project_members=user) | Q(project__isnull=True)

    # Filter for unreleased items (not "Released" - includes Draft, Review, null, empty string)
    unreleased_filter = ~Q(release_state="Released")

    # Get unreleased parts created by the user
    parts = (
        Part.objects.filter(
            project_filter & unreleased_filter,
            created_by=user,
            is_latest_revision=True,
            is_archived=False
        )
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
    # Get starred IDs for context
    starred_part_ids = set(
        StarredPart.objects.filter(user=user).values_list('part_id', flat=True)
    )
    parts_serializer = PartTableSerializer(parts, many=True, context={
        'request': request,
        'starred_part_ids': starred_part_ids
    })

    # Get unreleased assemblies created by the user
    assemblies = (
        Assembly.objects.filter(
            project_filter & unreleased_filter,
            created_by=user,
            is_latest_revision=True,
            is_archived=False
        )
        .select_related("part_type")
        .only(
            "id",
            "part_number",
            "full_part_number",
            "display_name",
            "revision",
            "is_latest_revision",
            "release_state",
            "released_date",
            "project",
            "last_updated",
            "thumbnail",
            "tags",
            "part_type_id",
            "part_type__icon_url",
        )
        .prefetch_related("tags")
    )
    starred_assembly_ids = set(
        StarredAssembly.objects.filter(user=user).values_list('assembly_id', flat=True)
    )
    assemblies_serializer = AssemblyTableSerializer(assemblies, many=True, context={
        'request': request,
        'starred_assembly_ids': starred_assembly_ids
    })

    # Get unreleased PCBAs created by the user
    pcbas = (
        Pcba.objects.filter(
            project_filter & unreleased_filter,
            created_by=user,
            is_latest_revision=True,
            is_archived=False
        )
        .select_related("part_type")
        .only(
            "id",
            "part_number",
            "full_part_number",
            "display_name",
            "revision",
            "is_latest_revision",
            "release_state",
            "released_date",
            "project",
            "last_updated",
            "thumbnail",
            "tags",
            "part_type_id",
            "part_type__icon_url",
        )
        .prefetch_related("tags")
    )
    starred_pcba_ids = set(
        StarredPcba.objects.filter(user=user).values_list('pcba_id', flat=True)
    )
    pcbas_serializer = PcbaTableSerializer(pcbas, many=True, context={
        'request': request,
        'starred_pcba_ids': starred_pcba_ids
    })

    # Get starred items for the user
    starred_parts = (
        Part.objects.filter(
            project_filter,
            id__in=starred_part_ids,
            is_latest_revision=True,
            is_archived=False
        )
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
    starred_parts_serializer = PartTableSerializer(starred_parts, many=True, context={
        'request': request,
        'starred_part_ids': starred_part_ids
    })

    starred_assemblies = (
        Assembly.objects.filter(
            project_filter,
            id__in=starred_assembly_ids,
            is_latest_revision=True,
            is_archived=False
        )
        .select_related("part_type")
        .only(
            "id",
            "part_number",
            "full_part_number",
            "display_name",
            "revision",
            "is_latest_revision",
            "release_state",
            "released_date",
            "project",
            "last_updated",
            "thumbnail",
            "tags",
            "part_type_id",
            "part_type__icon_url",
        )
        .prefetch_related("tags")
    )
    starred_assemblies_serializer = AssemblyTableSerializer(starred_assemblies, many=True, context={
        'request': request,
        'starred_assembly_ids': starred_assembly_ids
    })

    starred_pcbas = (
        Pcba.objects.filter(
            project_filter,
            id__in=starred_pcba_ids,
            is_latest_revision=True,
            is_archived=False
        )
        .select_related("part_type")
        .only(
            "id",
            "part_number",
            "full_part_number",
            "display_name",
            "revision",
            "is_latest_revision",
            "release_state",
            "released_date",
            "project",
            "last_updated",
            "thumbnail",
            "tags",
            "part_type_id",
            "part_type__icon_url",
        )
        .prefetch_related("tags")
    )
    starred_pcbas_serializer = PcbaTableSerializer(starred_pcbas, many=True, context={
        'request': request,
        'starred_pcba_ids': starred_pcba_ids
    })

    # Get open issues created by the user
    open_issues = (
        Issues.objects.filter(
            created_by=user,
            closed_at__isnull=True
        )
        .prefetch_related(
            'tags',
            'description',
            'created_by',
            'closed_by',
            'parts',
            'pcbas',
            'assemblies',
            'documents'
        )
    )
    issues_serializer = IssuesSerializer(open_issues, many=True)

    # Get unreleased ECOs created by the user
    ecos = (
        Eco.objects.filter(
            project_filter & unreleased_filter,
            created_by=user
        )
        .prefetch_related('tags', 'project', 'responsible', 'quality_assurance')
    )
    ecos_serializer = EcoSerializer(ecos, many=True)

    # Calculate stats
    stats = {
        "unreleased_parts_count": parts.count(),
        "unreleased_assemblies_count": assemblies.count(),
        "unreleased_pcbas_count": pcbas.count(),
        "open_issues_count": open_issues.count(),
        "unreleased_ecos_count": ecos.count(),
    }

    return Response({
        "parts": parts_serializer.data,
        "assemblies": assemblies_serializer.data,
        "pcbas": pcbas_serializer.data,
        "issues": issues_serializer.data,
        "ecos": ecos_serializer.data,
        "starred_parts": starred_parts_serializer.data,
        "starred_assemblies": starred_assemblies_serializer.data,
        "starred_pcbas": starred_pcbas_serializer.data,
        "stats": stats
    }, status=status.HTTP_200_OK)
