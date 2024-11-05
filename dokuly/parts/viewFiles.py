import json
from typing import ItemsView
from django.shortcuts import render
from django.http import HttpResponse
from parts.models import Part
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth.decorators import login_required
from profiles.views import check_permissions_standard, check_user_auth_and_app_permission


from files.models import File
import parts.viewUtilities as util
import files.fileUtilities as fileUtilities


@api_view(['PUT'])
@login_required(login_url='/login')
def add_file_to_part(request, part_id, file_id):
    """
    Adds a file to the parts files field.
    """
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "parts")
    if not permission:
        return response

    if not check_permissions_standard(user):
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    try:
        part = Part.objects.get(pk=part_id)
        file = File.objects.get(pk=file_id)

        # Check if the file is already in  files
        if file in part.files.all():
            return Response("File already added", status=status.HTTP_409_CONFLICT)

        # Add file
        part.files.add(file)
        part.save()
        file.project = part.project
        file.save()

        return Response(status=status.HTTP_200_OK)

    except ObjectDoesNotExist:
        return Response("Part or file not found", status=status.HTTP_404_NOT_FOUND)

# DEPRECATED


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
def fetch_file_list(request, id):
    """View for fetching file list to use in the files table.
    """

    permission, response = check_user_auth_and_app_permission(request, "parts")
    if not permission:
        return response

    part_obj = Part.objects.get(id=id)

    file_list = []

    def get_download_query_string(file_id):
        return f"api/files/download/file/{file_id}/"

    # These files should always be present. They will therefore appear in the list when no actual file is present.
    # TODO file_list.append(util.assemble_file_dict("1", part_obj.part_drawing_raw, "Assembly drawing Source PDF", fileUtilities.get_file_name_by_id(part_obj.part_drawing_source), "AD SOURCE", get_download_query_string(part_obj.part_drawing_raw)))
    file_list.append(fileUtilities.assemble_file_dict("1", part_obj.part_drawing_raw, "Part Drawing", fileUtilities.get_file_name_by_id(
        part_obj.part_drawing_raw), "PD_RAW", get_download_query_string(part_obj.part_drawing_raw)))

    # TODO there is currently no processing of the part drawing.
    # The print file should only be visible if it has data.
    if part_obj.part_drawing != -1 and part_obj.part_drawing != None:
        file_list.append(fileUtilities.assemble_file_dict("2", part_obj.part_drawing, "Part Drawing Print",
                         fileUtilities.get_file_name_by_id(part_obj.part_drawing), "PD", get_download_query_string(part_obj.part_drawing)))

    if part_obj.generic_file_ids != None:
        if 0 < len(part_obj.generic_file_ids):
            file_objects = File.objects.filter(pk__in=part_obj.generic_file_ids)

            for i, files_row in enumerate(file_objects):
                try:
                    entry = fileUtilities.assemble_file_dict(str(i+2), files_row.id, files_row.display_name, fileUtilities.get_file_name_by_id(files_row.id),
                                                             "Generic", fileUtilities.get_file_uri_formatted("file", "files", files_row.id), (files_row.archived == 1))
                    file_list.append(entry)
                except File.DoesNotExist:
                    continue
    return Response(file_list)


# DEPRECATED
@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
def connect_file_with_part(request, file_id):
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "parts")
    if not permission:
        return response

    data = request.data
    if data == None:
        return Response("No data sent with request", status=status.HTTP_400_BAD_REQUEST)
    if file_id == None:
        return Response("No file id sent with the request", status=status.HTTP_400_BAD_REQUEST)
    if 'part_id' not in data:
        return Response("No part id sent with the request", status=status.HTTP_400_BAD_REQUEST)
    try:
        file = File.objects.get(id=file_id)
        try:
            part = Part.objects.get(id=data['part_id'])
            if 'file_type' in data:
                if data['file_type'] == "PD_RAW":
                    print("Got raw")
                    Part.objects.filter(id=data['part_id']).update(part_drawing_raw=file.id)
                elif data['file_type'] == "PD":
                    print("Got PD")
                    Part.objects.filter(id=data['part_id']).update(part_drawing=file.id)
                elif data['file_type'] == "Generic":
                    currentFiles = []
                    if part.generic_file_ids != None:
                        if len(part.currentFiles) > 0:
                            currentFiles = part.generic_file_ids
                    currentFiles.append(file.id)
                    Part.objects.filter(id=data['part_id']).update(generic_file_ids=currentFiles)
                return Response("Uploaded files", status=status.HTTP_200_OK)
            else:
                currentFiles = []
                if part.generic_file_ids != None:
                    if len(part.generic_file_ids) > 0:
                        currentFiles = part.generic_file_ids
                currentFiles.append(file.id)
                Part.objects.filter(id=data['part_id']).update(generic_file_ids=currentFiles)
                return Response("Uploaded files", status=status.HTTP_200_OK)
        except Exception as e:
            return Response("Part ID not valid, entity not found.", status=status.HTTP_400_BAD_REQUEST)
    except File.DoesNotExist:
        return Response("File ID not valid, entity not found.", status=status.HTTP_400_BAD_REQUEST)
