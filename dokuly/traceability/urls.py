from django.urls import path
from . import views

urlpatterns = [
    path(
        "api/traceability/<str:app_type>/<int:item_id>/",
        views.get_traceability_events,
        name="get_traceability_events",
    ),
    path(
        "api/traceability/event/<int:event_id>/",
        views.get_traceability_event,
        name="get_traceability_event",
    ),
]
