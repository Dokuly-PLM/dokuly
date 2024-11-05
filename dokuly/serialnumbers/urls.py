from rest_framework import routers
from .api import SerialNumberViewSet
from django.urls import path
from . import views

router = routers.DefaultRouter()
router.register('api/serialnumbers', SerialNumberViewSet, 'serialnumbers')

urlpatterns = [
    path('api/asm/serialnumbers/<int:asmId>/', views.fetch_serial_numbers_asm),
    path('api/serialnumbers/fetchSerialNum/<int:asmId>/', views.fetch_serial_number_value)
]

urlpatterns += router.urls
