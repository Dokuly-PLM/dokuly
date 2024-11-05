from rest_framework import routers
from .api import ReimbursementViewSet

router = routers.DefaultRouter()
router.register('api/reimbursements',
                ReimbursementViewSet, 'reimbursements')

urlpatterns = router.urls
