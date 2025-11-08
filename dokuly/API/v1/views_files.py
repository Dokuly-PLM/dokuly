"""
API v1 file upload and download views for Parts, Assemblies, and PCBAs.
These views are specifically designed for external API access with API key authentication.
"""
from django.http import FileResponse, HttpResponse, StreamingHttpResponse
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer, BaseRenderer
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi
import zipfile
import io
import os


class BinaryFileRenderer(BaseRenderer):
    """Renderer for binary file responses (ZIP files, etc.)"""
    media_type = 'application/zip'
    format = 'zip'
    
    def render(self, data, media_type=None, renderer_context=None):
        # If data is already bytes (HttpResponse content), return it
        if isinstance(data, bytes):
            return data
        # If it's an HttpResponse, extract the content
        if isinstance(data, HttpResponse):
            return data.content
        return data

from organizations.permissions import APIAndProjectAccess
from files.models import File
from files.views import check_file_sizes_vs_limit, get_organization_by_user_id, get_organization_by_id
from parts.models import Part
from assemblies.models import Assembly
from pcbas.models import Pcba
import uuid


def str_to_bool(value):
    """Convert string to boolean."""
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.lower() in ('true', '1', 'yes', 'on')
    return bool(value)


# ==================== PARTS FILE OPERATIONS ====================

@swagger_auto_schema(
    method='post',
    operation_id='upload_file_to_part',
    operation_description="""
    Upload a file to a part.
    
    **Required fields:**
    - `file`: The file to upload (multipart/form-data)
    - `display_name`: Name for the file (max 250 characters)
    
    **Optional fields:**
    - `replace_files`: Set to `true` to replace existing file with same display_name. Default: `false`
    
    **Note:** The part must not be in "Released" state to upload files.
    """,
    tags=['parts'],
    manual_parameters=[
        openapi.Parameter(
            'file',
            openapi.IN_FORM,
            type=openapi.TYPE_FILE,
            required=True,
            description='The file to upload (any file type)'
        ),
        openapi.Parameter(
            'display_name',
            openapi.IN_FORM,
            type=openapi.TYPE_STRING,
            required=True,
            description='Display name for the file (max 250 characters)',
            max_length=250
        ),
        openapi.Parameter(
            'replace_files',
            openapi.IN_FORM,
            type=openapi.TYPE_BOOLEAN,
            required=False,
            description='If true, replace existing file with same display_name. Default: false'
        ),
    ],
    consumes=['multipart/form-data'],
    responses={
        201: openapi.Response(description='File uploaded successfully'),
        400: openapi.Response(description='Bad request - missing required fields, part is released, or invalid data'),
        401: openapi.Response(description='Unauthorized - invalid API key or no project access'),
        404: openapi.Response(description='Part not found'),
        409: openapi.Response(description='Storage limit exceeded'),
    },
    security=[{'Token': []}, {'Api-Key': []}]
)
@api_view(['POST'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def upload_file_to_part(request, part_id, **kwargs):
    """
    Upload a file to a part.
    
    Request must be multipart/form-data with:
    - file: The file to upload (required)
    - display_name: Name for the file (required, max 250 chars)
    - replace_files: Boolean, if true replaces existing file with same name (optional)
    """
    if "file" not in request.data:
        return Response(
            {"error": "Missing required field: 'file'"},
            status=status.HTTP_400_BAD_REQUEST
        )

    file = request.FILES.get("file")
    if file is None:
        return Response(
            {"error": "Invalid file - file is null"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check storage limits
    if APIAndProjectAccess.has_validated_key(request):
        org_id = APIAndProjectAccess.get_organization_id(request)
        if not check_file_sizes_vs_limit(get_organization_by_id(org_id), file.size, request):
            return Response(
                {"error": "Storage limit exceeded"},
                status=status.HTTP_409_CONFLICT
            )
    else:
        if not check_file_sizes_vs_limit(get_organization_by_user_id(request), file.size, request):
            return Response(
                {"error": "Storage limit exceeded"},
                status=status.HTTP_409_CONFLICT
            )

    data = request.data
    if "display_name" not in data:
        return Response(
            {"error": "Missing required field: 'display_name'"},
            status=status.HTTP_400_BAD_REQUEST
        )

    display_name = data["display_name"][:250]  # Enforce max length
    replace_files = str_to_bool(data.get("replace_files", False))

    try:
        part = Part.objects.get(pk=part_id)
        
        # Check project access for API key requests
        if APIAndProjectAccess.has_validated_key(request):
            if not APIAndProjectAccess.check_project_access(request, part.project.pk):
                return Response(
                    {"error": "Not authorized - no access to this project"},
                    status=status.HTTP_401_UNAUTHORIZED
                )

        if part.release_state == "Released":
            return Response(
                {"error": "Cannot upload files to a released part"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if replace_files:
            # Find and replace existing file with same display_name
            existing_files = part.files.filter(display_name=display_name)
            if existing_files.exists():
                existing_file = existing_files.first()
                if existing_file.file:
                    existing_file.file.delete(save=False)
                existing_file.file.save(f"{uuid.uuid4().hex}/{file.name}", file)
                existing_file.save()
                file_obj = existing_file
            else:
                # Create new file if no existing file to replace
                new_file = File.objects.create(display_name=display_name)
                new_file.file.save(f"{uuid.uuid4().hex}/{file.name}", file)
                new_file.project = part.project
                new_file.save()
                part.files.add(new_file)
                file_obj = new_file
        else:
            # Create new file
            new_file = File.objects.create(display_name=display_name)
            new_file.file.save(f"{uuid.uuid4().hex}/{file.name}", file)
            new_file.project = part.project
            new_file.save()
            part.files.add(new_file)
            file_obj = new_file

        part.save()
        return Response(
            {"message": "File uploaded successfully", "file_id": file_obj.id},
            status=status.HTTP_201_CREATED
        )
    except Part.DoesNotExist:
        return Response(
            {"error": "Part not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@swagger_auto_schema(
    method='get',
    operation_id='download_files_from_part',
    operation_description="""
    Download all files attached to a part as a ZIP archive.
    
    Returns a ZIP file containing all files attached to the part. The download count for each file is automatically incremented.
    """,
    tags=['parts'],
    produces=['application/zip'],
    responses={
        200: openapi.Response(
            description='ZIP file with all part files downloaded successfully',
            schema=openapi.Schema(
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_BINARY
            ),
            headers={
                'Content-Disposition': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Attachment filename'
                )
            }
        ),
        401: openapi.Response(description='Unauthorized - invalid API key or no project access'),
        404: openapi.Response(description='Part not found'),
    },
    security=[{'Token': []}, {'Api-Key': []}]
)
@api_view(['GET'])
@renderer_classes([BinaryFileRenderer])  # Use binary renderer for ZIP files
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def download_files_from_part(request, part_id, **kwargs):
    """
    Download all files attached to a part as a ZIP archive.
    """
    try:
        part = Part.objects.get(pk=part_id)
        
        # Check project access for API key requests
        if APIAndProjectAccess.has_validated_key(request):
            if not APIAndProjectAccess.check_project_access(request, part.project.pk):
                return Response(
                    {"error": "Not authorized - no access to this project"},
                    status=status.HTTP_401_UNAUTHORIZED
                )

        # Get all files for this part
        files = part.files.filter(file__isnull=False).exclude(file='')
        
        if not files.exists():
            return Response(
                {"error": "No files found for this part"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Create ZIP file in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file_obj in files:
                if file_obj.file:
                    try:
                        # Read file content
                        file_obj.file.open('rb')
                        file_content = file_obj.file.read()
                        file_obj.file.close()
                        
                        # Get filename - prefer display_name but ensure it has extension
                        if file_obj.display_name:
                            # Check if display_name already has an extension
                            if os.path.splitext(file_obj.display_name)[1]:
                                filename = file_obj.display_name
                            else:
                                # No extension in display_name, get it from the actual file
                                _, ext = os.path.splitext(os.path.basename(file_obj.file.name))
                                filename = file_obj.display_name + (ext if ext else '')
                        else:
                            # No display_name, use the actual file name
                            filename = os.path.basename(file_obj.file.name)
                        
                        # Ensure unique filenames in ZIP
                        zip_path = filename
                        counter = 1
                        while zip_path in zip_file.namelist():
                            name, ext = os.path.splitext(filename)
                            zip_path = f"{name}_{counter}{ext}"
                            counter += 1
                        
                        zip_file.writestr(zip_path, file_content)
                        
                        # Increment download count
                        file_obj.download_count += 1
                        file_obj.save()
                    except Exception as e:
                        # Skip files that can't be read
                        continue

        zip_buffer.seek(0)
        zip_data = zip_buffer.getvalue()
        zip_buffer.close()
        
        # Return bytes directly - BinaryFileRenderer will handle it
        response = Response(
            zip_data,
            content_type='application/zip',
            status=status.HTTP_200_OK
        )
        response['Content-Disposition'] = f'attachment; filename="part_{part_id}_files.zip"'
        response['Content-Length'] = str(len(zip_data))
        return response
        
    except Part.DoesNotExist:
        return Response(
            {"error": "Part not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


# ==================== ASSEMBLIES FILE OPERATIONS ====================

@swagger_auto_schema(
    method='post',
    operation_id='upload_file_to_assembly',
    operation_description="""
    Upload a file to an assembly.
    
    **Required fields:**
    - `file`: The file to upload (multipart/form-data)
    - `display_name`: Name for the file (max 250 characters)
    
    **Optional fields:**
    - `replace_files`: Set to `true` to replace existing file with same display_name. Default: `false`
    
    **Note:** The assembly must not be in "Released" state to upload files.
    """,
    tags=['assemblies'],
    manual_parameters=[
        openapi.Parameter(
            'file',
            openapi.IN_FORM,
            type=openapi.TYPE_FILE,
            required=True,
            description='The file to upload (any file type)'
        ),
        openapi.Parameter(
            'display_name',
            openapi.IN_FORM,
            type=openapi.TYPE_STRING,
            required=True,
            description='Display name for the file (max 250 characters)',
            max_length=250
        ),
        openapi.Parameter(
            'replace_files',
            openapi.IN_FORM,
            type=openapi.TYPE_BOOLEAN,
            required=False,
            description='If true, replace existing file with same display_name. Default: false'
        ),
    ],
    consumes=['multipart/form-data'],
    responses={
        201: openapi.Response(description='File uploaded successfully'),
        400: openapi.Response(description='Bad request - missing required fields, assembly is released, or invalid data'),
        401: openapi.Response(description='Unauthorized - invalid API key or no project access'),
        404: openapi.Response(description='Assembly not found'),
        409: openapi.Response(description='Storage limit exceeded'),
    },
    security=[{'Token': []}, {'Api-Key': []}]
)
@api_view(['POST'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def upload_file_to_assembly(request, assembly_id, **kwargs):
    """
    Upload a file to an assembly.
    
    Request must be multipart/form-data with:
    - file: The file to upload (required)
    - display_name: Name for the file (required, max 250 chars)
    - replace_files: Boolean, if true replaces existing file with same name (optional)
    """
    if "file" not in request.data:
        return Response(
            {"error": "Missing required field: 'file'"},
            status=status.HTTP_400_BAD_REQUEST
        )

    file = request.FILES.get("file")
    if file is None:
        return Response(
            {"error": "Invalid file - file is null"},
            status=status.HTTP_400_BAD_REQUEST
        )

    # Check storage limits
    if APIAndProjectAccess.has_validated_key(request):
        org_id = APIAndProjectAccess.get_organization_id(request)
        if not check_file_sizes_vs_limit(get_organization_by_id(org_id), file.size, request):
            return Response(
                {"error": "Storage limit exceeded"},
                status=status.HTTP_409_CONFLICT
            )
    else:
        if not check_file_sizes_vs_limit(get_organization_by_user_id(request), file.size, request):
            return Response(
                {"error": "Storage limit exceeded"},
                status=status.HTTP_409_CONFLICT
            )

    data = request.data
    if "display_name" not in data:
        return Response(
            {"error": "Missing required field: 'display_name'"},
            status=status.HTTP_400_BAD_REQUEST
        )

    display_name = data["display_name"][:250]  # Enforce max length
    replace_files = str_to_bool(data.get("replace_files", False))

    try:
        assembly = Assembly.objects.get(pk=assembly_id)
        
        # Check project access for API key requests
        if APIAndProjectAccess.has_validated_key(request):
            if not APIAndProjectAccess.check_project_access(request, assembly.project.pk):
                return Response(
                    {"error": "Not authorized - no access to this project"},
                    status=status.HTTP_401_UNAUTHORIZED
                )

        if assembly.release_state == "Released":
            return Response(
                {"error": "Cannot upload files to a released assembly"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if replace_files:
            # Find and replace existing file with same display_name
            existing_files = assembly.files.filter(display_name=display_name)
            if existing_files.exists():
                existing_file = existing_files.first()
                if existing_file.file:
                    existing_file.file.delete(save=False)
                existing_file.file.save(f"{uuid.uuid4().hex}/{file.name}", file)
                existing_file.save()
                file_obj = existing_file
            else:
                # Create new file if no existing file to replace
                new_file = File.objects.create(display_name=display_name)
                new_file.file.save(f"{uuid.uuid4().hex}/{file.name}", file)
                new_file.project = assembly.project
                new_file.save()
                assembly.files.add(new_file)
                file_obj = new_file
        else:
            # Create new file
            new_file = File.objects.create(display_name=display_name)
            new_file.file.save(f"{uuid.uuid4().hex}/{file.name}", file)
            new_file.project = assembly.project
            new_file.save()
            assembly.files.add(new_file)
            file_obj = new_file

        assembly.save()
        return Response(
            {"message": "File uploaded successfully", "file_id": file_obj.id},
            status=status.HTTP_201_CREATED
        )
    except Assembly.DoesNotExist:
        return Response(
            {"error": "Assembly not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@swagger_auto_schema(
    method='get',
    operation_id='download_files_from_assembly',
    operation_description="""
    Download all files attached to an assembly as a ZIP archive.
    
    Returns a ZIP file containing all files attached to the assembly. The download count for each file is automatically incremented.
    """,
    tags=['assemblies'],
    produces=['application/zip'],
    responses={
        200: openapi.Response(
            description='ZIP file with all assembly files downloaded successfully',
            schema=openapi.Schema(
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_BINARY
            ),
            headers={
                'Content-Disposition': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Attachment filename'
                )
            }
        ),
        401: openapi.Response(description='Unauthorized - invalid API key or no project access'),
        404: openapi.Response(description='Assembly not found'),
    },
    security=[{'Token': []}, {'Api-Key': []}]
)
@api_view(['GET'])
@renderer_classes([BinaryFileRenderer])  # Use binary renderer for ZIP files
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def download_files_from_assembly(request, assembly_id, **kwargs):
    """
    Download all files attached to an assembly as a ZIP archive.
    """
    try:
        assembly = Assembly.objects.get(pk=assembly_id)
        
        # Check project access for API key requests
        if APIAndProjectAccess.has_validated_key(request):
            if not APIAndProjectAccess.check_project_access(request, assembly.project.pk):
                return Response(
                    {"error": "Not authorized - no access to this project"},
                    status=status.HTTP_401_UNAUTHORIZED
                )

        # Get all files for this assembly
        files = assembly.files.filter(file__isnull=False).exclude(file='')
        
        if not files.exists():
            return Response(
                {"error": "No files found for this assembly"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Create ZIP file in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file_obj in files:
                if file_obj.file:
                    try:
                        # Read file content
                        file_obj.file.open('rb')
                        file_content = file_obj.file.read()
                        file_obj.file.close()
                        
                        # Get filename - prefer display_name but ensure it has extension
                        if file_obj.display_name:
                            # Check if display_name already has an extension
                            if os.path.splitext(file_obj.display_name)[1]:
                                filename = file_obj.display_name
                            else:
                                # No extension in display_name, get it from the actual file
                                _, ext = os.path.splitext(os.path.basename(file_obj.file.name))
                                filename = file_obj.display_name + (ext if ext else '')
                        else:
                            # No display_name, use the actual file name
                            filename = os.path.basename(file_obj.file.name)
                        
                        # Ensure unique filenames in ZIP
                        zip_path = filename
                        counter = 1
                        while zip_path in zip_file.namelist():
                            name, ext = os.path.splitext(filename)
                            zip_path = f"{name}_{counter}{ext}"
                            counter += 1
                        
                        zip_file.writestr(zip_path, file_content)
                        
                        # Increment download count
                        file_obj.download_count += 1
                        file_obj.save()
                    except Exception as e:
                        # Skip files that can't be read
                        continue

        zip_buffer.seek(0)
        zip_data = zip_buffer.getvalue()
        zip_buffer.close()
        
        # Return bytes directly - BinaryFileRenderer will handle it
        response = Response(
            zip_data,
            content_type='application/zip',
            status=status.HTTP_200_OK
        )
        response['Content-Disposition'] = f'attachment; filename="assembly_{assembly_id}_files.zip"'
        response['Content-Length'] = str(len(zip_data))
        return response
        
    except Assembly.DoesNotExist:
        return Response(
            {"error": "Assembly not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


# ==================== PCBAs FILE OPERATIONS ====================
# Note: PCBA upload is handled in pcbas/viewsFiles.py (upload_file_to_pcba)
# This file only contains the download endpoint for consistency

@swagger_auto_schema(
    method='get',
    operation_id='download_files_from_pcba',
    operation_description="""
    Download all files attached to a PCBA as a ZIP archive.
    
    Returns a ZIP file containing all files attached to the PCBA. The download count for each file is automatically incremented.
    """,
    tags=['pcbas'],
    produces=['application/zip'],
    responses={
        200: openapi.Response(
            description='ZIP file with all PCBA files downloaded successfully',
            schema=openapi.Schema(
                type=openapi.TYPE_STRING,
                format=openapi.FORMAT_BINARY
            ),
            headers={
                'Content-Disposition': openapi.Schema(
                    type=openapi.TYPE_STRING,
                    description='Attachment filename'
                )
            }
        ),
        401: openapi.Response(description='Unauthorized - invalid API key or no project access'),
        404: openapi.Response(description='PCBA not found'),
    },
    security=[{'Token': []}, {'Api-Key': []}]
)
@api_view(['GET'])
@renderer_classes([BinaryFileRenderer])  # Use binary renderer for ZIP files
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def download_files_from_pcba(request, pcba_id, **kwargs):
    """
    Download all files attached to a PCBA as a ZIP archive.
    """
    try:
        pcba = Pcba.objects.get(pk=pcba_id)
        
        # Check project access for API key requests
        if APIAndProjectAccess.has_validated_key(request):
            if not APIAndProjectAccess.check_project_access(request, pcba.project.pk):
                return Response(
                    {"error": "Not authorized - no access to this project"},
                    status=status.HTTP_401_UNAUTHORIZED
                )

        # Get all files for this PCBA (generic_files)
        files = pcba.generic_files.filter(file__isnull=False).exclude(file='')
        
        if not files.exists():
            return Response(
                {"error": "No files found for this PCBA"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Create ZIP file in memory
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file_obj in files:
                if file_obj.file:
                    try:
                        # Read file content
                        file_obj.file.open('rb')
                        file_content = file_obj.file.read()
                        file_obj.file.close()
                        
                        # Get filename - prefer display_name but ensure it has extension
                        if file_obj.display_name:
                            # Check if display_name already has an extension
                            if os.path.splitext(file_obj.display_name)[1]:
                                filename = file_obj.display_name
                            else:
                                # No extension in display_name, get it from the actual file
                                _, ext = os.path.splitext(os.path.basename(file_obj.file.name))
                                filename = file_obj.display_name + (ext if ext else '')
                        else:
                            # No display_name, use the actual file name
                            filename = os.path.basename(file_obj.file.name)
                        
                        # Ensure unique filenames in ZIP
                        zip_path = filename
                        counter = 1
                        while zip_path in zip_file.namelist():
                            name, ext = os.path.splitext(filename)
                            zip_path = f"{name}_{counter}{ext}"
                            counter += 1
                        
                        zip_file.writestr(zip_path, file_content)
                        
                        # Increment download count
                        file_obj.download_count += 1
                        file_obj.save()
                    except Exception as e:
                        # Skip files that can't be read
                        continue

        zip_buffer.seek(0)
        zip_data = zip_buffer.getvalue()
        zip_buffer.close()
        
        # Return bytes directly - BinaryFileRenderer will handle it
        response = Response(
            zip_data,
            content_type='application/zip',
            status=status.HTTP_200_OK
        )
        response['Content-Disposition'] = f'attachment; filename="pcba_{pcba_id}_files.zip"'
        response['Content-Length'] = str(len(zip_data))
        return response
        
    except Pcba.DoesNotExist:
        return Response(
            {"error": "PCBA not found"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )

