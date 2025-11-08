from rest_framework import permissions
from rest_framework_api_key.permissions import BaseHasAPIKey
from django.core.exceptions import ObjectDoesNotExist
from .models import OrganizationAPIKey, Project
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey

# Constants for API key header format
API_KEY_PREFIX = "Api-Key "
AUTHORIZATION_HEADER = "HTTP_AUTHORIZATION"
X_API_KEY_HEADER = "HTTP_X_API_KEY"


class APIAndProjectAccess(BaseHasAPIKey):
    """
    Custom permission class that extends BaseHasAPIKey to enforce access control based
    on project membership for users accessing via API keys.

    This class checks if the API key provided in the request grants access to the
    project specified in the URL. It supports a wildcard mechanism where an API key
    without a specific project association is granted access to all projects.

    Usage:
        - This permission can be included in the `permission_classes` attribute of
          any DRF view or viewset that requires API key access control based on project membership.

    Example:
        @api_view(['GET', 'POST'])
        @permission_classes([HasAPIAndProjectAccess])
        def view(request, pk):
            # Function body that handles the request
            pass

    Attributes:
        model (OrganizationAPIKey): The model associated with the API key which includes
                                    a link to potential projects via a ManyToManyField.

    Methods:
        has_permission(self, request, view):
            Determines if the request should be allowed based on the API key's project
            permissions. Returns True if the key allows access to the requested project,
            otherwise False.
    """

    model = OrganizationAPIKey

    def has_permission(self, request, view):
        """
        Check if the request has permission based on API key validation and project access.
        
        This method:
        1. Extracts the API key from Authorization header (with "Api-Key" prefix) or X-Api-Key header
        2. Validates the API key using BaseHasAPIKey
        3. Checks project-level access permissions
        4. Sets request attributes for downstream use
        
        Returns:
            bool: True if access is granted, False otherwise
        """
        # Set key validation flag to False by default
        request.key_validated = False

        # Extract API key from Authorization header, handling "Api-Key" prefix
        auth_header = request.META.get(AUTHORIZATION_HEADER, "")
        api_key = None
        
        if auth_header:
            # Check if the header starts with "Api-Key" prefix
            if auth_header.startswith(API_KEY_PREFIX):
                # Extract just the key part (after "Api-Key ")
                api_key = auth_header.split(API_KEY_PREFIX, 1)[-1].strip()
            else:
                # If it doesn't start with "Api-Key", assume it's just the key
                api_key = auth_header.strip()
        
        # Also check X-Api-Key header as fallback (default for rest_framework_api_key)
        if not api_key:
            api_key = request.META.get(X_API_KEY_HEADER, "")
        
        if not api_key:
            return False
        
        # Temporarily set HTTP_X_API_KEY so BaseHasAPIKey can find it
        # (BaseHasAPIKey looks for HTTP_X_API_KEY by default)
        original_x_api_key = request.META.get(X_API_KEY_HEADER)
        request.META[X_API_KEY_HEADER] = api_key

        try:
            # Check if the API key is valid
            has_key_permission = super().has_permission(request, view)
        finally:
            # Always restore original X-Api-Key header if we modified it
            if original_x_api_key is not None:
                request.META[X_API_KEY_HEADER] = original_x_api_key
            elif X_API_KEY_HEADER in request.META:
                del request.META[X_API_KEY_HEADER]
        
        # If the API key is invalid, deny access
        if not has_key_permission:
            return False

        # Extracts model type from URL conf or view kwargs
        model_type = view.kwargs.get('model_type')
        if not model_type:
            return False  # Ensures there is a model type to process

        # Extract and validate the API key object
        try:
            organization_api_key = self.model.objects.get_from_key(api_key)
        except (ObjectDoesNotExist, ValueError):
            # Invalid API key format or key doesn't exist
            return False

        request.organization_id = organization_api_key.organization.id

        # Remove allowed_projects from request to avoid conflicts with other permissions
        request.allowed_projects = None

        # This check must be done before checking for 'pk' in view.kwargs
        # If not, all views accessed with api key that doesn't use pk will be denied
        if 'pk' not in view.kwargs or model_type == "part":
            # This is a request for a collection of items
            allowed_projects = organization_api_key.projects.all()
            if not allowed_projects.exists():
                request.allowed_projects = []
                request.key_validated = True
                return True  # Wildcard access

            # Modify the queryset in the view to limit to allowed projects
            request.allowed_projects = allowed_projects
            request.key_validated = True
            return True

        # Attempts to retrieve the model ID from URL kwargs (path converter <int:pk>)
        model_id = view.kwargs.get('pk')
        if not model_id:
            return False  # Ensures there is a model ID provided in the request

        # Check for wildcard access
        if not organization_api_key.projects.exists():
            request.key_validated = True
            return True

        # Gets the model class from Django's ContentType framework based on model_type
        try:
            model_class = ContentType.objects.get(model=model_type).model_class()
            model_instance = model_class.objects.get(pk=model_id)
        except ObjectDoesNotExist:
            # Model type or instance doesn't exist
            return False

        # Checks if the project associated with the model instance is allowed access
        project = model_instance.project
        if project in organization_api_key.projects.all():
            request.key_validated = True
            return True  # Grants permission if the project is associated

        return False  # Denies permission otherwise

    def has_validated_projects(request):
        """
        Determines if there are validated projects linked to the API key in the request.

        This function checks if the request object has an attribute 'allowed_projects' that is not None,
        which indicates specific project permissions are attached to the API key.

        Parameters:
        - request (HttpRequest): The HTTP request object containing metadata about the session.

        Returns:
        - bool: True if validated projects are present, False otherwise.
        """
        if hasattr(request, 'allowed_projects') and request.allowed_projects is not None:
            return True
        return False

    def has_validated_key(request):
        """
        Checks whether the API key associated with the request has been validated.

        This validation can be either direct through the key itself or through associated projects.
        It is a critical function to ensure that subsequent actions are permitted under security rules.

        Parameters:
        - request (HttpRequest): The HTTP request object used in the current session.

        Returns:
        - bool: True if the API key or its associated projects have been validated, False otherwise.
        """
        if hasattr(request, 'key_validated') and request.key_validated is not None:
            return request.key_validated
        if hasattr(request, 'allowed_projects') and request.allowed_projects is not None:
            return True
        return False

    def check_wildcard_access(request):
        """
        Assesses if the API key grants wildcard access, meaning unrestricted access to all projects.

        Wildcard access is determined by checking if 'allowed_projects' is an empty list,
        which signifies that there are no project-specific restrictions applied.

        Parameters:
        - request (HttpRequest): The client's request object.

        Returns:
        - bool: True if wildcard access is granted, False otherwise.
        """
        if not hasattr(request, 'allowed_projects'):
            return False
        # Empty list indicates wildcard access (no project restrictions)
        return request.allowed_projects == []

    def check_project_access(request, project):
        """
        Verifies if a specific project is accessible under the API key's permissions.

        This function is essential for checking individual project access based on the API key used.
        It considers both direct project permissions and wildcard access.

        Parameters:
        - request (HttpRequest): The HTTP request object.
        - project (Project): The project instance to check access against.

        Returns:
        - bool: True if the project is accessible (either directly or via wildcard), False otherwise.
        """
        if not hasattr(request, 'allowed_projects'):
            return False
        # Empty list indicates wildcard access (all projects allowed)
        if request.allowed_projects == []:
            return True
        # Check if project is in the allowed list
        return project in request.allowed_projects

    def get_organization_id(request):
        """
        Retrieves the organization ID associated with the API key in the request.

        This function is used to extract the organization ID from the request object
        for further processing or validation checks.

        Parameters:
        - request (HttpRequest): The HTTP request object containing metadata about the session.

        Returns:
        - int: The organization ID linked to the API key in the request.
        """
        if hasattr(request, 'organization_id'):
            return request.organization_id
        return -1

    def get_allowed_projects(request):
        """
        Retrieves the list of projects that the API key has access to.

        This function is used to extract the list of projects that the API key
        in the request has been validated against.

        Parameters:
        - request (HttpRequest): The HTTP request object containing metadata about the session.

        Returns:
        - list: A list of Project instances that the API key has access to.
        """
        if hasattr(request, 'allowed_projects'):
            return request.allowed_projects
        return None
