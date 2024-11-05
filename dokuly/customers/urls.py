from rest_framework import routers
from .api import CustomerViewSet
from . import views
from django.urls import path

router = routers.DefaultRouter()
router.register('api/customers', CustomerViewSet, 'customers')

urlpatterns = [
    path('api/customers/get/all/', views.get_customers),
    path('api/customers/post/newCustomer/', views.create_new_customer),
    path('api/customers/get/unarchived/', views.get_unarchived_customers),
    path('api/customers/get/<int:customer_id>/', views.get_customer),
    path('api/customers/put/<int:customerId>/', views.edit_customer),
    path('api/customers/get/activeCustomers/', views.get_active_customers),
]

urlpatterns += router.urls
