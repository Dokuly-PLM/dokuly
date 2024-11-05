from rest_framework import permissions
from .models import Profile


class IsAdminOrOwner(permissions.BasePermission):
    """
    Custom permission class for Django Rest Framework that allows only AUTHENTICATED users with
    specific roles ('Admin' or 'Owner') to access or modify certain resources. This
    class is useful for restricting actions to a subset of privileged users, enhancing
    security and operational integrity.

    Purpose:
        - To restrict access to certain views or actions within DRF to only users
          who are either administrators or owners as defined in their user profile.
        - This ensures that only users with the highest level of access privileges
          can perform sensitive or critical operations.

    Usage:
        - Can be added to DRF views or viewsets as part of the `permission_classes`
          attribute to enforce role-based access control (RBAC).
        - Typically used in environments where actions need to be secured against
          unauthorized access.

    Example:
        @api_view(['GET', 'POST'])
        @permission_classes([IsAdminOrOwner])
        def admin_view(request, pk):
            # Function body that handles the request
            pass

    Attributes:
        None explicitly defined beyond those inherited from BasePermission.

    Methods:
        has_permission(self, request, view):
            - The core method called by DRF to determine if a request should be permitted.
            - Checks if the user is authenticated and whether their role is either 'Admin' or 'Owner'.
            - Returns True if conditions are met, otherwise False, blocking access to the resource.
    """

    def has_permission(self, request, view):
        # First, check if the user is authenticated
        if not request.user.is_authenticated or request.user == None:
            return False

        # Fetch the user's profile
        try:
            user_profile = Profile.objects.get(user=request.user)
        except Profile.DoesNotExist:
            return False

        # Check if the user is an admin or an owner
        if user_profile.role in ["Admin", "Owner"]:
            return True

        return False
