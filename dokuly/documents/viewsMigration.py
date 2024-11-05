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
from documents.models import Document, Document_Prefix, Reference_List
from assemblies.models import Assembly
from projects.views import check_project_access
from parts.models import Part
from documents.pdfProcessor import process_pdf, find_referenced_items
from projects.models import Project
from customers.models import Customer
from django.contrib.auth.models import User

from profiles.models import Profile
from profiles.serializers import ProfileSerializer
from organizations.models import Organization
from profiles.utilityFunctions import create_notification
from .serializers import DocumentSerializer, DocumentTableSerializer
from django.http import FileResponse
from rest_framework_api_key.permissions import HasAPIKey
from rest_framework.permissions import IsAuthenticated
from organizations.permissions import APIAndProjectAccess
from documents.views import increment_document_number
from projects.models import Project
from customers.models import Customer
from profiles.views import (
    check_permissions_access,
    check_permissions_ownership,
    check_permissions_standard,
    check_authentication,
    check_user_auth_and_app_permission,
)

import files.views as fileViews
from .viewUtilities import (
    assemble_full_document_number,
    assemble_full_document_number_no_prefix_db_call,
)
from pcbas.viewUtilities import increment_revision
from django.db.models import F, Case, When, Value, CharField
from django.db import transaction
import re
import json


import os
from django.core.files import File as DjangoFile


@api_view(["POST"])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def bulk_upload_documents(request, **kwargs):
    """
    Bulk upload documents
    """
    data = request.data
    documents_data = data.get('documents', [])
    project_id = data.get('projectId', None)
    customer_id = data.get('customerId', None)

    user = request.user
    if APIAndProjectAccess.has_validated_key(request):
        user = data.get("userId", None)
        if user:
            try:
                user = User.objects.get(id=user)
            except User.DoesNotExist:
                print(f"User with ID {user} not found, created by will be none")

    if not project_id:
        print("Project ID is required")
        return Response({
            "status": "error",
            "message": "Project ID is required"
        }, status=status.HTTP_400_BAD_REQUEST)

    if not customer_id:
        print("Customer ID is required")
        return Response({
            "status": "error",
            "message": "Customer ID is required"
        }, status=status.HTTP_400_BAD_REQUEST)

    document_prefix = Document_Prefix.objects.all().first()
    if not document_prefix:
        # Create a default document prefix if none exists
        document_prefix = Document_Prefix.objects.create(
            prefix="TN",
            display_name="Technical Note",
        )

    # Check if project_id is string
    if isinstance(project_id, str):
        project_id = int(project_id)

    project = get_object_or_404(Project, id=project_id)

    # Check if customer_id is string
    if isinstance(customer_id, str):
        customer_id = int(customer_id)

    customer = get_object_or_404(Customer, id=customer_id)

    errors = []

    # Parse documents_data if it's a string
    if isinstance(documents_data, str):
        try:
            documents_data = json.loads(documents_data)
        except json.JSONDecodeError:
            print("Invalid JSON format for documents data")
            return Response({
                "status": "error",
                "message": "Invalid JSON format for documents data"
            }, status=status.HTTP_400_BAD_REQUEST)

    # Handle nested keys
    if "documents" in documents_data:
        documents_data = documents_data.get('documents', [])

    try:
        with transaction.atomic():
            # Get all required parts in one query
            part_numbers = set(int(doc.get("partNumber", "0")) for doc in documents_data)
            parts = {int(part.part_number): part for part in Part.objects.filter(part_number__in=part_numbers)}

            # Prepare documents for bulk creation
            documents_to_create = []
            document_part_mapping = []

            document_number = increment_document_number(project_id)
            for i, doc_data in enumerate(documents_data):
                try:
                    # Clean up the file name to use as title
                    display_name = doc_data.get('displayName', f"Auto Generated Document {i + 1}")
                    title = re.sub(r'\.[^.]+$', '', display_name)  # Remove file extension
                    title = title.replace('_', ' ')  # Replace underscores with spaces
                    # Generate description
                    if 'partNumber' in doc_data:
                        description = f"Document for part PRT{doc_data['partNumber']}"
                    else:
                        description = "Auto Generated via API migration"

                    document = Document(
                        title=title,
                        full_doc_number=f"{document_prefix.prefix}{customer.customer_id}{project.project_number}-{document_number}A",  # Revision A
                        description=description,
                        created_by=user,
                        project=project,
                        revision='A',
                        is_latest_revision=True,
                        release_state='Draft',
                        prefix_id=document_prefix.id,
                        document_number=document_number,
                        document_type=f"{document_prefix.prefix}"
                    )

                    document_number += 1

                    # Handle file upload
                    field_name = f'file_{i}'
                    if field_name in request.FILES:
                        file_obj = request.FILES[field_name]
                        file_extension = os.path.splitext(file_obj.name)[1].lower()

                        # Check file size
                        if not fileViews.check_file_sizes_vs_limit(
                            Organization.objects.first(), file_obj.size, request
                        ):
                            return Response("Storage full!", status=status.HTTP_409_CONFLICT)

                        # Generate UUID for file path
                        file_uuid = uuid.uuid4().hex
                        file_path = f"{file_uuid}/{file_obj.name}"

                        if file_extension == '.zip':
                            document.zip_file.save(file_path, file_obj, save=False)
                        elif file_extension == '.pdf':
                            document.pdf_raw.save(file_path, file_obj, save=False)
                        else:
                            document.document_file.save(file_path, file_obj, save=False)

                    documents_to_create.append(document)

                    # Add to document-part mapping
                    part_number = doc_data.get('partNumber', None)
                    try:
                        if part_number:
                            document_part_mapping.append((document, int(part_number)))
                    except Exception as e:
                        print(f"Error adding document to part mapping: {str(e)}")
                        errors.append(f"Error adding document to part mapping: {str(e)}")
                        pass

                except Exception as e:
                    print(f"Error creating document: {str(e)}")
                    errors.append(f"Error creating document {doc_data.get('displayName', f'Auto Generated Document {i}')}: {str(e)}")
                    pass

            print("Documents to create:", len(documents_to_create))

            # Bulk create documents
            created_documents = Document.objects.bulk_create(documents_to_create)

            # Update parts_to_update with actual document IDs
            parts_to_update = {}
            for document, part_number in document_part_mapping:
                try:
                    part = parts.get(part_number)
                    if part:
                        if part.id not in parts_to_update:
                            parts_to_update[part.id] = {
                                'part': part,
                                'doc_ids': []
                            }
                        parts_to_update[part.id]['doc_ids'].append(document.pk)
                except Exception as e:
                    print(f"Error updating parts: {str(e)}")
                    errors.append(f"Error updating parts for document {document.title}: {str(e)}")
                    pass

            # Update parts' reference lists
            try:
                for part_data in parts_to_update.values():
                    part: Part = part_data['part']
                    reference_list = None
                    if part.reference_list_id == -1:
                        # Create a new Reference_List if it doesn't exist
                        reference_list = Reference_List.objects.create()
                        part.reference_list_id = reference_list.id
                    else:
                        reference_list = Reference_List.objects.get(id=part.reference_list_id)

                    if reference_list:
                        # Add the new document IDs to the reference list
                        reference_list.reference_doc_ids.extend(part_data['doc_ids'])
                        for _ in part_data['doc_ids']:
                            reference_list.is_specification.append(False)
                        # Save the updated part
                        reference_list.save()
                        part.save()
            except Exception as e:
                print(f"Error updating reference lists: {str(e)}")
                errors.append(f"Error updating reference lists: {str(e)}")
                pass

        # Update organization's storage size
        fileViews.update_org_current_storage_size(request)

        return Response({
            "status": "success",
            "message": "Documents created and parts updated successfully",
            "created_documents": [doc.title for doc in created_documents],
            "errors": errors
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        print(str(e))
        return Response({
            "status": "error",
            "message": str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
