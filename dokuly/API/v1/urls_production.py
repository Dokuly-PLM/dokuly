from django.urls import path
from production import views2

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
    # No current get requests for production
    path('api/v1/production/<str:number>/<str:serial_number>/', views2.get_production_by_number_and_serial,
         name='get_production_by_number_and_serial',  kwargs={"model_type": "production"}),

    path('api/v1/production/get/', views2.get_all_production,
         name='get_all_production', kwargs={"model_type": "production"}),

    path('api/v1/production/test-data/get/<str:identifier>/<str:serial_number>/', views2.get_test_data,
         name='get_test_data', kwargs={"model_type": "production"}),

    ################### POST API ######################

    path('api/v1/production/', views2.create_single_production,
         name='create_single_production',  kwargs={"model_type": "production"}),

    path('api/v1/production/test-data/<str:identifier>/<str:serial_number>/',
         views2.post_test_data, name='post_test_data', kwargs={"model_type": "production"}),



    ################### PUT API #######################
    # This is a PUT request, but its purpose is to get a production item by string search
    # Might need to move this into a combined view
    path('api/v1/production/search/', views2.search_production_items,
         kwargs={"model_type": "production"}),  # Tested

    path('api/v1/production/update/<str:identifier>/<str:serial_number>/',
         views2.update_production, name='update_production', kwargs={"model_type": "production"}),



    ################### Delete API ###################
    path('api/v1/production/test-data/delete/<int:id>/',
         views2.delete_test_data, name='delete_test_data', kwargs={"model_type": "production"}),

    ################### FILE API ######################
    # No current file requests for production
]
