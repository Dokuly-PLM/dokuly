from django.urls import path
from customers import views


urlpatterns = [
    # GET API
    path("api/v1/customers/", views.get_active_customers, kwargs={"model_type": "project"})
]
