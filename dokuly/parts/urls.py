from rest_framework import routers
from django.urls import path
from .api import PartViewSet
from . import (
    views,
    viewFiles,
    viewRender,
    viewsPartTypes,
    viewsPrice,
    viewsNexar,
    viewsNexarPrices,
    viewsDigikey,
)
from rest_framework.decorators import api_view, renderer_classes
from rest_framework import renderers

router = routers.DefaultRouter()
router.register("api/parts", PartViewSet, "parts")


urlpatterns = [
    path("api/parts/createNewPart/", views.create_new_part),
    path("api/parts/editPart/<int:pk>/", views.edit_part),
    path("api/parts/removeMarkdownNotes/<int:pk>/", views.remove_part_notes),
    path("api/parts/newRevision/<int:pk>/", views.new_revision),
    path("api/parts/get/revisions/<int:id>/", views.get_revision_list),
    path("api/parts/alt/<str:partIds>/", views.alt_parts_for_part),
    path(
        "api/parts/alternative/add/<str:partID>/<str:alternativePartID>/",
        views.add_alternative_part,
    ),
    path(
        "api/parts/alternative/remove/<str:partID>/<str:alternativePartID>/",
        views.remove_alternative_part,
    ),
    path("api/parts/singlePart/<int:pk>/", views.get_single_part),
    path("api/parts/get/part/<int:pk>/", views.get_single_part),
    path("api/parts/get/unarchived/", views.get_unarchived_parts),
    path("api/parts/get/latestRevisions/", views.get_latest_revisions),
    path("api/parts/get/parts_table/", views.get_parts_table),
    path("api/parts/archivePart/<int:pk>/", views.archive_part),
    path("api/parts/put/revisionNotes/<int:partId>/", views.edit_revision_notes),
    path("api/parts/update/errata/<int:partId>/", views.edit_errata),
    path("api/parts/update/sellers/<int:partId>/", views.clear_sellers_data),
    path("api/parts/put/partInformation/<int:pk>/",
         views.edit_part_information),
    path(
        "api/parts/fetchPossibleBomEntires/<int:asms>/<int:parts>/<int:pcbas>/",
        views.fetch_possible_bom_entries,
    ),
    path("api/parts/onOrder/<int:part_id>/", views.get_on_order_for_part),
    # BOM
    path(
        "api/parts/getLinkedParts/<str:assembly_ids>/<str:part_ids>/<str:pcba_ids>/",
        views.get_bom_items,
    ),
    # Part Files
    path("api/Part/add_file/<int:part_id>/<int:file_id>/",
         viewFiles.add_file_to_part),
    path("api/parts/fetchFileList/<int:id>/",
         viewFiles.fetch_file_list),  # DEPRECATED
    path(
        "api/parts/files/connectFileToPart/<int:file_id>/",  # DEPRECATED
        viewFiles.connect_file_with_part,
    ),
    # Part correction/"migration"
    path(
        "api/parts/batch_process_is_latest_revision_of_all_parts/",
        views.batch_process_is_latest_revision_of_all_parts,
    ),
    path(
        "api/parts/batch_process_full_part_number_on_all_parts/",
        views.batch_process_full_part_number_on_all_parts,
    ),
    # Part Types
    path("api/parts/get/partTypes/", viewsPartTypes.get_part_types),
    path("api/parts/post/partType/", viewsPartTypes.add_part_type),
    path("api/parts/put/partType/<int:part_type_id>/", viewsPartTypes.edit_part_type),
    path("api/parts/delete/partType/<int:part_type_id>/",
         viewsPartTypes.delete_part_type),
    path(
        "api/parts/get/convert_threemf_to_gltf_view/<int:file_id>/",
        viewRender.convert_threemf_to_gltf_view,
    ),
    path(
        "api/parts/put/update_thumbnail/<int:partId>/<int:imageId>/",
        views.update_thumbnail,
    ),
    # Price
    path(
        "api/parts/updatePrice/<str:app>/<int:item_id>/",
        viewsPrice.update_price,
    ),
    # Global part search (searching among PCBAs, Parts, Assemblies)
    path("api/global_part_search/", views.global_part_search),
    # Search parts by MPN
    path("api/parts/search_by_mpn/", views.search_parts_by_mpn),
    # Nexar integration
    path("api/parts/nexar/search/", viewsNexar.search_nexar_parts),
    path("api/parts/nexar/clear_cache/", viewsNexar.clear_nexar_cache),
    path("api/parts/nexar/check_config/", viewsNexar.check_nexar_config),
    path("api/parts/nexar/create_prices/", viewsNexarPrices.create_prices_from_nexar),
    # DigiKey integration
    path("api/parts/digikey/search/", viewsDigikey.search_digikey_parts),
    path("api/parts/digikey/product_details/", viewsDigikey.get_digikey_product_details),
    path("api/parts/digikey/check_config/", viewsDigikey.check_digikey_config),
    path("api/parts/digikey/test_connection/", viewsDigikey.test_digikey_connection),
    path("api/parts/digikey/clear_cache/", viewsDigikey.clear_digikey_cache),
    # Common views between parts, PCBAs and assemblies
    path("api/items/edit/releaseState/", views.edit_release_state),
]

urlpatterns += router.urls
