from django.urls import path
from rest_framework import routers
from .api import ProductionViewSet
from . import views
from . import views2
from . import viewsLots

router = routers.DefaultRouter()
router.register('api/production', ProductionViewSet, 'production')

# URL Configuration
urlpatterns = [
    path('api/production/<int:id>', views.fetch_single_production),
    path('api/production/edit/<int:id>/', views.edit_pcba_prod),
    path('api/production/nodes/<int:asmID>', views.fetch_pcba_prod_nodes),
    path('api/production/addEdge/<int:source>/<int:target>/',
         views.add_pcba_prod_edge),
    path('api/production/removeEdge/<int:source>/<int:target>', views.remove_edge),
    path('api/production/addSerialId/<int:nodeId>/<int:id>',
         views.add_id_to_added_node),
    path('api/production/removeNode/<int:nodeId>/<int:flag>', views.remove_node),
    path('api/production/clear/editHistory/<int:prodId>/',
         views.clear_edit_history),
    path('api/production/edit/softwareInfo/<int:prod_id>/<int:file_id>/',
         views.edit_software_info),

    path('api/productions/createNewProduction/', views2.create_new_production),
    path('api/productions/searchProductionItems/',
         views2.search_production_items),
    path('api/production/test-data/get/<str:identifier>/<str:serial_number>/', views2.get_measurements),



    # Lots
    path('api/lots/', viewsLots.get_lots),
    path('api/lots/<int:id>', viewsLots.get_single_lot),
    path('api/lots/<int:id>/', viewsLots.edit_lot),
    path('api/lots/create/', viewsLots.create_lot),
    path('api/lots/fetchBom/<int:id>/', viewsLots.fetch_bom),
    path('api/lots/fetchSerialNumbers/<int:id>/', viewsLots.fetch_serial_numbers),
    path('api/lots/serialNumbers/update/<int:id>/', viewsLots.update_serial_number),
    path('api/lots/getConnectedPo/<int:id>/', viewsLots.fetch_connected_po),
    path('api/lots/delete/<int:id>/', viewsLots.delete_lot),

]

urlpatterns += router.urls
