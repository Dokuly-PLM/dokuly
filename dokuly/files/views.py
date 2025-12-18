from datetime import datetime
from django.shortcuts import render
from django.http import HttpResponse
from production.models import Production
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from django.core.files.base import ContentFile
from django.core.files import File as DjangoFile
from django.conf import settings
from django.http import FileResponse
from django.views.decorators.clickjacking import xframe_options_exempt
from django.db.models import Q
from django.contrib.auth.decorators import login_required
from django.db import transaction
import azure.storage.blob as azstorage
from organizations.permissions import APIAndProjectAccess
from projects.views import check_project_access
import mimetypes
from typing import Type, Union

import os
import uuid
import math
import io
from PIL import Image as PILImage
from django.core.files.uploadedfile import InMemoryUploadedFile

import pcbas.viewUtilities as util
import files.fileUtilities as file_util

from production.serializers import ProductionSerializer
from organizations.models import Organization
from organizations.serializers import CustomerOrganizationSerializer
from .serializers import FileSerializer, ImageSerializer
from .models import File, Image
from parts.models import Part
from assemblies.models import Assembly
from pcbas.models import Pcba
from purchasing.models import Supplier, PurchaseOrder

from django.contrib.auth.models import User
from profiles.models import Profile

MODEL_MAPPING = {
    "Part": Part,
    "parts": Part,
    "Assembly": Assembly,
    "assemblies": Assembly,
    "pcbas": Pcba,
    "procurement": Supplier,
    "PurchaseOrder": PurchaseOrder
}

# ----------------- Files --------------------


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_files(request):
    """Generic view for fetching a set of files.
    The request data must contain the 'file_ids' field. It is an array field.
    This view is used if the entity contains a list of file ids
    The form is basically a GET, but to allow passing the data through `data`, a PUT request is necessary.
    """

    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    data = request.data

    if not ("file_ids" in data):
        return Response(
            "'file_ids' missing from the request!", status=status.HTTP_400_BAD_REQUEST
        )

    file_ids = data["file_ids"]
    files = []
    for id in file_ids:
        if id != None and id != "" and id != -1:
            file = File.objects.get(id=id)
            entry = {
                "uri": file_util.get_file_uri_formatted("file", "documents", id),
                "id": file.id,
                "display_name": file.display_name,
                "file_name": file.file.name,
                "active": file.active,
                "archived": file.archived,
                "download_count": file.download_count,
            }
            files.append(entry)
    return Response(files, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_files_production(request, objectId, objectType):
    """View for fetching files related to produced units."""
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    object = None
    files = []
    file_ids = []
    if objectType == "Production":
        object = Production.objects.get(id=objectId)
        serializer = ProductionSerializer(object, many=False)
        if "file_ids" in serializer.data:
            if serializer.data["file_ids"] != None:
                file_ids = serializer.data["file_ids"]
    for id in file_ids:
        if id != None and id != "" and id != -1:
            file = File.objects.get(id=id)
            entry = {
                "uri": file_util.get_file_uri_formatted("file", "documents", id),
                "id": file.id,
                "display_name": file.display_name,
                "active": file.active,
                "archived": file.archived,
                "download_count": file.download_count,
            }
            files.append(entry)
    return Response(files, status=status.HTTP_200_OK)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def create_prod_file_connection(request, prod_id):
    """Method for updating production files attached to produced units."""
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    data = request.data
    prod_object = Production.objects.get(id=prod_id)
    serializerCurrent = ProductionSerializer(prod_object, many=False)
    current_software_history = []
    if "software_history" in serializerCurrent.data:
        if serializerCurrent.data["software_history"] != None:
            current_software_history = serializerCurrent.data["software_history"]
    if "software_array" in data:
        current_software_history.append(data["software_array"])
    currentFiles = []
    if "file_ids" in serializerCurrent.data:
        if serializerCurrent.data["file_ids"] != None:
            currentFiles = serializerCurrent.data["file_ids"]
    currentFiles.append(request.data["fileData"]["id"])
    Production.objects.filter(id=prod_id).update(
        file_ids=currentFiles,
        software_history=current_software_history,
        internal_software=data["internal_software"],
    )
    files = []
    for index, id in enumerate(currentFiles):
        if id != None and id != "" and id != -1:
            file = File.objects.get(id=id)
            entry = {
                "uri": file_util.get_file_uri_formatted("file", "files", id),
                "id": file.id,
                "display_name": file.display_name,
                "active": file.active,
                "archived": file.archived,
                "download_count": file.download_count,
            }
            files.append(entry)
    newProd = Production.objects.get(id=prod_id)
    serializerProd = ProductionSerializer(newProd, many=False)
    data = {"files": files, "prod": serializerProd.data}
    return Response(data, status=status.HTTP_200_OK)


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def upload_and_create_new_file_row(request):
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    if not "file" in request.data:
        return Response("No file in request", status=status.HTTP_400_BAD_REQUEST)
    if not check_file_sizes_vs_limit(
        get_organization_by_user_id(
            request), request.FILES["file"].size, request
    ):
        return Response("Storage full!", status=status.HTTP_409_CONFLICT)

    try:
        file = request.FILES["file"]
        data = request.data
        if data == None:
            return Response("No data in request", status=status.HTTP_400_BAD_REQUEST)
        method = request.method
        if method != "POST":
            return Response("Only POST allowed", status=status.HTTP_400_BAD_REQUEST)
        if file == None:
            return Response(
                "Invalid file parameters, file is null",
                status=status.HTTP_400_BAD_REQUEST,
            )
        if "display_name" in data:
            newFile = File.objects.create(display_name=data["display_name"])
        else:
            newFile = File.objects.create(display_name=file.name[0:49])
        # Ensure unique path for all files.
        newFile.file.save(f"{uuid.uuid4().hex}/{file.name}", file)
        serializerFile = FileSerializer(newFile, many=False)
        return Response(serializerFile.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response("Request failed!", status=status.HTTP_400_BAD_REQUEST)


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def upload_multiple_and_create_new_file_rows(request):
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    if not request.FILES:
        return Response("No files in request", status=status.HTTP_400_BAD_REQUEST)

    # Get all files from request.FILES
    files = request.FILES.getlist('files')
    if not files:
        # Fallback to checking all files if 'files' key wasn't used
        files = [f for f in request.FILES.values()]

    total_size = sum(f.size for f in files)

    if not check_file_sizes_vs_limit(
        get_organization_by_user_id(request), total_size, request
    ):
        return Response("Storage full!", status=status.HTTP_409_CONFLICT)

    try:
        data = request.data
        display_names = data.getlist('display_names', [])

        created_files = []
        for i, file in enumerate(files):
            display_name = display_names[i] if i < len(display_names) else file.name[0:49]
            new_file = File.objects.create(display_name=display_name)
            new_file.file.save(f"{uuid.uuid4().hex}/{file.name}", file)
            created_files.append(new_file)

        serializer = FileSerializer(created_files, many=True)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        return Response(f"Request failed! {str(e)}", status=status.HTTP_400_BAD_REQUEST)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def connect_multiple_files_to_object(request, app_str, object_id):
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    data = request.data
    file_ids = data.get("file_ids", [])

    if not file_ids:
        return Response("No file_ids provided", status=status.HTTP_400_BAD_REQUEST)

    if app_str not in MODEL_MAPPING:
        return Response(f"Invalid app: {app_str}", status=status.HTTP_400_BAD_REQUEST)

    ModelClass = MODEL_MAPPING[app_str]

    try:
        obj = ModelClass.objects.get(id=object_id)
        files = File.objects.filter(id__in=file_ids)

        if not files:
            return Response("No valid files found", status=status.HTTP_404_NOT_FOUND)

        # Connect files based on model structure
        if hasattr(obj, 'files'):
            obj.files.add(*files)
        elif hasattr(obj, 'generic_files'):
            obj.generic_files.add(*files)
        else:
            return Response(f"Model {app_str} does not support generic file connections",
                            status=status.HTTP_400_BAD_REQUEST)

        obj.save()

        # Update project for files
        if hasattr(obj, 'project'):
            for file in files:
                file.project = obj.project
                file.save()

        return Response("Files connected successfully", status=status.HTTP_200_OK)
    except ModelClass.DoesNotExist:
        return Response(f"{app_str} object not found", status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(f"Connection failed: {str(e)}", status=status.HTTP_400_BAD_REQUEST)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def download_file(request, file_id):
    """Return the actual file to the client.
    It fetches the file from the storage bucket and serves it over HTTP."""
    # Fetch file from DB
    try:
        user = request.user
        file_qs = File.objects.filter(id=file_id)
        if not check_project_access(file_qs, user):
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
        file_obj = file_qs.first()
        counter = file_obj.download_count
        newCounter = counter + 1
        File.objects.filter(id=file_id).update(download_count=newCounter)
        return FileResponse(
            file_obj.file.open("rb"), as_attachment=True, status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@xframe_options_exempt
@permission_classes([IsAuthenticated])
def view_file(request, file_id):
    """Return the actual file to the client.
    It fetches the file from the storage bucket and serves it over HTTP."""
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    # Fetch file from DB
    file_obj = File.objects.get(id=file_id)
    return FileResponse(file_obj.file.open("rb"), status=status.HTTP_200_OK)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def archive_file(request, file_id):
    """Archive file."""
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    # Fetch file from DB
    file_obj = File.objects.get(id=file_id)
    file_obj.archived = 1
    file_obj.archived_date = datetime.now()
    file_obj.save()

    return Response("File Archived.", status=status.HTTP_200_OK)


@api_view(("DELETE",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def delete_file(request, file_id):
    """Delete file."""
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    try:
        # Fetch file from DB
        file_obj = File.objects.get(id=file_id)
        # Delete file from storage
        file_obj.file.delete()
        file_obj.delete()
        return Response("File Deleted.", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def upload_file(request, file_id):
    """view supporting uploading arbitrary csv file to create a BOM on the PCBA."""
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    data = request.data
    if data == None:
        return Response("No data in request", status=status.HTTP_400_BAD_REQUEST)

    method = request.method
    if method != "POST":
        return Response("Only POST allowed", status=status.HTTP_400_BAD_REQUEST)
    if file_id == None:
        return Response(
            "Invalid id sent with request", status=status.HTTP_400_BAD_REQUEST
        )

    try:
        file_obj = File.objects.get(id=file_id)

        if not ("file" in data):
            return Response("No file found", status=status.HTTP_400_BAD_REQUEST)
        if not check_file_sizes_vs_limit(
            get_organization_by_user_id(
                request), request.FILES["file"].size, request
        ):
            return Response("Storage full!", status=status.HTTP_409_CONFLICT)

        file_type = data["file_type"]
        file = request.FILES["file"]

        file_obj.file.save(f"{uuid.uuid4().hex}/{file.name}", file)
        serializer = FileSerializer(file_obj, many=False)
        res = {"msg": f"{file_type}Document uploaded", "file": serializer.data}
        return Response(res, status=status.HTTP_200_OK)
    except File.DoesNotExist:
        # No file row found
        return Response(-1, status=status.HTTP_204_NO_CONTENT)
    finally:
        update_org_current_storage_size(request)


def get_file(file_id):
    """Return the actual file to the client.
    It fetches the file from the storage bucket and serves it over HTTP.
    TODO implement download count for files."""
    # Fetch file from DB
    file_obj = File.objects.get(id=file_id)

    with file_obj.file.open() as file:
        # Pack and return to client.
        file_response = FileResponse(file, as_attachment=True)
    return Response(file_response, status=status.HTTP_200_OK)


# ----------------- Images --------------------


@api_view(("PUT", "GET"))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def download_image(request, id):
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    if request.method != "PUT" and request.method != "GET":
        return Response(
            f"{request.method} not allowed, PUT/GET required",
            status=status.HTTP_405_METHOD_NOT_ALLOWED,
        )
    try:
        user = request.user
        file_qs = Image.objects.filter(id=id)
        if not check_project_access(file_qs, user):
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
        file_obj = file_qs.first()
        counter = file_obj.download_count
        newCounter = counter + 1
        Image.objects.filter(id=id).update(download_count=newCounter)
        return FileResponse(
            file_obj.file.open("rb"), as_attachment=True, status=status.HTTP_200_OK
        )
    except Exception as e:
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def upload_image(request):
    try:
        if request.user is None:
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

        file = request.FILES.get("file")
        data = request.data
        if data is None:
            return Response("No data in request", status=status.HTTP_400_BAD_REQUEST)
        if not check_file_sizes_vs_limit(get_organization_by_user_id(request), file.size, request):
            return Response("Storage full!", status=status.HTTP_409_CONFLICT)

        if file is None:
            return Response("Invalid file parameters, file is null", status=status.HTTP_400_BAD_REQUEST)

        new_file = Image.objects.create(image_name=data.get("display_name"))
        unique_folder = uuid.uuid4().hex
        original_filename = os.path.basename(file.name)

        # Save the original file
        new_file.file.save(f"{unique_folder}/{original_filename}", file)

        # Compress the image and save the compressed version
        compressed_file = compress_image(
            file, original_filename, unique_folder)
        new_file.image_compressed.save(
            f"{unique_folder}/compressed_{original_filename}", compressed_file)

        if "project" in data and data["project"] != -1 and data["project"] != "null" and data["project"] != None:
            new_file.project_id = data.get("project")

        new_file.save()
        serializer_file = ImageSerializer(new_file, many=False)

        # Include URLs for both the original and compressed images
        original_image_url = new_file.file.url
        compressed_image_url = new_file.image_compressed.url

        response_data = {
            "imageData": serializer_file.data,
            "originalImageUrl": original_image_url,
            "compressedImageUrl": compressed_image_url
        }

        connection_status_msg = ""
        if "domain_name" in data:
            if data["domain_name"] == "organizations":
                if "dbObjId" in data:
                    try:
                        org = Organization.objects.get(id=data["dbObjId"])
                        current_image_ids = org.image_ids or []
                        current_image_ids.append(serializer_file.data["id"])
                        Organization.objects.filter(id=data["dbObjId"]).update(
                            image_ids=current_image_ids)
                        org_updated = Organization.objects.get(
                            id=data["dbObjId"])
                        org_serializer = CustomerOrganizationSerializer(
                            org_updated, many=False)
                        return Response({"newObj": org_serializer.data, "newImage": response_data})

                    except Organization.DoesNotExist:
                        connection_status_msg = "Organization not found, no connection made"
            elif data["domain_name"] == "profiles":
                connection_status_msg = "WIP"

        if connection_status_msg:
            return Response({"data": response_data, "msg": connection_status_msg}, status=status.HTTP_202_ACCEPTED)
        return Response(response_data, status=status.HTTP_200_OK)
    except Exception as e:
        return Response(f"upload_image failed: {e}", status=status.HTTP_400_BAD_REQUEST)
    finally:
        update_org_current_storage_size(request)


def compress_image(file, filename, folder):
    try:
        print(f"Opening image file: {file.name}")
        im = PILImage.open(file)

        print(f"Original image mode: {im.mode}")

        if im.mode == 'RGBA':
            print("Image has RGBA mode; converting to RGB with white background.")
            background = PILImage.new('RGB', im.size, (255, 255, 255))
            # Use alpha channel as mask
            background.paste(im, mask=im.split()[3])
            im = background
        elif im.mode == 'LA':
            print("Image has LA mode; converting to RGB with white background.")
            im = im.convert('RGBA')
            background = PILImage.new('RGB', im.size, (255, 255, 255))
            # Use alpha channel as mask
            background.paste(im, mask=im.split()[3])
            im = background
        elif im.mode == 'P' and 'transparency' in im.info:
            print("Image has P mode with transparency; converting to RGBA then to RGB.")
            im = im.convert('RGBA')
            background = PILImage.new('RGB', im.size, (255, 255, 255))
            # Use alpha channel as mask
            background.paste(im, mask=im.split()[3])
            im = background
        else:
            if im.mode != 'RGB':
                print(f"Image mode is {im.mode}; converting to RGB.")
                im = im.convert('RGB')
            else:
                print("Image mode is already RGB; no conversion needed.")

        print(f"Converted image mode: {im.mode}")

        im_io = io.BytesIO()
        im.save(im_io, 'JPEG', quality=60)

        compressed_image = InMemoryUploadedFile(
            im_io, None, f"{folder}/compressed_{filename}",
            'image/jpeg', im_io.getbuffer().nbytes, None
        )

        return compressed_image

    except Exception as e:
        print(f"Error compressing image: {e}")
        raise


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def upload_thumbnail(request, **kwargs):
    try:
        file = request.FILES["file"]
        data = request.data
        if data == None:
            return Response("No data in request", status=status.HTTP_400_BAD_REQUEST)

        if APIAndProjectAccess.has_validated_key(request):  # Handle API key request
            if not check_file_sizes_vs_limit(
                get_organization_by_id(
                    APIAndProjectAccess.get_organization_id(request)), request.FILES["file"].size, request
            ):
                return Response("Storage full!", status=status.HTTP_409_CONFLICT)
        else:
            if not check_file_sizes_vs_limit(
                get_organization_by_user_id(
                    request), request.FILES["file"].size, request
            ):
                return Response("Storage full!", status=status.HTTP_409_CONFLICT)

        if file == None:
            return Response(
                "Invalid file parameters, file is null",
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not "app" in data:
            return Response("No app in request", status=status.HTTP_400_BAD_REQUEST)

        if data["app"] not in MODEL_MAPPING:
            return Response(
                "Invalid app in request", status=status.HTTP_400_BAD_REQUEST
            )

        newFile = Image(image_name=data["display_name"])
        ModelClass: Type[Union[Part, Assembly, Pcba, Supplier]] = MODEL_MAPPING[data["app"]]
        item = None
        try:
            item = ModelClass.objects.get(id=data["item_id"])
        except ModelClass.DoesNotExist:
            return Response("Item not found", status=status.HTTP_404_NOT_FOUND)

        # Refuse upload if the item is released (only for items with release_state field)
        if getattr(item, "release_state", None) == "Released":
            return Response(
                f"Can't edit a released {str(ModelClass)}!", status=status.HTTP_400_BAD_REQUEST
            )

        with transaction.atomic():
            if item.thumbnail:
                old_file = Image.objects.get(id=item.thumbnail.pk)
                old_file.file.delete()
                old_file.delete()

            newFile = Image(image_name=data["display_name"])
            newFile.save()
            newFile.file.save(f"{uuid.uuid4().hex}/{file.name}", file)
            item.thumbnail = newFile
            item.save()

            serializerFile = ImageSerializer(newFile, many=False)
            return Response(serializerFile.data, status=status.HTTP_201_CREATED)
    except Exception as e:
        print("upload_thumbnail failed:", str(e))
        return Response(
            f"upload_thumbnail failed: {e}", status=status.HTTP_400_BAD_REQUEST
        )
    finally:
        update_org_current_storage_size(request)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def delete_thumbnail(request):
    try:
        if request.user == None:
            return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
        data = request.data
        if data == None:
            return Response("No data in request", status=status.HTTP_400_BAD_REQUEST)
        if not "app" in data:
            return Response("No app in request", status=status.HTTP_400_BAD_REQUEST)

        if data["app"] not in MODEL_MAPPING:
            return Response(
                "Invalid app in request", status=status.HTTP_400_BAD_REQUEST
            )

        ModelClass: Type[Union[Part, Assembly, Pcba, Supplier]] = MODEL_MAPPING[data["app"]]
        try:
            item = ModelClass.objects.get(id=data["item_id"])
        except ModelClass.DoesNotExist:
            return Response("Item not found", status=status.HTTP_404_NOT_FOUND)

        with transaction.atomic():
            if item.thumbnail:
                old_file = Image.objects.get(id=item.thumbnail.pk)
                old_file.file.delete()
                old_file.delete()
            item.thumbnail = None
            item.save()
        return Response("Thumbnail deleted", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(
            f"upload_thumbnail failed: {e}", status=status.HTTP_400_BAD_REQUEST
        )


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_images(request):
    """Generic view for fetching a set of images.
    The request data must contain the 'file_ids' field. It is an array field.
    This view is used if the entity contains a list of file ids
    The form is basically a GET, but to allow passing the data through `data`, a PUT request is necessary.
    """
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    data = request.data
    if not "file_ids" in data:
        return Response(
            "'file_ids' missing from the request!", status=status.HTTP_400_BAD_REQUEST
        )

    file_ids = data["file_ids"]
    files = []
    for id in file_ids:
        if id != None and id != "" and id != -1:
            file = Image.objects.get(id=id)
            if file.archived == 0:
                entry = {
                    "uri": file_util.get_image_uri_formatted(id),
                    # 'image': file.file,
                    "id": file.id,
                    "image_name": file.image_name,
                    "archived": file.archived,
                    "download_count": file.download_count,
                }
                files.append(entry)
    return Response(files, status=status.HTTP_200_OK)


@api_view(["GET"])
@permission_classes((IsAuthenticated,))
def get_image(request, image_id, version):
    """Fetch a single image by ID passed via URL and return as a blob."""
    try:
        file = Image.objects.get(id=image_id, archived=0)
    except Image.DoesNotExist:
        return Response("No Image matches the given query.", status=status.HTTP_404_NOT_FOUND)

    if not file.file:
        return Response("Image file not found.", status=status.HTTP_404_NOT_FOUND)

    # Determine the content type from the file extension if not directly available
    content_type, _ = mimetypes.guess_type(file.file.name)
    if content_type is None:
        content_type = 'application/octet-stream'  # Fallback MIME type

    if version == 'original' or not hasattr(file, 'image_compressed') or not file.image_compressed:
        # Serve the original image file
        response = FileResponse(file.file.open('rb'), content_type=content_type)
        response['Content-Disposition'] = f'inline; filename="{file.file.name}"'
    elif version == 'compressed':
        # Check if compressed image exists and serve it
        if file.image_compressed:
            compressed_content_type, _ = mimetypes.guess_type(file.image_compressed.name)
            if compressed_content_type is None:
                compressed_content_type = 'application/octet-stream'
            response = FileResponse(file.image_compressed.open('rb'), content_type=compressed_content_type)
            response['Content-Disposition'] = f'inline; filename="{file.image_compressed.name}"'
        else:
            # If compressed image doesn't exist, fall back to original
            response = FileResponse(file.file.open('rb'), content_type=content_type)
            response['Content-Disposition'] = f'inline; filename="{file.file.name}"'
    else:
        # If an unsupported version is requested, serve the original
        response = FileResponse(file.file.open('rb'), content_type=content_type)
        response['Content-Disposition'] = f'inline; filename="{file.file.name}"'

    return response


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def fetch_selected_org_image(request):
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    try:
        user = request.user
        user_profile = Profile.objects.get(user__pk=user.id)
        organization = Organization.objects.get(
            id=user_profile.organization_id)
        logo_id = organization.logo_id
        if logo_id == None:
            return Response(
                "Logo not set, cannot fetch logo.", stauts=status.HTTP_400_BAD_REQUEST
            )
        return Response(
            file_util.get_image_uri_formatted(logo_id), status=status.HTTP_200_OK
        )
    except Profile.DoesNotExist or User.DoesNotExist:
        return Response(
            "Profile not found, cannot fetch logo.", status=status.HTTP_400_BAD_REQUEST
        )


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def unarchive_image(request, id):
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    try:
        Image.objects.filter(id=id).update(archived=0)
        archived = Image.objects.filter(archived=1)
        archivedSerializer = ImageSerializer(archived, many=True)
        images = []
        for image in archivedSerializer.data:
            image["uri"] = file_util.get_image_uri_formatted(image["id"])
            images.append(image)
        return Response(
            {"archived": archivedSerializer.data}, status=status.HTTP_200_OK
        )
    except Image.DoesNotExist:
        return Response("Not found", status=status.HTTP_404_NOT_FOUND)


@api_view(("GET", "PUT"))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def fetch_archived_images(request):
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    qs = Image.objects.filter(archived=1)
    archivedSerializer = ImageSerializer(qs, many=True)
    images = []
    for obj in archivedSerializer.data:
        obj["uri"] = file_util.get_image_uri_formatted(obj["id"])
        images.append(obj)
    return Response(images, status=status.HTTP_200_OK)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def archive_image(request, id, returnFlag):
    # Set archived, remove from id list
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    data = request.data
    if data == None:
        return Response(
            "No payload sent with request", status=status.HTTP_400_BAD_REQUEST
        )
    removeConnectionStatusMsg = ""
    if "domain" in data:
        if data["domain"] == "organizations":
            try:
                org = Organization.objects.get(id=data["dbObjId"])
                currentIds = []
                if org.image_ids != None:
                    currentIds = org.image_ids
                if len(currentIds) == 0:
                    removeConnectionStatusMsg = "Connection not found"
                else:
                    for i, value in enumerate(currentIds):
                        if value == id:
                            currentIds.pop(i)
                    Organization.objects.filter(id=data["dbObjId"]).update(
                        image_ids=currentIds
                    )
                    Image.objects.filter(id=id).update(
                        archived=1, archived_date=data["archived_date"]
                    )
                    if returnFlag == 0:
                        updatedImage = Image.objects.get(id=id)
                        serializer = ImageSerializer(updatedImage, many=False)
                        return Response(serializer.data, status=status.HTTP_200_OK)
                    elif returnFlag == 1 or returnFlag == 2:
                        entries = []
                        for imageId in currentIds:
                            file = Image.objects.get(id=imageId)
                            if file.archived == 0:
                                entry = {
                                    "uri": file_util.get_image_uri_formatted(imageId),
                                    # 'image': file.file,
                                    "id": file.id,
                                    "image_name": file.image_name,
                                    "archived": file.archived,
                                    "download_count": file.download_count,
                                }
                                entries.append(entry)
                        if returnFlag == 2:
                            allArchived = Image.objects.filter(archived=1)
                            allUnarchived = Image.objects.filter(archived=0)
                            archivedSerializer = ImageSerializer(
                                allArchived, many=True)
                            unarchivedSerializer = ImageSerializer(
                                allUnarchived, many=True
                            )
                            return Response(
                                {
                                    "entries": entries,
                                    "archived": archivedSerializer.data,
                                    "unarchived": unarchivedSerializer.data,
                                }
                            )
                        updatedOrg = Organization.objects.get(
                            id=data["dbObjId"])
                        orgSerializer = CustomerOrganizationSerializer(
                            updatedOrg, many=False
                        )
                        return Response(
                            {"entries": entries, "dbObj": orgSerializer.data},
                            status=status.HTTP_200_OK,
                        )
                    else:
                        return Response(
                            "No return flag set", status=status.HTTP_400_BAD_REQUEST
                        )
            except Organization.DoesNotExist:
                removeConnectionStatusMsg = "Organization not found"
        if removeConnectionStatusMsg != "":
            return Response(removeConnectionStatusMsg, status=status.HTTP_404_NOT_FOUND)
    else:
        return Response(
            "No domain sent with the request", status=status.HTTP_400_BAD_REQUEST
        )


@api_view(("GET", "POST"))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def check_tenant_storage_size(request):
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    try:
        local_server = bool(int(os.environ.get("DJANGO_LOCAL_SERVER", 0)))
        if local_server:
            return Response(
                {
                    "count": 0,
                    "size": 0,
                    "tenant": "oss",
                    "bytes": 0,
                    "limit": "Limited by host",
                    "limit_bytes": 1_000_000_000_000,
                },
                status=status.HTTP_200_OK,
            )
        block_service = azstorage.BlobServiceClient(
            settings.AZURE_CUSTOM_DOMAIN,
            {
                "account_name": settings.AZURE_ACCOUNT_NAME,
                "account_key": settings.AZURE_ACCOUNT_KEY,
            },
            connection_timeout=3,
        )
        blob_list = block_service.get_container_client(
            settings.AZURE_CONTAINER_NAME
        ).list_blobs()
        file_count = 0
        total_size = 0
        for blob in blob_list:
            trimmed_blob_name = blob.name.split("/")[0]
            if str(trimmed_blob_name) == str(request.tenant):
                file_count += 1
                total_size += blob.size
        byte_size = total_size
        total_size = convert_file_size(total_size)
        limit = 5368709120
        limit_converted = convert_file_size(limit)
        try:
            user_profile = Profile.objects.get(user__pk=request.user.id)
            org = Organization.objects.get(id=user_profile.organization_id)
            org.current_storage_size = byte_size
            limit = org.storage_limit
            limit_converted = convert_file_size(limit)
            org.save()
        except Exception as e:
            print(str(e))
        return Response(
            {
                "count": file_count,
                "size": total_size,
                "tenant": str(request.tenant),
                "bytes": byte_size,
                "limit": limit_converted,
                "limit_bytes": limit,
            },
            status=status.HTTP_200_OK,
        )
    except Exception as e:
        print(e)
        user_profile = Profile.objects.get(user__pk=request.user.id)
        org = Organization.objects.get(id=user_profile.organization_id)
        byte_size = org.current_storage_size
        limit = org.storage_limit
        limit_converted = convert_file_size(limit)
        total_size = convert_file_size(byte_size)
        return Response(
            {
                "size": total_size,
                "tenant": str(request.tenant),
                "bytes": byte_size,
                "limit": limit_converted,
                "limit_bytes": limit,
            },
            status=status.HTTP_200_OK,
        )


def convert_file_size(size_in_bytes):
    if size_in_bytes == 0:
        return "0B"
    size_name = ("B", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB")
    index = int(math.floor(math.log(size_in_bytes, 1024)))
    p = math.pow(1024, index)
    size = round(size_in_bytes / p, 2)
    return f"{size} {size_name[index]}"


def check_file_sizes_vs_limit(organization, fileSize, request):
    """
    DEPRECATED: This function previously enforced storage limits per organization.
    Since the project is now open source, storage limits are no longer enforced.
    The function is kept for backwards compatibility but always returns True.

    Args:
        organization: Organization object (unused, kept for compatibility)
        fileSize: Size of the file in bytes (unused, kept for compatibility)
        request: HTTP request object (unused, kept for compatibility)

    Returns:
        bool: Always True (no storage limit enforcement)
    """
    # Always allow file uploads - no storage limits. Its open source :D
    return True


def update_org_current_storage_size(request):
    try:
        block_service = azstorage.BlobServiceClient(
            settings.AZURE_CUSTOM_DOMAIN,
            {
                "account_name": settings.AZURE_ACCOUNT_NAME,
                "account_key": settings.AZURE_ACCOUNT_KEY,
            },
            connection_timeout=3,
        )
        blob_list = block_service.get_container_client(
            settings.AZURE_CONTAINER_NAME
        ).list_blobs()
        file_count = 0
        total_size = 0
        for blob in blob_list:
            trimmed_blob_name = blob.name.split("/")[0]
            if str(trimmed_blob_name) == str(request.tenant):
                file_count += 1
                total_size += blob.size
        byte_size = total_size
        total_size = convert_file_size(total_size)
        try:
            user_profile = Profile.objects.get(user__pk=request.user.id)
            org = Organization.objects.get(id=user_profile.organization_id)
            org.current_storage_size = byte_size
            org.save()
        except Exception as e:
            # Try to get organization from api key request
            try:
                org = Organization.objects.get(
                    id=APIAndProjectAccess.get_organization_id(request))
                org.current_storage_size = byte_size
                org.save()
            except Exception as e:
                pass
            print(str(e))
        return {"count": file_count, "size": total_size, "tenant": str(request.tenant)}
    except Exception as e:
        print(str(e))


def get_organization_by_user_id(request):
    return Organization.objects.get(
        id=Profile.objects.get(user__pk=request.user.id).organization_id
    )


def get_organization_by_id(org_id):
    return Organization.objects.get(id=org_id)


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def set_storage_limit(request):  # 107,374,182,400 is 100 GB
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    if "adminPass" in request.data:  # Temp access point for posting users
        if str(request.data["adminPass"]) == str(os.getenv("adminPass")):
            print("Access granted")
        else:
            return Response("", status=status.HTTP_401_UNAUTHORIZED)
    if "size" in request.data:
        org = get_organization_by_user_id(request)
        org.storage_limit = request.data["size"]
        org.save()
        return Response("Updated", status=status.HTTP_200_OK)
    return Response("")
