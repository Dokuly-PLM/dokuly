from rest_framework import routers
from .api import PcbaViewSet
from django.urls import path
from . import views, viewsBom, viewsFiles

router = routers.DefaultRouter()
router.register("api/pcbas", PcbaViewSet, "pcbas")

urlpatterns = [
    # Pcba
    path("api/pcbas/fetch/pcbas/", views.fetch_pcbas),
    path("api/pcbas/get/latestRevisions/", views.get_latest_revisions),
    path("api/pcbas/fetch/pcba/<int:pk>/", views.fetch_single_pcba),
    path("api/pcbas/fetchPcba/<int:pk>/", views.fetch_single_pcba),
    path("api/pcbas/edit/<int:pk>/", views.edit_pcba),
    path("api/pcbas/archive/<int:pk>/", views.archive_pcba),
    path("api/pcbas/newRevision/<int:pk>/", views.new_revision),
    path("api/pcbas/put/revisionNotes/<int:pcbaId>/",
         views.update_revision_notes),
    path("api/pcbas/update/errata/<int:pcbaId>/", views.edit_errata),
    path("api/pcbas/fetchNodesBlueprint/<str:pcbaIds>",
         views.fetch_nodes_blueprint),
    path(
        "api/pcbas/saveEdge/<int:source>/<int:target>/<int:asmId>/",
        views.save_blueprint_edge,
    ),
    path("api/pcbas/createNewPcba/", views.create_new_pcba),
    path("api/pcbas/get/revisions/<int:id>/", views.get_revisions),
    path("api/pcbas/renderSvg/<int:pcba_id>/", viewsFiles.render_svg),
    # PCBA Files
    path("api/pcbas/fetchFileList/<int:id>/", viewsFiles.fetch_file_list),

    path("api/pcbas/add_file/<int:pcba_id>/<int:file_id>/", viewsFiles.add_file_to_pcba),
    path(
        "api/pcbas/download/<str:file_identifier>/<int:pcba_id>/",
        viewsFiles.download_file,
    ),
    path("api/pcbas/view/<str:file_identifier>/<int:pcba_id>/", viewsFiles.view_file),
    path(
        "api/pcbas/connectFileToPcba/<int:pcba_id>/<int:file_id>/",
        viewsFiles.connect_generic_file_with_pcba,
    ),
    # Gerber Files
    path("api/pcbas/gerber/<int:pcba_id>/", viewsFiles.handle_gerber_files),
    path("api/pcbas/put/pcbLayers/<int:pcba_id>/", viewsFiles.update_pcb_layers),

    # DEPRECATED
    path("api/pcbas/uploadPcbaFile/", viewsFiles.upload_pcba_file),
]

urlpatterns += router.urls
