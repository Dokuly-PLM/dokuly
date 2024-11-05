from rest_framework import routers
from .api import EmployeeTimeViewSet

from . import views
from django.urls.conf import path

router = routers.DefaultRouter()
router.register('api/timetracking', EmployeeTimeViewSet, 'timetracking')

urlpatterns = [
    path('api/timetracking/get/timeRecordByUser/',
         views.get_time_record_by_user),
    path('api/timetracking/get/timeRecordByUserByWeek/<str:isoWeek>/',
         views.get_time_record_by_user_and_week),
    path('api/timetracking/get/timeRecordByUser/<str:year>/',
         views.get_time_record_by_user_and_year),
    path('api/timetracking/get/timeRecord/<int:id>/', views.get_time_record),
    path('api/timetracking/delete/<int:id>/', views.delete_time_record),
    path('api/timetracking/put/timeRecord/', views.set_time_record),
    path('api/timetracking/put/newCloneRecord/<int:id>/',
         views.start_clone_time_record),
    path('api/timetracking/get/allByYear/<str:year_from>/<str:year_to>/',
         views.get_timetrackings),
    path("api/timetracking/get/lastEntry/", views.get_last_timetrack_entry),
    path("api/timetracking/get/timeByProjectTasks/<int:project_id>/", views.get_time_records_by_project_tasks)
]

urlpatterns += router.urls
