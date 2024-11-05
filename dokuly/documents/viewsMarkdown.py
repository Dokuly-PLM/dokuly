import uuid
from datetime import datetime

from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from django.db.models import Q
from django.contrib.auth.decorators import login_required
from django.views.decorators.clickjacking import xframe_options_exempt
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from django.shortcuts import get_object_or_404

import documents.viewUtilities as util
from documents.models import Document, MarkdownText, Document_Prefix, Reference_List
from assemblies.models import Assembly
from projects.views import check_project_access
from parts.models import Part
from documents.pdfProcessor import process_pdf, find_referenced_items
from projects.models import Project
from customers.models import Customer
from django.contrib.auth.models import User

from profiles.models import Profile
from profiles.serializers import ProfileSerializer
from profiles.utilityFunctions import create_notification
from .serializers import MarkdownTabSerializer
from rest_framework.permissions import IsAuthenticated

from profiles.utilityFunctions import APP_TO_MODEL, MODEL_TO_MODEL_STRING, ModelType
from projects.viewsIssues import get_request_model_data


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def add_markdown_notes_tab(request):
    try:
        _, model, _, object_id, error_response = get_request_model_data(request)
        if error_response:
            return error_response
        data = request.data
        markdown_text = MarkdownText.objects.create(
            text="",
            title=data.get("title", ""),
            created_by=request.user,
        )
        model_object = model.objects.get(pk=object_id)
        model_object.markdown_note_tabs.add(markdown_text)
        return Response("Markdown tab added", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(["DELETE"])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def delete_markdown_notes_tab(request, pk):
    try:
        markdown_text = MarkdownText.objects.get(pk=pk)
        markdown_text.delete()
        return Response("Deleted tab", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def edit_markdown_notes_tab(request, pk):
    try:
        markdown_text = MarkdownText.objects.get(pk=pk)
        data = request.data
        if "title" in data:
            markdown_text.title = data.get("title", "")
        if "text" in data:
            markdown_text.text = data["text"]

        markdown_text.save()
        return Response("", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(["PUT"])
@permission_classes([IsAuthenticated])
@renderer_classes([JSONRenderer])
def get_markdown_notes_tab(request):
    try:
        _, model, _, object_id, error_response = get_request_model_data(request)
        if error_response:
            return error_response
        model_object = model.objects.get(pk=object_id)
        objects_markdown_tabs = model_object.markdown_note_tabs.all()
        serializer = MarkdownTabSerializer(objects_markdown_tabs, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)
