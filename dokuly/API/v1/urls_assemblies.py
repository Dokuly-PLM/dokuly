from django.urls import path
from assemblies import views
from assemblies import viewsFile

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
    # Need a new view for this, currently have upload file view + connect to assembly
]
