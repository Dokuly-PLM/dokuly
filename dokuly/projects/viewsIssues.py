from rest_framework import status
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from .issuesModel import Issues
from parts.models import Part
from pcbas.models import Pcba
from assemblies.models import Assembly
from documents.models import Document, MarkdownText
from parts.serializers import PartSerializerWithProject
from pcbas.serializers import PcbaSerializerWithProject
from assemblies.serializers import AssemblySerializerWithProject
from documents.serializers import DocumentSerializerWithProject
from django.db.models import Q
from typing import Type, Union, Optional, Tuple
from django.db import models
from .serializers import IssuesSerializer
from django.utils import timezone
from django.contrib.auth.models import User
from profiles.utilityFunctions import (send_issue_creation_notifications,
                                       send_issue_closure_notifications,
                                       send_issue_assignee_notification,
                                       APP_TO_MODEL, ModelType, MODEL_TO_MODEL_STRING)
from projects.models import Project
from projects.viewsTags import check_for_and_create_new_tags


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def get_issue(request, issue_id):
    try:
        issue = Issues.objects.select_related('created_by', 'closed_by', 'description').get(pk=issue_id)
        serializer = IssuesSerializer(issue, many=False)
        issue_data = {}
        issue_data = serializer.data
        # Handle the related objects
        if issue.parts and len(issue.parts.all()) > 0:
            related_parts = issue.parts.all().prefetch_related('project')
            parts_serializer = PartSerializerWithProject(related_parts, many=True)
            issue_data['parts'] = parts_serializer.data
        elif issue.pcbas and len(issue.pcbas.all()) > 0:
            related_pcbas = issue.pcbas.all().prefetch_related('project')
            pcba_serializer = PcbaSerializerWithProject(related_pcbas, many=True)
            issue_data['pcbas'] = pcba_serializer.data
        elif issue.assemblies and len(issue.assemblies.all()) > 0:
            related_assemblies = issue.assemblies.all().prefetch_related('project')
            assembly_serializer = AssemblySerializerWithProject(related_assemblies, many=True)
            issue_data['assemblies'] = assembly_serializer.data
        elif issue.documents and len(issue.documents.all()) > 0:
            related_documents = issue.documents.all().prefetch_related('project')
            document_serializer = DocumentSerializerWithProject(related_documents, many=True)
            issue_data['documents'] = document_serializer.data
        return Response(issue_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def update_issue(request, issue_id):
    app, model, model_string, object_id, error_response = get_request_model_data(request)
    if error_response:
        return error_response
    try:
        data = request.data
        issue = Issues.objects.get(pk=issue_id)
        if "description" in data:
            description = data["description"]
            if issue.description:
                issue.description.text = description
                issue.description.save()
            else:
                new_markdown = MarkdownText.objects.create(text=description)
                issue.description = new_markdown
        if "closed_in" in data:
            closed_in = data["closed_in"]
            closed_in_object = model.objects.get(id=closed_in)
            connect_issue_status_to_related_object(issue, f'closed_in_{model_string}', closed_in_object)
        if "criticality" in data:
            issue.criticality = data["criticality"]
        if "title" in data:
            issue.title = data["title"]
        if "assignee" in data:
            assignee_id = data["assignee"]
            if assignee_id:
                assignee = User.objects.get(id=assignee_id)
                previous_assignee = issue.assignee
                issue.assignee = assignee
                # Send notification if assignee changed
                if previous_assignee != assignee:
                    send_issue_assignee_notification(issue, assignee, app, object_id, issue_id)
            else:
                issue.assignee = None
        if "tags" in data:
            project = None
            if issue.opened_in_assembly:
                project: Project = issue.opened_in_assembly.project
            elif issue.opened_in_document:
                project = issue.opened_in_document.project
            elif issue.opened_in_part:
                project = issue.opened_in_part.project
            elif issue.opened_in_pcba:
                project = issue.opened_in_pcba.project

            error, message, tag_ids = check_for_and_create_new_tags(project, data["tags"])
            if error:
                return Response({"error": message}, status=status.HTTP_400_BAD_REQUEST)
            issue.tags.set(tag_ids)

        issue.save()
        return Response("Updated", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def delete_issue(request, issue_id):
    try:
        issue = Issues.objects.get(pk=issue_id)
        issue.delete()
        return Response("Deleted", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST', 'PUT'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def create_new_issue(request):
    app, model, model_string, object_id, error_response = get_request_model_data(request)
    if error_response:
        return error_response

    revision_list = request.data.get('revision_list', [])
    try:
        app, model, model_string, object_id, error_response = get_request_model_data(request)
        if error_response:
            return error_response
        object = model.objects.get(id=object_id)
        current_revision = object.revision
        latest_revision = object.is_latest_revision

        issue = Issues()
        issue.criticality = "Low"
        issue.created_by = request.user
        connect_issue_status_to_related_object(issue, f'opened_in_{model_string}', object)
        issue.save()  # Need to save ID before setting m2m field
        if not latest_revision:
            subsequent_revision_ids = [
                rev['id'] for rev in revision_list if rev['revision'] > current_revision
            ]
            subsequent_revisions = model.objects.filter(id__in=subsequent_revision_ids)
            for rev in subsequent_revisions:
                add_issue_to_object(issue, f'{app}', rev)
        add_issue_to_object(issue, f'{app}', object)

        send_issue_creation_notifications(issue, object, app, object_id, user=request.user)

        return Response("Ok", status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def get_issues(request, object_id, app):
    model = APP_TO_MODEL.get(app)
    model_string = MODEL_TO_MODEL_STRING.get(model)
    try:
        object = model.objects.get(id=object_id)
        issues = get_related_object_issues(object, f'{app}_issues', app).prefetch_related(
            'tags',
            'description',
            'created_by',
            'closed_by',
            'assignee',
            f'closed_in_{model_string}'
        )
        serializer = IssuesSerializer(issues, many=True, context={'model_name': model_string})
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def close_issue(request, issue_id):
    app, model, model_string, object_id, error_response = get_request_model_data(request)
    try:
        issue = Issues.objects.get(pk=issue_id)
        issue.closed_by = request.user
        issue.closed_at = timezone.now()
        object_closed_in = model.objects.get(id=object_id)
        # REmove issues from subsequent revisions
        revision_list = request.data.get('revision_list', [])
        current_revision = object_closed_in.revision
        if len(revision_list) != 0 and not object_closed_in.is_latest_revision:
            subsequent_revision_ids = [
                rev['id'] for rev in revision_list if rev['revision'] > current_revision
            ]
            # Get subsequent revisions objects
            subsequent_revisions = model.objects.filter(id__in=subsequent_revision_ids)
            # Remove issue from subsequent revisions
            remove_issue_from_object(issue, f'{app}', subsequent_revisions)

        send_issue_closure_notifications(issue, object_closed_in, app, object_id, issue_id, user=request.user)
        connect_issue_status_to_related_object(issue, f'closed_in_{model_string}', object_closed_in)
        issue.save()
        return Response("Closed", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(['PUT'])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def reopen_issue(request, issue_id):
    app, model, model_string, object_id, error_response = get_request_model_data(request)
    try:
        issue = Issues.objects.get(pk=issue_id)
        object_instance = model.objects.get(id=object_id)
        reopen_issue_instance(issue, object_instance, app)
        issue.save()
        return Response("Reopened", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


def add_issue_to_object(instance: models.Model, field_name: str, value: models.Model):
    """
    Sets a ManyToMany field on a model instance.

    :param instance: The model instance on which the m2m field is set.
    :param field_name: The name of the m2m field to set.
    :param value: The model instance to add to the m2m field.
    """
    m2m_field = getattr(instance, field_name)
    m2m_field.add(value)


def remove_issue_from_object(instance: models.Model, field_name: str, values: list):
    """
    Removes entries from a ManyToMany field on a model instance.

    :param instance: The model instance on which the m2m field is modified.
    :param field_name: The name of the m2m field to modify.
    :param values: A list of model instances to remove from the m2m field.
    """
    m2m_field = getattr(instance, field_name)
    m2m_field.remove(*values)


def connect_issue_status_to_related_object(instance: models.Model, field_name: str, value: models.Model):
    """
    Sets a ForeignKey field on a model instance. Use for setting opened_in and closed_in fields. 
    These fields are used to connect the issue to the object where the issue was opened or closed.

    :param instance: The model instance on which the foreign key field is set.
    :param field_name: The name of the foreign key field to set.
    :param value: The model instance to set as the foreign key.
    """
    setattr(instance, field_name, value)


def get_related_object_issues(instance: models.Model, field_name: str, app: str) -> models.QuerySet:
    """
    Gets a ManyToMany field on a model instance.

    :param instance: The model instance from which the m2m field is retrieved.
    :param field_name: The name of the m2m field to retrieve.
    :return: The ManyToMany field on the model instance.
    """
    model_string = MODEL_TO_MODEL_STRING.get(APP_TO_MODEL.get(app))
    closed_in_field_name = f"closed_in_{model_string}"
    return getattr(instance, field_name).all().select_related('description', 'created_by', 'closed_by', 'assignee', closed_in_field_name)


def get_request_model_data(request) -> Tuple[Optional[str], Optional[ModelType], Optional[str], Optional[int], Optional[Response]]:
    """
    Extracts the app, model, corresponding model name, and object_id from the request data.

    :param request: The request object containing app and object_id.
    :return: A tuple containing the app, model, the model name, the object_id, and an optional Response object.
    """
    data = request.data
    app = data.get('app', None)
    object_id = data.get('object_id', None)
    model: ModelType = APP_TO_MODEL.get(app)
    model_string = MODEL_TO_MODEL_STRING.get(model)
    return app, model, model_string, object_id, None


def link_issues_on_new_object_revision(app_name, current_instance, new_instance):
    """
    Transfers open issues from the current object instance to a new revision, excluding closed issues.

    :param app_name: The name of the app handling the specific type of object.
    :param current_instance: The current model instance from which to transfer issues.
    :param new_instance: The new model instance to which issues should be added.
    """
    field_name = f"{app_name}_issues"  # Constructs the M2M field name based on app_name
    model = APP_TO_MODEL[app_name]  # Get the model class
    model_string = MODEL_TO_MODEL_STRING[model]  # Get the string representation for the model

    closed_field_name = f"closed_in_{model_string}"  # Constructs the closed field name

    current_issues = getattr(current_instance, field_name)
    new_issues = getattr(new_instance, field_name)

    # Filter and link only open issues to the new instance
    for issue in current_issues.all():
        if getattr(issue, closed_field_name) is None:  # Check if the issue is not closed
            new_issues.add(issue)

    new_instance.save()  # Save the new instance to ensure all M2M relationships are updated


def reopen_issue_instance(issue: Issues, object_instance, app: str):
    """
    Reopens a closed issue instance.

    :param issue: The issue instance to reopen.
    :param object_instance: The object instance to which the issue is connected.
    :param app: The name of the app handling the specific type of object.
    """
    model_string = MODEL_TO_MODEL_STRING.get(APP_TO_MODEL.get(app))
    closed_in_field_name = f"closed_in_{model_string}"
    opened_in_field_name = f"opened_in_{model_string}"
    issue.closed_by = None
    issue.closed_at = None
    setattr(issue, closed_in_field_name, None)
    setattr(issue, opened_in_field_name, object_instance)


def connect_model_object_to_related_object(instance: models.Model, field_name: str, value: models.Model):
    """
    Sets a ForeignKey field on a model instance. Use for setting opened_in and closed_in fields. 
    These fields are used to connect the issue to the object where the issue was opened or closed.

    :param instance: The model instance on which the foreign key field is set.
    :param field_name: The name of the foreign key field to set.
    :param value: The model instance to set as the foreign key.
    """
    setattr(instance, field_name, value)
