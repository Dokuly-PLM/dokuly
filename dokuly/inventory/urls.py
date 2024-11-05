from rest_framework import routers
from .api import InventoryViewSet, LocationViewSet
from django.urls import path
from . import locationTypesViews, views, viewsLocationEntires

router = routers.DefaultRouter()
router.register('api/inventory', InventoryViewSet, 'inventory')
router.register('api/locations', LocationViewSet, 'locations')

urlpatterns = [
    # Inventory
    path('api/inventory/fetchStock/<int:partId>/', views.fetch_part_stock),
    path('api/inventory/addInv/', views.add_inv_entry),
    # Locations
    # old
    path('api/locations/fetch/', views.fetch_locations),
    path('api/locations/fetchArchived/', views.fetch_archived_locations),
    path('api/locations/handleMutation/<int:fetchRest>/', views.handle_post_and_put_2),
    # new
    path('api/locations/create/', views.create_location, name='create_location'),
    path('api/locations/<int:location_id>/update/', views.update_location, name='update_location'),
    path('api/locations/<int:location_id>/archive/', views.archive_location, name='archive_location'),
    # Location types
    path('api/locationTypes/', locationTypesViews.get_location_types, name='get_location_types'),
    path('api/locationTypes/create/', locationTypesViews.create_location_type, name='create_location_type'),
    path('api/locationTypes/<int:pk>/', locationTypesViews.get_location_type, name='get_location_type'),
    path('api/locationTypes/<int:pk>/update/', locationTypesViews.update_location_type, name='update_location_type'),
    path('api/locationTypes/<int:pk>/delete/', locationTypesViews.archive_location_type, name='archive_location_type'),

    # Inventory table (Location entries)
    path('api/location-entires/', viewsLocationEntires.add_location_entry),
    path('api/location-entries/<int:object_id>/<str:app>/', viewsLocationEntires.get_location_entries),
    path('api/location-entires/onOrderStock/<int:object_id>/<str:app>/', viewsLocationEntires.get_on_order_amount),
    path('api/location-entries/updateLocation/', viewsLocationEntires.update_location_entry),
    path('api/location-entries/adjustStock/', viewsLocationEntires.adjust_stock),
    path('api/location-entries/delete/<int:inventory_id>/', viewsLocationEntires.delete_location_entry),
    path('api/location-entries/updateMinimumStockLevel/', viewsLocationEntires.update_minimum_stock_level),
    path('api/location-entries/stockHistory/<int:object_id>/<str:app>/<str:from_date>/<str:to_date>/',
         viewsLocationEntires.get_stock_history),
    path('api/location-entries/stockForecast/<int:object_id>/<str:app>/<str:to_date>/',
         viewsLocationEntires.get_stock_forecast),
]

urlpatterns += router.urls
