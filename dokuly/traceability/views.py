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
    Get all traceability events for a specific item (table view: no revision column).
    """
    events = TraceabilityEvent.objects.filter(
        app_type=app_type, item_id=item_id
    ).select_related("user", "profile").order_by("-timestamp")

    serializer = TraceabilityEventTableSerializer(events, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


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
