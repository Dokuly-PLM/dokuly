from rest_framework import permissions
from rest_framework_api_key.permissions import BaseHasAPIKey
from .models import OrganizationAPIKey, Project
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey


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
        # Set key validation flag to False by default
        request.key_validated = False

        # Check if the API key is valid
        has_key_permission = super().has_permission(request, view)
        # If the API key is invalid, deny access
        if not has_key_permission:
            return False

        # Extracts model type from URL conf or view kwargs
        model_type = view.kwargs.get('model_type')
        if not model_type:
            return False  # Ensures there is a model type to process

        # Extracts the API key from the request headers
        api_key = request.META.get("HTTP_AUTHORIZATION").split()[-1]
        organization_api_key = self.model.objects.get_from_key(api_key)

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
        model_class = ContentType.objects.get(model=model_type).model_class()
        model_instance = model_class.objects.get(
            pk=model_id)  # Retrieves the model instance

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
        if request.allowed_projects == [] and len(request.allowed_projects) == 0:
            return True
        return False

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
        if project in request.allowed_projects:
            return True
        if request.allowed_projects == [] and len(request.allowed_projects) == 0:
            return True
        return False

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
