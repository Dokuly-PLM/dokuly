from django.urls import path
from assemblies import views
from assemblies import viewsFile
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
    path('api/v1/assemblies/', views.get_latest_revisions,
         kwargs={"model_type": "assembly"}),  # Tested

    path('api/v1/assemblies/<int:pk>/', views.get_single_asm,
         kwargs={"model_type": "assembly"}),  # Tested

    ################### POST API ######################
    path('api/v1/assemblies/new/', views.create_new_assembly,
         kwargs={"model_type": "assembly"}),  # Tested

    path('api/v1/assemblies/revision/<int:pk>/',
         views.new_revision, kwargs={"model_type": "assembly"}),  # Tested

    ################### PUT API #######################
    path('api/v1/assemblies/update/<int:pk>/', views.update_info,
         kwargs={"model_type": "assembly"}),  # Tested

    ################### ARCHIVE API ###################
    path('api/v1/assemblies/archive/<int:pk>/',
         views.archive_revision, kwargs={"model_type": "assembly"}),  # Tested

    ################### FILE API ######################
    path('api/v1/assemblies/upload/<int:assembly_id>/', views_files.upload_file_to_assembly,
         kwargs={"model_type": "assembly"}),  # Upload file to assembly
    
    path('api/v1/assemblies/<int:assembly_id>/files/', views_files.download_files_from_assembly,
         kwargs={"model_type": "assembly"}),  # Download all files from assembly as ZIP
]
