import logging
from datetime import datetime

from purchasing.priceUtilities import copy_price_to_new_revision
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from django.db.models import Q
from django.contrib.auth.decorators import login_required
from django.core.files.base import ContentFile
from django.shortcuts import get_object_or_404


from profiles.utilityFunctions import create_notification
from .serializers import (
    BomPartSerializer,
    GlobalSearchAssemblySerializer,
    GlobalSearchPartSerializer,
    GlobalSearchPcbaSerializer,
    PartSerializer,
    PartSerializerNoAlternate,
    PartTableSerializer,
    SimplePcbaSerializer,
    SimplePartSerializer,
    SimpleAsmSerializer,
)
from assemblies.models import Assembly
from pcbas.viewUtilities import increment_revision
from documents.models import MarkdownText, Reference_List
from projects.models import Project

from organizations.views import get_subscription_type
from files.models import Image
from parts.models import Part, PartType
from part_numbers.models import PartNumber
from pcbas.models import Pcba
from part_numbers.methods import get_next_part_number

from purchasing.models import PurchaseOrder
from purchasing.suppliermodel import Supplier
from purchasing.priceModel import Price
from purchasing.serializers import PriceSerializer
from profiles.models import Profile
from profiles.views import check_user_auth_and_app_permission
from projects.models import Project
from organizations.permissions import APIAndProjectAccess
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.models import User
from django.db import transaction
from files.models import File
import json


@api_view(["POST"])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def bulk_upload_parts_auto_create_part_files(request, **kwargs):
    """
    Bulk upload parts and automatically create file objects for them
    """
    data = request.data
    parts_data = data.get('parts', [])
    project_id = data.get('projectId', None)

    user = request.user
    if APIAndProjectAccess.has_validated_key(request):
        user = data.get("userId", None)
        if user:
            try:
                user = User.objects.get(id=user)
            except User.DoesNotExist:
                print(f"User with ID {user} not found, created by will be none")

    if not parts_data:
        return Response({
            "status": "error",
            "message": "No parts provided"
        }, status=status.HTTP_400_BAD_REQUEST)

    if not project_id:
        return Response({
            "status": "error",
            "message": "Project ID is required"
        }, status=status.HTTP_400_BAD_REQUEST)

    # Cast project id to int if it's a string
    if isinstance(project_id, str):
        project_id = int(project_id)

    try:
        project = Project.objects.get(id=project_id)
    except Project.DoesNotExist:
        return Response({
            "status": "error",
            "message": f"Project with ID {project_id} not found"
        }, status=status.HTTP_404_NOT_FOUND)

    # Parse parts_data if it's a string
    if isinstance(parts_data, str):
        try:
            parts_data = json.loads(parts_data)
        except json.JSONDecodeError:
            return Response({
                "status": "error",
                "message": "Invalid JSON format for parts data"
            }, status=status.HTTP_400_BAD_REQUEST)

    errors = []
    try:
        with transaction.atomic():
            # Get or create PartTypes
            part_types = {}
            for part_data in parts_data.get("parts", []):
                try:
                    prefix = part_data.get('partPrefix', 'PRT')  # Default to 'PRT' if no prefix
                    if prefix not in part_types:
                        if prefix == "PRT":
                            # Get or create the default "PRT" part type
                            part_type, created = PartType.objects.get_or_create(
                                prefix="PRT",
                                defaults={
                                    'name': 'Standard Part',
                                    'description': 'Default part type for standard parts',
                                    'created_by': user,
                                }
                            )
                        else:
                            # Create custom part type
                            part_type, created = PartType.objects.get_or_create(
                                prefix=prefix,
                                defaults={
                                    'name': f'{prefix} Part',
                                    'description': f'Auto-created part type for prefix {prefix}',
                                    'created_by': user,
                                }
                            )
                        part_types[prefix] = part_type
                except Exception as e:
                    print(f"Error creating part type: {str(e)}")
                    errors.append(f"Error creating part type for prefix {prefix}: {str(e)}")

            # Prepare parts for bulk creation
            parts_to_create = []
            for part_data in parts_data.get("parts", []):
                try:
                    part_type = part_types[part_data.get('partPrefix', '')]
                    full_part_number = f"{part_type.prefix}{part_data.get('partNumber', 1)}"
                    parts_to_create.append(
                        Part(
                            part_number=part_data.get('partNumber', ''),
                            full_part_number=full_part_number,
                            display_name=part_data.get('displayName', ''),
                            description=part_data.get('name', ''),
                            created_by=user,
                            project=project,
                            part_type=part_type,
                            is_archived=False,
                            release_state="Draft",
                            revision="A",
                            internal=True,
                            is_latest_revision=True,
                            git_link="",
                        )
                    )
                except Exception as e:
                    print(f"Error creating part: {str(e)}")
                    errors.append(f"Error creating part {part_data.get('partPrefix', '')}{part_data.get('partNumber', '')}: {str(e)}")
                    pass

            # Bulk create parts
            created_parts = Part.objects.bulk_create(parts_to_create)

            # Create PartNumber objects with IDs matching the part numbers
            part_numbers_to_create = []
            for part in created_parts:
                try:
                    part_numbers_to_create.append(PartNumber(id=int(part.part_number)))
                except Exception as e:
                    errors.append(f"Invalid part number for part {part.part_number}")
                    pass

            # Bulk create PartNumbers, ignoring conflicts in case some already exist
            PartNumber.objects.bulk_create(part_numbers_to_create, ignore_conflicts=True)

            # Prepare files for bulk creation
            files_to_create = []
            part_file_relations = []

            for i, (part, part_data) in enumerate(zip(created_parts, parts_data.get("parts", []))):
                for j, part_file in enumerate(part_data.get('partFiles', [])):
                    try:
                        field_name = f'file_{i}_{j}'
                        if field_name in request.FILES:
                            file_content = request.FILES[field_name]
                            file_name = part_file.get("displayName", "File")[:49]
                            file_obj = File(
                                display_name=file_name,
                                project=project,
                                active=1,
                                archived=0
                            )
                            files_to_create.append(file_obj)
                            part_file_relations.append((part, file_obj, file_name, file_content))
                        else:
                            errors.append(f"File not found in request: {field_name}")
                    except Exception as e:
                        errors.append(f"Error creating file for part {part.part_number}, file index {j}: {str(e)}")
                        pass

            # Bulk create files
            created_files = File.objects.bulk_create(files_to_create)

            # Save file contents and set up many-to-many relationships
            part_file_through = Part.files.through
            part_file_through_instances = []

            for file_obj, (part, _, file_name, file_content) in zip(created_files, part_file_relations):
                try:
                    file_obj.file.save(file_name, file_content, save=True)
                    part_file_through_instances.append(
                        part_file_through(part_id=part.id, file_id=file_obj.id)
                    )
                except Exception as e:
                    errors.append(f"Error saving file content for part {part.part_number}: {str(e)}")
                    pass

            # Bulk create many-to-many relationships
            part_file_through.objects.bulk_create(part_file_through_instances)

        return Response({
            "status": "success",
            "message": "Parts and files created successfully",
            "created_parts": [part.full_part_number for part in created_parts],
            "created_files": f"Created {len(created_files)} part files",
            "errors": errors
        }, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({
            "status": "error",
            "message": str(e)
        }, status=status.HTTP_400_BAD_REQUEST)
