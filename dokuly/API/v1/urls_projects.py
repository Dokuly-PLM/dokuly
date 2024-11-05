from django.urls import path
from projects import views

urlpatterns = [
    # GET API
    path("api/v1/projects/<int:customerId>/", views.get_projects_by_customer, kwargs={"model_type": "customer"})
]
