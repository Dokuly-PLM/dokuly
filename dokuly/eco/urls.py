from django.urls import path
from . import views

urlpatterns = [
    # ECO endpoints
    path("api/eco/create/", views.create_eco, name="create_eco"),
    path("api/eco/get/<int:pk>/", views.get_eco, name="get_eco"),
    path("api/eco/get/", views.get_all_ecos, name="get_all_ecos"),
    path("api/eco/edit/<int:pk>/", views.edit_eco, name="edit_eco"),
    path("api/eco/delete/<int:pk>/", views.delete_eco, name="delete_eco"),
    
    # Missing BOM items endpoint
    path("api/eco/<int:eco_id>/missingBomItems/", views.get_eco_missing_bom_items_api, name="get_eco_missing_bom_items"),

    # Get ECOs for a specific item
    path("api/eco/forItem/<str:app>/<int:item_id>/", views.get_ecos_for_item, name="get_ecos_for_item"),

    # Affected Items endpoints
    path("api/eco/<int:eco_id>/affectedItems/", views.get_affected_items, name="get_affected_items"),
    path("api/eco/<int:eco_id>/affectedItems/add/", views.add_affected_item, name="add_affected_item"),
    path("api/eco/affectedItems/<int:pk>/edit/", views.edit_affected_item, name="edit_affected_item"),
    path("api/eco/affectedItems/<int:pk>/delete/", views.delete_affected_item, name="delete_affected_item"),

    # Affected Item Issues
    path("api/eco/affectedItems/<int:pk>/addIssue/", views.add_issue_to_affected_item, name="add_issue_to_affected_item"),
    path("api/eco/affectedItems/<int:pk>/removeIssue/", views.remove_issue_from_affected_item, name="remove_issue_from_affected_item"),

    # Issue search for adding to affected items
    path("api/eco/issues/search/", views.search_issues, name="search_issues"),

    # Get ECOs for a specific issue
    path("api/eco/forIssue/<int:issue_id>/", views.get_ecos_for_issue, name="get_ecos_for_issue"),

    # Downstream impact analysis
    path("api/eco/<int:eco_id>/downstreamImpact/", views.get_downstream_impact, name="get_downstream_impact"),
]
