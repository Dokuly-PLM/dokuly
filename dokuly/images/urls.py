from rest_framework import routers
from .api import ImageViewSet

router = routers.DefaultRouter()
router.register('api/images', ImageViewSet, 'images')

urlpatterns = router.urls
