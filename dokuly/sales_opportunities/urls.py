from rest_framework import routers
from .api import SalesOpportunityViewSet

router = routers.DefaultRouter()
router.register('api/sales_opportunities',
                SalesOpportunityViewSet, 'sales_opportunities')

urlpatterns = router.urls
