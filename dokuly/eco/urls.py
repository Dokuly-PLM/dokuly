from django.urls import path
from . import views

urlpatterns = [
    # ECO endpoints
    path("api/eco/create/", views.create_eco, name="create_eco"),
    path("api/eco/get/<int:pk>/", views.get_eco, name="get_eco"),
    path("api/eco/get/", views.get_all_ecos, name="get_all_ecos"),
    path("api/eco/edit/<int:pk>/", views.edit_eco, name="edit_eco"),
    path("api/eco/delete/<int:pk>/", views.delete_eco, name="delete_eco"),

    # Affected Items endpoints
    path("api/eco/<int:eco_id>/affectedItems/", views.get_affected_items, name="get_affected_items"),
    path("api/eco/<int:eco_id>/affectedItems/add/", views.add_affected_item, name="add_affected_item"),
    path("api/eco/affectedItems/<int:pk>/edit/", views.edit_affected_item, name="edit_affected_item"),
    path("api/eco/affectedItems/<int:pk>/delete/", views.delete_affected_item, name="delete_affected_item"),
]
