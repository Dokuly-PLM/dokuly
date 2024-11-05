from django.urls import path
from documents import views

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
    path('api/v1/documents/', views.get_latest_revisions,
         kwargs={"model_type": "document"}),  # Tested

    path('api/v1/documents/<int:pk>/', views.get_document,
         kwargs={"model_type": "document"}),  # Tested

    ################### POST API ######################
    path('api/v1/documents/new/', views.create_new_document,
         kwargs={"model_type": "document"}),  # Tested

    path('api/v1/documents/revision/<int:pk>/',
         views.auto_new_revision, kwargs={"model_type": "document"}),

    ################### PUT API #######################
    path('api/v1/documents/update/<int:pk>/', views.update_doc,
         kwargs={"model_type": "document"}),  # Tested

    ################### ARCHIVE API ###################
    path('api/v1/documents/archive/<int:pk>/',
         views.set_doc_to_archived, kwargs={"model_type": "document"}),  # Tested

    ################### FILE API ######################
    # No need for a new view or endpoint here, file upload is possible in both post and put
]
