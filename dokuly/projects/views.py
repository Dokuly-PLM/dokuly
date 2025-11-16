from django.contrib.auth.decorators import login_required
from django.contrib.postgres.search import SearchVector
from django.db.models import Q
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from django.shortcuts import get_object_or_404

from profiles.serializers import ProfileSerializer
from accounts.serializers import UserSerializer, UserSerializerWithProfile
from profiles.utilityFunctions import create_notification
from .models import Project, Task, Gantt
from .serializers import ProjectSerializer, ProjectSerializerWithCustomer
from profiles.views import check_permissions_standard
from django.contrib.auth.models import User
from profiles.models import Profile
from customers.models import Customer
from organizations.models import Organization
from profiles.views import check_permissions_ownership, check_permissions_standard, check_permissions_admin, check_user_auth_and_app_permission
from organizations.views import get_subscription_type
from django.db.models.query import QuerySet
from rest_framework.permissions import IsAuthenticated
from organizations.permissions import APIAndProjectAccess


def check_project_access(queryset: QuerySet, user: User) -> bool:
    """
    Check if the user has access to any objects in the given queryset.
    :param queryset: A Django queryset representing objects to be checked for access.
    :param user: The user for whom access is being checked.
    :return: True if the user has access to at least one object in the queryset, False otherwise.
    """
    return queryset.filter(
        Q(project__project_members=user) | Q(project__isnull=True)
    ).exists()


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
def get_project(request, project_id):
    """Returns a single project."""
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "projects")
    if not permission:
        return response

    # Use select_related for the customer relationship to optimize query
    project = get_object_or_404(Project.objects.select_related('customer', 'project_owner'), pk=project_id, project_members=user)

    # Use the serializer that includes customer data
    serializer = ProjectSerializerWithCustomer(project)

    data = serializer.data
    if data and "customer" in data and data["customer"]:
        fullNumber = f"{data['customer']['customer_id']}{data['project_number']}"
        data["full_number"] = fullNumber
        data["customer_name"] = data['customer']['name']

    return Response(data, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
def get_project_with_customer(request, project_id):
    """Returns a single project."""
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "projects")
    if not permission:
        return response
    # TODO: Should add prefetch_related here, or serializer will be slow
    project = get_object_or_404(Project, pk=project_id, project_members=user)
    serializer = ProjectSerializerWithCustomer(project, many=False)
    return Response(serializer.data, status=status.HTTP_200_OK)


def get_next_project_number(all_cutsomer_projects):
    """Increment project number."""
    if len(all_cutsomer_projects) == 0:
        return 100

    highest_number = 99
    for project in all_cutsomer_projects:
        if project.project_number == None:
            continue

        if highest_number < project.project_number:
            highest_number = project.project_number

    return highest_number + 1


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def new_project(request):
    try:
        user = request.user
        permission, response = check_user_auth_and_app_permission(request, "projects")
        if not permission:
            return response
        type = get_subscription_type(request.user, request)
        if type == "Free":
            if Project.objects.count() > 1:
                return Response(
                    "Cannot create, upgrade account", status=status.HTTP_406_NOT_ACCEPTABLE
                )
        data = request.data
        if data == None:
            res = Project.objects.exclude(is_archived=True)
            serializer = ProjectSerializer(res, many=True)
            return Response(serializer.data, status=status.HTTP_400_BAD_REQUEST)

        currentProjects = Project.objects.filter(customer__id=data["customer"])

        project = Project()
        project.id = None
        project.title = data["title"]
        project.customer_id = data["customer"]
        project.description = data["description"]
        project.project_number = get_next_project_number(currentProjects)
        project.is_active = True
        project.project_owner = Profile.objects.get(user=user)
        
        # Automatically set the organization from the user's profile
        try:
            user_profile = Profile.objects.get(user=user)
            if user_profile.organization_id and user_profile.organization_id != -1:
                project.organization = Organization.objects.get(id=user_profile.organization_id)
        except (Profile.DoesNotExist, Organization.DoesNotExist):
            pass

        if "start_date" in data:
            project.start_date = data["start_date"]
        if "estimated_work_hours" in data:
            project.estimated_work_hours = data["estimated_work_hours"]
        if "project_contact" in data:
            project.project_contact = Profile.objects.get(id=data["project_contact"])
        project.save()

        project.project_members.add(user)

        # Create default task on new project creation.
        other_task = Task()
        other_task.title = "Other"
        other_task.is_active = True
        other_task.is_billable = False
        other_task.is_archived = False
        other_task.project_id = project.id
        other_task.save()

        serializer = ProjectSerializer(project, many=False)
        allProjects = Project.objects.filter(is_archived=False)
        serializer2 = ProjectSerializer(allProjects, many=True)
        res = [serializer.data, serializer2.data]
        return Response(res, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(("PUT", "POST"))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def edit_project(request, projectId):
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "projects")
    if not permission:
        return response
    data = request.data
    if "updateOwner" in data:
        if data["updateOwner"] == True:
            project = Project.objects.get(id=projectId)
            project_owner = Profile.objects.get(id=request.data["project_owner"])
            project.project_owner = project_owner
            if project_owner.notify_user_on_became_project_owner and user != project.project_owner:
                create_notification(
                    project_owner.user,
                    f"New project owner of {project.title}",
                    f"/projects/{project.id}/",
                    "Project",
                )
            project.save()
            return Response("Project owner updated", status=status.HTTP_200_OK)

    if request.data == None or projectId == None:
        res = Project.objects.filter(is_archived=True)
        serializer = ProjectSerializer(res, many=True)
        return Response(serializer.data, status=status.HTTP_400_BAD_REQUEST)
    project = Project.objects.get(id=projectId)
    serializer = ProjectSerializer(project, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        projects = Project.objects.filter(is_archived=False)
        archived = Project.objects.filter(is_archived=True)
        serializerProject = ProjectSerializer(projects, many=True)
        serializerArchived = ProjectSerializer(archived, many=True)
        if len(serializerProject.data) != 0:
            data = [serializer.data, serializerProject.data, serializerArchived.data]
            return Response(data, status=status.HTTP_200_OK)
        return Response(serializer.data, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def admin_get_projects_with_project_number(request):
    """Returns all unarchived projects. ADMIN VIEW WITH ALL PROJECTS UNFILTERED!"""
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "projects")
    if not permission:
        return response
    check = check_permissions_admin(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    projects = Project.objects.exclude(is_archived=True)
    serializerProject = ProjectSerializer(projects, many=True)
    customers = Customer.objects.all()

    if len(serializerProject.data) != 0:
        for project in serializerProject.data:
            if project["customer"] != None and project["customer"] != "":
                try:
                    customer = next(
                        (x for x in customers if x.id == project["customer"]), None
                    )
                    # customer = Customer.objects.get(pk=project['customer'])
                    fullNumber = str(customer.customer_id) + str(
                        project["project_number"]
                    )
                    project["full_number"] = fullNumber
                    project["customer_name"] = customer.name
                except Customer.DoesNotExist:
                    customer = ""
        return Response(serializerProject.data, status=status.HTTP_200_OK)
    return Response("No data found", status=status.HTTP_400_BAD_REQUEST)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_projects_with_project_number(request):
    """Returns all unarchived projects."""
    user = request.user
    if user is None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    projects = Project.objects.filter(project_members=user).exclude(is_archived=True)
    serializerProject = ProjectSerializer(projects, many=True)
    customers = Customer.objects.all()

    if len(serializerProject.data) != 0:
        for project in serializerProject.data:
            if project["customer"] != None and project["customer"] != "":
                try:
                    customer = next(
                        (x for x in customers if x.id == project["customer"]), None
                    )
                    # customer = Customer.objects.get(pk=project['customer'])
                    fullNumber = str(customer.customer_id) + str(
                        project["project_number"]
                    )
                    project["full_number"] = fullNumber
                    project["customer_name"] = customer.name
                except Customer.DoesNotExist:
                    customer = ""
        return Response(serializerProject.data, status=status.HTTP_200_OK)
    return Response("No data found", status=status.HTTP_400_BAD_REQUEST)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def admin_get_archived(request):
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "projects")
    if not permission:
        return response
    projects = Project.objects.filter(is_archived=True)
    serializerProject = ProjectSerializer(projects, many=True)
    if len(serializerProject.data) != 0:
        return Response(serializerProject.data, status=status.HTTP_200_OK)
    return Response("No data found", status=status.HTTP_204_NO_CONTENT)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
def get_project_name(request, projectId):
    """View for fetching the name of a project based on ID, only if the user is a member of the project."""
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "projects")
    if not permission:
        return response

    # Validate projectId
    if projectId <= 0:
        name_dict = {"project_name": ""}
        return Response(name_dict, status=status.HTTP_200_OK)

    try:
        # Retrieve the project if the user is a member
        project = get_object_or_404(Project, id=projectId, project_members=user)
        name_dict = {"project_name": project.title}
        return Response(name_dict, status=status.HTTP_200_OK)
    except:
        return Response("No project found", status=status.HTTP_204_NO_CONTENT)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
def get_active_projects_by_cystomer(request, customerId):
    """Returns all active unarchived projects for a customer."""
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "projects")
    if not permission:
        return response

    if customerId <= 0:
        return Response(
            f"Error: customer id {customerId} is invalid!",
            status=status.HTTP_400_BAD_REQUEST,
        )

    try:
        projects = (
            Project.objects.filter(customer=customerId, project_members=user)
            .exclude(is_active=False)
            .exclude(is_archived=True)
        )
        project_array = []
        for idx, item in enumerate(projects):
            name_dict = {"id": item.id, "title": item.title}
            project_array.append(name_dict)

        return Response(project_array, status=status.HTTP_200_OK)
    except:
        return Response("No project found", status=status.HTTP_204_NO_CONTENT)


# TODO possible speedup by using a custom serializer.


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def get_projects_by_customer(request, customerId, **kwargs):
    """Returns all projects for a customer that is unarchived."""
    user = request.user

    if customerId <= 0:
        return Response(
            f"Error: customer id {customerId} is invalid!",
            status=status.HTTP_400_BAD_REQUEST,
        )

    if APIAndProjectAccess.has_validated_key(request):
        if not APIAndProjectAccess.check_wildcard_access(request):
            allowed_projects = APIAndProjectAccess.get_allowed_projects(request)
            projects = Project.objects.filter(id__in=allowed_projects)
        else:
            projects = Project.objects.filter(customer=customerId)
        project_array = []
        for item in projects:
            name_dict = {"id": item.id, "title": item.title}
            project_array.append(name_dict)
        return Response(project_array, status=status.HTTP_200_OK)

    try:
        projects = Project.objects.filter(
            customer=customerId, project_members=user
        ).exclude(is_archived=True)
        project_array = []
        for item in projects:
            name_dict = {"id": item.id, "title": item.title}
            project_array.append(name_dict)

        return Response(project_array, status=status.HTTP_200_OK)
    except:
        return Response("No project found", status=status.HTTP_204_NO_CONTENT)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def add_user_to_project(request, project_id, user_id):
    user = request.user
    if user is None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    if not check_permissions_standard(user):
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    try:
        project = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return Response("Project not found", status=status.HTTP_404_NOT_FOUND)

    try:
        user_to_add = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response("User not found", status=status.HTTP_404_NOT_FOUND)

    # Add user to the project
    project.project_members.add(user_to_add)

    if user != user_to_add:
        create_notification(
            user_to_add,
            f"New project access to {project.title}",
            f"/projects/{project.id}/",
            "Project",
        )

    # Serialize and return the updated project
    serializer = ProjectSerializer(project)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def remove_user_from_project(request, project_id, user_id):
    user = request.user
    if user is None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    if not check_permissions_standard(user):
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    try:
        project = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return Response("Project not found", status=status.HTTP_404_NOT_FOUND)

    try:
        user_to_remove = User.objects.get(pk=user_id)
    except User.DoesNotExist:
        return Response("User not found", status=status.HTTP_404_NOT_FOUND)

    # Remove user from the project
    if user_to_remove in project.project_members.all():
        project.project_members.remove(user_to_remove)
    else:
        return Response(
            "User is not a member of the project", status=status.HTTP_400_BAD_REQUEST
        )

    # Serialize and return the updated project
    serializer = ProjectSerializer(project)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def get_project_users(request, project_id):
    user = request.user
    if user is None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    if not check_permissions_standard(user):
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    try:
        project = Project.objects.get(pk=project_id)
    except Project.DoesNotExist:
        return Response("Project not found", status=status.HTTP_404_NOT_FOUND)

    users = project.project_members.filter(profile__is_active=True).select_related("profile")

    serializer = UserSerializerWithProfile(users, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
