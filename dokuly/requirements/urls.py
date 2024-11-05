from django.urls.conf import path
from rest_framework import routers
from .api import RequirementSetViewSet, RequirementViewSet
from . import requirementSetViews
from . import requirementViews

router = routers.DefaultRouter()
router.register("api/requirements", RequirementViewSet, "requirements")
router.register("api/requirementSets", RequirementSetViewSet, "requirementSets")

urlpatterns = [
    # Requirement Set
    path(
        "api/requirements/create/requirementSet/",
        requirementSetViews.create_requirement_set,
    ),
    path(
        "api/requirements/edit/requirementSet/<int:id>/",
        requirementSetViews.edit_requirement_set,
    ),
    path(
        "api/requirements/delete/requirementSet/<int:id>/",
        requirementSetViews.delete_requirement_set,
    ),
    path(
        "api/requirements/get/requirementSet/<int:id>/",
        requirementSetViews.get_requirement_set,
    ),
    path(
        "api/requirements/get/requirementSets/",
        requirementSetViews.get_all_requirement_sets,
    ),
    # Requirements
    path(
        "api/requirements/create/requirement/<int:set_id>/",
        requirementViews.create_requirement,
    ),
    path(
        "api/requirements/delete/requirement/<int:id>/",
        requirementViews.delete_requirement,
    ),
    path(
        "api/requirements/get/requirement/<int:id>/", requirementViews.get_requirement
    ),
    path(
        "api/requirements/edit/requirement/<int:id>/", requirementViews.edit_requirement
    ),
    path(
        "api/requirements/get/requirementsBySet/<int:set_id>/",
        requirementViews.get_requirements_by_set,
    ),
    path(
        "api/requirements/get/topRequirementsBySet/<int:set_id>/",
        requirementViews.get_top_requirements,
    ),
    path(
        "api/requirements/create/subRequirement/<int:parent_id>/",
        requirementViews.create_sub_requirement,
    ),
    path(
        "api/requirements/get/requirementsByParent/<int:parent_id>/",
        requirementViews.get_requirements_by_parent,
    ),
]

urlpatterns += router.urls
