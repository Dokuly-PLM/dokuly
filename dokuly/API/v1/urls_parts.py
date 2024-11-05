from django.urls import path
from parts import views

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
    # Need a new view for this, currently have upload file view + connect to part
]
