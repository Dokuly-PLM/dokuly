from rest_framework import status
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from django.db.models import Q
from .issuesModel import Issues
from parts.models import Part
from pcbas.models import Pcba
from assemblies.models import Assembly
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
    parts_serializer = PartTableSerializer(parts, many=True, context={'request': request})

    # Get unreleased assemblies created by the user
    assemblies = (
        Assembly.objects.filter(
            project_filter & unreleased_filter,
            created_by=user,
            is_latest_revision=True,
            is_archived=False
        )
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
            "tags"
        )
        .prefetch_related("tags")
    )
    assemblies_serializer = AssemblyTableSerializer(assemblies, many=True, context={'request': request})

    # Get unreleased PCBAs created by the user
    pcbas = (
        Pcba.objects.filter(
            project_filter & unreleased_filter,
            created_by=user,
            is_latest_revision=True,
            is_archived=False
        )
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
            "tags"
        )
        .prefetch_related("tags")
    )
    pcbas_serializer = PcbaTableSerializer(pcbas, many=True, context={'request': request})

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
        "stats": stats
    }, status=status.HTTP_200_OK)

