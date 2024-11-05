from django.urls import path
from rest_framework import routers
from . import views

urlpatterns = [
    path('api/domain/checkAvailability/', views.check_availability),
]