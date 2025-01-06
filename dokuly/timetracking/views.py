from django.db.models import Sum, F
from django.db.models.functions import Cast
from django.db.models import FloatField
from django.shortcuts import render
from rest_framework.response import Response
from rest_framework import status
from rest_framework.renderers import JSONRenderer
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from .serializers import EmployeeTimeSerializer, EmployeeTimeSerializerWithBillable, EmployeeTimeWithProjectAndTaskSerializer
from django.contrib.auth.decorators import login_required
from timetracking.models import EmployeeTime
from profiles.views import check_permissions_standard, check_permissions_admin, check_user_auth_and_app_permission
from profiles.models import Profile
from projects.models import Project, Task
from django.db.models import F, ExpressionWrapper, DateTimeField, Q
from django.utils import timezone


@api_view(['GET'])
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_last_timetrack_entry(request):
    # Grab the user object from the request
    user = request.user

    # If user is None (not authenticated), return a 401 Unauthorized response
    if user is None:
        return Response({"detail": "Unauthorized"}, status=status.HTTP_401_UNAUTHORIZED)

    try:
        # Annotate EmployeeTime queryset with a datetime_combined field
        # that sums the 'date' and 'stop_time' fields to create a DateTimeField
        # Use F class to refer to model fields in queries (for addition here)
        last_entry = EmployeeTime.objects.annotate(
            datetime_combined=ExpressionWrapper(
                F('date') + F('stop_time'),
                output_field=DateTimeField()
            )
        ).select_related(
            'project', 'task_id'
        ).filter(
            user=user
        ).exclude(
            project__isnull=True,
            task_id__isnull=True
        ).order_by(
            '-datetime_combined'
        ).first()

        if last_entry is None:
            # If no entries are found for the user, return a 204 No Content response
            return Response({"detail": "No entries found"}, status=status.HTTP_204_NO_CONTENT)

        # Serialize the entry using EmployeeTimeWithProjectAndTaskSerializer
        serializer = EmployeeTimeWithProjectAndTaskSerializer(last_entry)

        # Return serialized data with a 200 OK status
        return Response(serializer.data, status=status.HTTP_200_OK)
    except EmployeeTime.DoesNotExist:
        # If no entries are found for the user, return a 204 No Content response
        return Response({"detail": "No entries found"}, status=status.HTTP_204_NO_CONTENT)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
def get_timetrackings(request, year_from, year_to):
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "timesheet")
    if not permission:
        return response
    if not check_permissions_admin(user):
        if year_from != year_to:
            return Response(EmployeeTimeSerializer(EmployeeTime.objects.filter(user__pk=user.id, date__year__range=(year_from, year_to)), many=True).data, status=status.HTTP_200_OK)
        return Response(EmployeeTimeSerializer(EmployeeTime.objects.filter(user__pk=user.id, date__year=year_from), many=True).data, status=status.HTTP_200_OK)
    if year_from != year_to:
        return Response(EmployeeTimeSerializer(EmployeeTime.objects.filter(date__year__range=(year_from, year_to)), many=True).data, status=status.HTTP_200_OK)
    return Response(EmployeeTimeSerializer(EmployeeTime.objects.filter(date__year=year_from), many=True).data, status=status.HTTP_200_OK)


@api_view(('GET',))
@renderer_classes((JSONRenderer,))
@permission_classes((IsAuthenticated,))
def get_time_records_by_project_tasks(request, project_id):
    """Return the total time for all tasks in a project."""
    user = request.user

    # All users shall be able to see the anonymized time for project tasks.
    permission, response = check_user_auth_and_app_permission(request, "projects")
    if not permission:
        return response

    project_time_records = EmployeeTime.objects.filter(project_id=project_id).filter(
        Q(project__project_members=user) | Q(project__isnull=True)
    )

    task_times = project_time_records.values('task_id').annotate(
        accumulated_time_hours=Sum(Cast(F('hour'), FloatField()))
    ).order_by('task_id')

    # Format the result as an array of dictionaries
    result = [{'task_id': item['task_id'], 'accumulated_time_hours': item['accumulated_time_hours']} for item in task_times]

    return Response(result, status=status.HTTP_200_OK)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
def get_time_record_by_user_and_year(request, year):
    """Returns all records by a single user.
    Speedup the request by specifying a year.
    """
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "timesheet")
    if not permission:
        return response
    authorized = check_permissions_standard(user)
    if not authorized:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    time_records = EmployeeTime.objects.filter(
        user__pk=user.id, date__year=year)

    serializer = EmployeeTimeSerializerWithBillable(time_records, many=True)
    data = serializer.data

    return Response(data, status=status.HTTP_200_OK)
    # return Response("No data found", status=status.HTTP_400_BAD_REQUEST)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
@permission_classes((IsAuthenticated,))
def get_time_record_by_user_and_week(request, isoWeek, year):
    """Returns all records by a single user.
    Speedup the request by specifying a year.
    """
    try:
        user = request.user
        permission, response = check_user_auth_and_app_permission(request, "timesheet")
        if not permission:
            return response

        time_records = EmployeeTime.objects.filter(
            user__pk=user.id,
            date__week=isoWeek,
            date__year=year
        ).prefetch_related('project', 'task_id')

        serializer = EmployeeTimeSerializerWithBillable(time_records, many=True)
        data = serializer.data
        return Response(data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response("No data found", status=status.HTTP_400_BAD_REQUEST)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
def get_time_record_by_user(request):
    """Returns all records by a single user.
    """
    print(request.user)
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "timesheet")
    if not permission:
        return response
    authorized = check_permissions_standard(user)
    if not authorized:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    time_records = EmployeeTime.objects.filter(user__pk=user.id)

    serializer = EmployeeTimeSerializer(time_records, many=True)
    data = serializer.data

    # TODO attach customer name to the data, such that a front-end map is not necessary.

    return Response(data, status=status.HTTP_200_OK)
    # return Response("No data found", status=status.HTTP_400_BAD_REQUEST)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
def get_time_record(request, id):
    """Returns a single recorded time record.
    """
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "timesheet")
    if not permission:
        return response
    authorized = check_permissions_standard(user)
    if not authorized:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    time_record = EmployeeTime.objects.get(pk=id)

    time_record_dict = {
        "id":       time_record.id,
        "date":     time_record.date,
        "start_time": time_record.start_time,
        "stop_time": time_record.stop_time,
        "task":     time_record.task,          # Legacy field
        "comment":  time_record.comment,
        "hour":     time_record.hour,
    }

    if time_record.project != None:
        time_record_dict["project"] = time_record.project.id

        if time_record.project.customer != None:
            time_record_dict["customer"] = time_record.project.customer.id,
            time_record_dict["customer_name"] = time_record.project.customer.name,

    if time_record.user != None:
        time_record_dict["user"] = time_record.user.id
    # Legacy time records don't have task field populated.
    if time_record.task_id != None:
        time_record_dict["task_id"] = time_record.task_id.id

    return Response(time_record_dict, status=status.HTTP_200_OK)
    # return Response("No data found", status=status.HTTP_400_BAD_REQUEST)


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
def set_time_record(request):
    """Create or edit a single time record.
    Upon creation, the user is filled based on the request user.
    """
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "timesheet")
    if not permission:
        return response
    authorized = check_permissions_standard(user)
    if not authorized:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    data = request.data
    if 'id' in data:
        if data['id'] == -1:
            time_record = EmployeeTime()
            time_record.user = request.user
            if "project_id" in data:
                obj = Project.objects.get(id=int(data["project_id"]))
                time_record.project = obj
            if "task_id" in data:
                obj = Task.objects.get(id=int(data["task_id"]))
                time_record.task_id = obj
            if "task" in data:
                time_record.task = data["task"]
            if "date" in data:
                time_record.date = data["date"]
            if "start_time" in data:
                time_record.start_time = data["start_time"]
            if "stop_time" in data:
                if data["stop_time"] != "" and data["stop_time"] != None:
                    time_record.stop_time = data["stop_time"]
            if "comment" in data:
                time_record.comment = data["comment"]
            if "hour" in data:
                time_record.hour = data["hour"]
            time_record.save()
            return Response("Timetracking created", status=status.HTTP_201_CREATED)
        else:
            time_record = EmployeeTime.objects.get(pk=data["id"])
            if "project_id" in data:
                obj = Project.objects.get(id=int(data["project_id"]))
                time_record.project = obj
            if "task_id" in data:
                obj = Task.objects.get(id=int(data["task_id"]))
                time_record.task_id = obj
            if "task" in data:
                time_record.task = data["task"]
            if "date" in data:
                time_record.date = data["date"]
            if "start_time" in data:
                time_record.start_time = data["start_time"]
            if "stop_time" in data:
                if data["stop_time"] != "" and data["stop_time"] != None:
                    time_record.stop_time = data["stop_time"]
            if "comment" in data:
                time_record.comment = data["comment"]
            if "hour" in data:
                time_record.hour = data["hour"]
            time_record.save()
            return Response("Timetracking updated", status=status.HTTP_202_ACCEPTED)
    else:
        return Response("No id value sent, check request payload", status=status.HTTP_400_BAD_REQUEST)
    # return Response("No data found", status=status.HTTP_400_BAD_REQUEST)


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
def start_clone_time_record(request, id):
    """When a new time record is started based on an old id.
    Date, start_time can be passed through the 'data' field.
    """
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "timesheet")
    if not permission:
        return response
    authorized = check_permissions_standard(user)
    if not authorized:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    data = request.data
    time_record = None

    time_record = EmployeeTime.objects.get(pk=id)

    # Remove id to save a a new record.
    time_record.id = None
    time_record.hour = 0.0

    if "start_time" in data:
        time_record.start_time = data["start_time"]
        time_record.stop_time = data["start_time"]
    if "date" in data:
        time_record.date = data["date"]

    time_record.save()

    return Response(status=status.HTTP_201_CREATED)
    # return Response("No data found", status=status.HTTP_400_BAD_REQUEST)


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
def delete_time_record(request, id):
    """Returns a single recorded time record.
    """
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "timesheet")
    if not permission:
        return response

    # TODO somehow getting AnonymousUser when using this view?
    # authorized = check_permissions_standard(user)
    # if not authorized:
    #    return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    try:
        instance = EmployeeTime.objects.get(id=id)
        instance.delete()

        return Response("Time record deleted.", status=status.HTTP_200_OK)
    except:
        return Response("No data found", status=status.HTTP_400_BAD_REQUEST)
