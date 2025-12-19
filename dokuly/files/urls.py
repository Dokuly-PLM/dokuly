from django.urls.conf import path
from rest_framework import routers
from .api import FileViewSet
from . import views

router = routers.DefaultRouter()
router.register("api/files", FileViewSet, "files")

# URL Configuration
urlpatterns = [
    # Files
    path("api/files/download/file/<int:file_id>/", views.download_file),
    path("api/files/view/<int:file_id>/", views.view_file),
    path("api/files/upload/file/<int:file_id>/", views.upload_file),
    path("api/files/archive/<int:file_id>/", views.archive_file),
    path("api/files/post/upload_with_new_row/",
         views.upload_and_create_new_file_row),
    path("api/files/post/upload_multiple_with_new_rows/",
         views.upload_multiple_and_create_new_file_rows),
    path("api/files/connect_multiple/<str:app_str>/<int:object_id>/",
         views.connect_multiple_files_to_object),
    path("api/files/get/files/", views.get_files),
    path("api/files/delete/<int:file_id>/", views.delete_file),
    # Images
    path("api/files/images/download/<int:id>/", views.download_image),
    path("api/files/images/uploadImage/", views.upload_image),
    path("api/files/post/thumbnail/", views.upload_thumbnail),
    path("api/files/delete/thumbnail/", views.delete_thumbnail),
    path("api/files/images/fetchImageList/", views.get_images),
    path(
        "api/files/images/archiveImage/<int:id>/<int:returnFlag>/", views.archive_image
    ),
    path("api/files/images/fetchArchived/", views.fetch_archived_images),
    path("api/files/images/restoreArchived/<int:id>/", views.unarchive_image),
    path("api/files/images/fetchSelectedLogo/", views.fetch_selected_org_image),
    # Tenants
    path("api/files/checkTenantStorage/", views.check_tenant_storage_size),
    path("api/files/setTenantStorageLimit/", views.set_storage_limit),
    path("api/files/images/", views.get_images, name='get-images'),
    path('api/files/image/<int:image_id>/<str:version>/', views.get_image, name='get_image'),
    path('images/download/<int:id>/', views.download_image, name='download_image'),

    # DEPRECATED
    path(
        "api/files/get/byId/<int:objectId>/<str:objectType>/",
        views.get_files_production,
    ),
    # DEPRECATED
    path("api/files/put/production/<int:prod_id>/",
         views.create_prod_file_connection),
]

urlpatterns += router.urls
