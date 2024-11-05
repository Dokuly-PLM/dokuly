from django.urls.conf import path
from rest_framework import routers
from .api import PartNumberViewSet
from . import views

router = routers.DefaultRouter()
router.register('api/partNumbers', PartNumberViewSet, 'part_numbers')

urlpatterns = [
    # Assembly correction/"migration"
    path("api/partNumbers/offsetPartNumber/<int:offset_value>/", views.offset_part_number),
]

urlpatterns += router.urls
