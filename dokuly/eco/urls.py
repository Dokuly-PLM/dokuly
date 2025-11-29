from rest_framework import routers
from .api import EcoViewSet

router = routers.DefaultRouter()
router.register('api/eco', EcoViewSet, 'eco')

urlpatterns = router.urls
