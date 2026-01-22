from django.urls.conf import path
from rest_framework import routers
from .api import AssemblyViewSet
from . import views
from . import viewsFile

router = routers.DefaultRouter()
router.register("api/assemblies", AssemblyViewSet, "assemblies")

urlpatterns = [
    path("api/assemblies/fetchAssumbly/<int:asmId>/", views.get_assembly),
    path("api/assemblies/get/latestRevisions/", views.get_latest_revisions),
    path("api/assemblies/update/errata/<int:asmId>/", views.edit_errata),
    path("api/assemblies/put/revisionNotes/<int:asmId>/",
         views.edit_revision_notes),
    path("api/assemblies/saveBlueprint/<int:asmId>/", views.save_blueprint),
    path("api/assemblies/get/singleAsm/<int:pk>/", views.get_single_asm),
    path("api/assemblies/update/bom_id/<int:asmId>/<int:bom_id>/", views.edit_bom_id),
    path("api/assemblies/update/info/<int:pk>/", views.update_info),
    path("api/assemblies/get/revisions/<int:asmId>/", views.get_revision_list),
    path("api/assemblies/newAsmRevision/<int:pk>/", views.new_revision),
    path("api/assemblies/archiveRevision/<int:pk>/", views.archive_revision),
    path("api/assemblies/createNewAssembly/", views.create_new_assembly),
    path("api/assemblies/get/revisions/<int:part_number>/", views.get_revisions),
    path("api/assemblies/get/all/", views.get_all_assemblies),
    path("api/assemblies/star/<int:pk>/", views.star_assembly),
    path("api/assemblies/unstar/<int:pk>/", views.unstar_assembly),
    # Assembly Files
    path(
        # TODO Change to "assemblies" (from "Assembly")
        "api/Assembly/add_file/<int:assembly_id>/<int:file_id>/",
        viewsFile.add_file_to_assembly,
    ),
    path(
        "api/assemblies/fetchFileList/<int:id>/", viewsFile.fetch_file_list
    ),  # DEPRECATED
    path(
        "api/assemblies/files/connectFileToAsm/<int:file_id>/",
        viewsFile.connect_file_with_asm,
    ),  # DEPRECATED
    path(
        "api/assemblies/removeFileCon/<int:file_id>/", viewsFile.remove_file_connection
    ),  # DEPRECATED
]

urlpatterns += router.urls
