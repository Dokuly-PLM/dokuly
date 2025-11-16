from rest_framework import routers
from .api import ProjectViewSet
from . import views
from . import viewsTasks
from . import viewsGantt
from . import viewsIssues
from . import viewsIssueTrees
from . import viewsTags
from django.urls.conf import path

router = routers.DefaultRouter()

urlpatterns = [

    path('api/projects/update/<int:projectId>/', views.edit_project),
    path('api/projects/get/<int:project_id>/', views.get_project),
    path('api/projects/withCustomer/get/<int:project_id>/',
         views.get_project_with_customer),
    path('api/projects/get/all/', views.get_projects_with_project_number),
    path('api/projects/post/newProject/', views.new_project),
    path('api/projects/get/projectName/<int:projectId>/', views.get_project_name),
    path('api/projects/get/activeProjectsByCustomer/<int:customerId>/',
         views.get_active_projects_by_cystomer),
    path('api/projects/get/ProjectsByCustomer/<int:customerId>/',
         views.get_projects_by_customer),
    path('api/projects/get/nextAvailableProjectNumber/', views.get_next_available_project_number),
    path('api/projects/post/checkProjectNumberExists/', views.check_project_number_exists),
    # Admin Views:
    path('api/projects/get/fullNumbered/',
         views.admin_get_projects_with_project_number),
    path('api/projects/get/archived/', views.admin_get_archived),
    # Project access
    path('api/projects/<int:project_id>/add_user/<int:user_id>/',
         views.add_user_to_project),
    path('api/projects/<int:project_id>/remove_user/<int:user_id>/',
         views.remove_user_from_project),
    path('api/projects/<int:project_id>/get_users/', views.get_project_users),

    # Tasks
    path('api/projects/get/tasks/', viewsTasks.get_unarchived_tasks),
    path('api/projects/get/tasks/<int:project_id>/',
         viewsTasks.get_project_tasks),
    path('api/projects/get/activeTasks/<int:project_id>/',
         viewsTasks.get_active_project_tasks),
    path('api/projects/create/task/<int:project_id>/',
         viewsTasks.new_project_task),
    path('api/projects/put/task/<int:task_id>/', viewsTasks.edit_project_task),
    path('api/projects/get/tasksEnhanced/',
         viewsTasks.get_unarchived_tasks_enhanced),
    path('api/projects/addSubtask/', viewsTasks.add_subtask),
    path('api/projects/removeSubtask/', viewsTasks.remove_subtask),
    path('api/projects/getTaskAssignees/<int:task_id>/', viewsTasks.get_task_assignees),

    # Gantt
    path('api/projects/gantt/get/<int:project_id>/', viewsGantt.fetch_gantt),
    path('api/projects/gantt/create/', viewsGantt.create_gantt),
    path('api/projects/gantt/put/<int:gantt_id>/', viewsGantt.update_gantt),

    # Issues
    path('api/issues/', viewsIssues.create_new_issue),  # Get all with PUT id, POST new
    path('api/issues/<int:object_id>/<str:app>/', viewsIssues.get_issues),  # GET issues
    path('api/issues/<int:issue_id>', viewsIssues.get_issue),
    path('api/issues/<int:issue_id>/', viewsIssues.update_issue),
    path('api/issues/delete/<int:issue_id>/', viewsIssues.delete_issue),
    path('api/issues/close/<int:issue_id>/', viewsIssues.close_issue),
    path('api/issues/reopen/<int:issue_id>/', viewsIssues.reopen_issue),

    # Issue trees
    path('api/issues/getBomIssues/<int:object_id>/<str:app>/', viewsIssueTrees.get_bom_issues),

    # Tags
    path('api/projects/get/tags/<int:project_id>/', viewsTags.get_project_tags),
    path('api/projects/put/tags/<int:tag_id>/', viewsTags.update_project_tag),
    path('api/projects/delete/tags/<int:tag_id>/', viewsTags.delete_project_tag),
]

urlpatterns += router.urls
