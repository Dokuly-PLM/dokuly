from django.urls import path
from pcbas import views, viewsFiles, viewsBom
from files import views as file_views

# API Requirements:
# - GET by ID
# - GET all
# - POST
# - PUT by ID
# - ARCHIVE (PUT) by ID
# - File Upload


# IMPORTANT: Views included for API should not have the
# check_user_auth_and_app_permission check.
# Instead, use @permission_classes([IsAuthenticated | APIAndProjectAccess])


urlpatterns = [
    ################### GET API #######################
    path('api/v1/pcbas/', views.get_latest_revisions,
         kwargs={"model_type": "pcba"}),  # Tested

    path('api/v1/pcbas/<int:pk>/', views.fetch_single_pcba,
         kwargs={"model_type": "pcba"}),  # Tested

    ################### POST API ######################
    path('api/v1/pcbas/new/', views.create_new_pcba,
         kwargs={"model_type": "pcba"}),  # Tested

    path('api/v1/pcbas/revision/<int:pk>/',
         views.new_revision, kwargs={"model_type": "pcba"}),  # Tested

    ################### PUT API #######################
    path('api/v1/pcbas/update/<int:pk>/', views.edit_pcba,
         kwargs={"model_type": "pcba"}),  # Tested

    path('api/v1/pcbas/fetchByPartNumberRevision/', views.fetch_pcba_by_revision_and_part_number, kwargs={"model_type": "pcba"}),

    ################### ARCHIVE API ###################
    path('api/v1/pcbas/archive/<int:pk>/',
         views.archive_pcba, kwargs={"model_type": "pcba"}),  # Tested

    ################### FILE API ######################
    path('api/v1/pcbas/upload/<int:pcba_id>/',
         viewsFiles.upload_file_to_pcba,
         kwargs={"model_type": "pcba"}),  # Generic file upload

    path('api/v1/pcbas/bom/<int:pcba_id>/',
         viewsBom.upload_pcba_bom,
         kwargs={"model_type": "pcba"}),  # BOM file upload

    path('api/v1/pcbas/thumbnail/<int:pk>/',
         file_views.upload_thumbnail,
         kwargs={"model_type": "pcba"}),  # Thumbnail upload

]
