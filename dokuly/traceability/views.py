from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404

from .models import TraceabilityEvent
from .serializers import TraceabilityEventSerializer, TraceabilityEventTableSerializer


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([])
@login_required(login_url="/login")
def get_traceability_events(request, app_type, item_id):
    """
    Get traceability events for a specific item with backend pagination.
    Query params: page (default 1), page_size (default 50).
    Returns: { "results": [...], "count": total_count }.
    """
    page = max(1, int(request.query_params.get("page", 1)))
    page_size = min(100, max(1, int(request.query_params.get("page_size", 50))))

    qs = TraceabilityEvent.objects.filter(
        app_type=app_type, item_id=item_id
    ).select_related("user", "profile").order_by("-timestamp")

    total_count = qs.count()
    start = (page - 1) * page_size
    end = start + page_size
    events = qs[start:end]

    serializer = TraceabilityEventTableSerializer(events, many=True)
    return Response(
        {"results": serializer.data, "count": total_count},
        status=status.HTTP_200_OK,
    )


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([])
@login_required(login_url="/login")
def get_traceability_event(request, event_id):
    """
    Get a specific traceability event by ID.
    """
    event = get_object_or_404(TraceabilityEvent, id=event_id)
    serializer = TraceabilityEventSerializer(event)
    return Response(serializer.data, status=status.HTTP_200_OK)
