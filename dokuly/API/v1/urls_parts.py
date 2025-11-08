from django.urls import path
from parts import views
from API.v1 import views_files

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
    path('api/v1/parts/', views.get_latest_revisions,
         kwargs={"model_type": "part"}),  # Tested

    path('api/v1/parts/<int:pk>/', views.get_single_part,
         kwargs={"model_type": "part"}),  # Tested

    path('api/v1/parts/types/', views.get_part_types,
         kwargs={"model_type": "part"}),  # Get all part types

    ################### POST API ######################
    path('api/v1/parts/new/', views.create_new_part,
         kwargs={"model_type": "part"}),  # Tested

    path('api/v1/parts/revision/<int:pk>/',
         views.new_revision, kwargs={"model_type": "part"}),  # Tested

    ################### PUT API #######################
    path('api/v1/parts/update/<int:pk>/', views.edit_part,
         kwargs={"model_type": "part"}),  # Tested

    ################### ARCHIVE API ###################
    path('api/v1/parts/archive/<int:pk>/',
         views.archive_part, kwargs={"model_type": "part"}),  # Tested

    ################### FILE API ######################
    path('api/v1/parts/upload/<int:part_id>/', views_files.upload_file_to_part,
         kwargs={"model_type": "part"}),  # Upload file to part
    
    path('api/v1/parts/<int:part_id>/files/', views_files.download_files_from_part,
         kwargs={"model_type": "part"}),  # Download all files from part as ZIP
]
