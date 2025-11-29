from django.urls import path
from . import views

urlpatterns = [
    path("api/eco/create/", views.create_eco, name="create_eco"),
    path("api/eco/get/<int:pk>/", views.get_eco, name="get_eco"),
    path("api/eco/get/", views.get_all_ecos, name="get_all_ecos"),
    path("api/eco/edit/<int:pk>/", views.edit_eco, name="edit_eco"),
    path("api/eco/delete/<int:pk>/", views.delete_eco, name="delete_eco"),
]
