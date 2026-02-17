from django.urls.conf import path
from . import viewsBomCost
from rest_framework import routers
from .api import Assembly_bomViewset
from . import views
from . import viewsBomitems

router = routers.DefaultRouter()
router.register("api/assembly_bom", Assembly_bomViewset, "assembly_bom")

urlpatterns = [
    path("api/assembly_bom/update/copyBom/<int:asmId>/", views.copy_bom),
    path("api/assembly_bom/get/allBoms/<int:assembly_id>/", views.fetch_all_boms),
    path("api/assembly_bom/get/bom/<int:bom_id>/", views.get_bom),
    path("api/assembly_bom/mergedSearch/<str:search>/", views.merged_search),
    path(
        "api/assembly_bom/simpleSearch/<str:search>/<int:currentBomId>/",
        views.simple_asm_bom_search,
    ),
    path("api/assembly_bom/update/comments/<int:bomId>/", views.update_comments),
    # Views for New BOM
    path("api/assembly_bom/assemblies/<int:asm_id>/", views.get_bom_by_asm_id),
    path(
        "api/assembly_bom/getItems/assemblies/<int:asm_id>/",
        viewsBomitems.get_bom_items_by_asm_id,
    ),
    path("api/assembly_bom/pcbas/<int:pcba_id>/", views.get_bom_by_pcba_id),
    path(
        "api/assembly_bom/getItems/pcbas/<int:pcba_id>/",
        viewsBomitems.get_bom_items_by_pcba_id,
    ),
    path(
        "api/assembly_bom/getItemsWithLinkedParts/<str:app>/<int:item_id>/",
        viewsBomitems.get_bom_items_with_linked_parts,
    ),
    path("api/assembly_bom/editItem/<int:itemId>/", viewsBomitems.edit_bom_item),
    path("api/assembly_bom/removeItem/<int:itemId>/", viewsBomitems.remove_bom_item),
    path("api/assembly_bom/<int:bomId>/clearBom/", viewsBomitems.clear_bomb_items),
    path("api/assembly_bom/<int:bomId>/addItem/", viewsBomitems.add_bom_item),
    path(
        "api/assembly_bom/<int:bomId>/addItemWithContents/",
        viewsBomitems.add_bom_item_with_contents,
    ),
    path(
        "api/assembly_bom/<int:bomId>/matchItemsWithParts/",
        viewsBomitems.match_bom_items_with_parts,
    ),
    # Views for BOM Cost
    path(
        "api/assembly_bom/get/bomCost/<str:app>/<int:id>/",
        viewsBomCost.get_bom_cost,
    ),
    # Where Used functionality
    path(
        "api/assembly_bom/whereUsed/<str:app>/<int:item_id>/",
        views.get_where_used,
    ),
]

urlpatterns += router.urls
