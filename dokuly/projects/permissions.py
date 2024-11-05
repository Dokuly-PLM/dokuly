from rest_framework import permissions
from projects.models import Project


class IsProjectMember(permissions.BasePermission):
    """
    Custom permission class for Django Rest Framework that checks if the current user
    is a member of the project they are attempting to view or edit.

    This class is intended to be used in views that deal with project-specific data,
    where each project has an associated list of user members. It ensures that each
    request to the view is performed by a user who is a member of the relevant project,
    thus protecting project data from being accessed or modified by unauthorized users.

    Usage:
        - This permission can be applied to any DRF view by including it in the
          `permission_classes` attribute of the view or viewset, or by using it with
          the `@permission_classes` decorator in function-based views.

    Example:
        @api_view(['GET', 'POST'])
        @permission_classes([IsProjectMember])
        def project_detail(request, pk):
            # Function body that handles the request
            pass

    Attributes:
        None

    Methods:
        has_permission(self, request, view):
            Checks if the request should be permitted based on the user's membership in the
            relevant project. This method is automatically called by DRF to determine if
            the view should be executed or if a permission error (403) should be returned.
    """

    def has_permission(self, request, view):
        # Checks if the user is authenticated
        if not request.user.is_authenticated:
            return False

        # Get the project from the view's kwargs or query_params, depending on your URL configuration
        project_id = view.kwargs.get(
            'pk') or request.query_params.get('project_id')
        if not project_id:
            return False

        try:
            # Attempt to get the project and check membership
            project = Project.objects.get(pk=project_id)
        except Project.DoesNotExist:
            return False

        return request.user in project.project_members.all()
