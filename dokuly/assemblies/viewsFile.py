from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from datetime import datetime
from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth.decorators import login_required

from assemblies.models import Assembly
import assemblies.viewUtilities as util
import files.fileUtilities as fileUtilities
from files.models import File
from profiles.views import check_permissions_standard, check_user_auth_and_app_permission


@api_view(['PUT'])
@login_required(login_url='/login')
def add_file_to_assembly(request, assembly_id, file_id):
    """
    Adds a file to the assemblies files field.
    """
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    if not check_permissions_standard(user):
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    try:
        assembly = Assembly.objects.get(pk=assembly_id)
        file = File.objects.get(pk=file_id)

        # Check if the file is already in the files
        if file in assembly.files.all():
            return Response("File already added", status=status.HTTP_409_CONFLICT)

        # Add file
        assembly.files.add(file)
        assembly.save()
        file.project = assembly.project
        file.save()

        return Response(status=status.HTTP_200_OK)

    except ObjectDoesNotExist:
        return Response("Assembly or file not found", status=status.HTTP_404_NOT_FOUND)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def fetch_file_list(request, id):  # DEPRECATED
    """View for fetching file list to use in the files table.
    """
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    asm_obj = Assembly.objects.get(id=id)

    file_list = []

    def get_download_query_string(file_id):
        return f"api/files/download/file/{file_id}/"

    # These files should always be present. They will therefore appear in the list when no actual file is present.
    # TODO file_list.append(util.assemble_file_dict("1", asm_obj.assembly_drawing_raw, "Assembly Drawing Source PDF", fileUtilities.get_file_name_by_id(asm_obj.assembly_drawing_source), "AD SOURCE", get_download_query_string(asm_obj.assembly_drawing_raw)))
    file_list.append(util.assemble_file_dict("1", asm_obj.assembly_drawing_raw, "Assembly Drawing", fileUtilities.get_file_name_by_id(
        asm_obj.assembly_drawing_raw), "AD_RAW", get_download_query_string(asm_obj.assembly_drawing_raw)))

    # TODO there is currently no processing of the assembly drawing.
    # The print file should only be visible if it has data.
    if asm_obj.assembly_drawing != -1 and asm_obj.assembly_drawing != None:
        file_list.append(util.assemble_file_dict("2", asm_obj.assembly_drawing, "Assembly Drawing Print",
                         fileUtilities.get_file_name_by_id(asm_obj.assembly_drawing), "AD", get_download_query_string(asm_obj.assembly_drawing)))

    currentFiles = []
    if asm_obj.generic_file_ids != None:
        if len(asm_obj.generic_file_ids) > 0:
            currentFiles = asm_obj.generic_file_ids
    if len(currentFiles) > 0:
        for i, file_id in enumerate(currentFiles):
            try:
                file_obj = File.objects.get(id=file_id)
                # print(file_obj.display_name)
                entry = util.assemble_file_dict(str(i+2), file_id, file_obj.display_name, fileUtilities.get_file_name_by_id(file_id),
                                                "Generic",  fileUtilities.get_file_uri_formatted("file", "files", file_id))
                # print(entry)
                file_list.append(entry)
            except File.DoesNotExist:
                continue
    return Response(file_list)


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def connect_file_with_asm(request, file_id):  # DEPRECATED
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    data = request.data
    if data == None:
        return Response("No data sent with request", status=status.HTTP_400_BAD_REQUEST)
    if file_id == None:
        return Response("No file id sent with the request", status=status.HTTP_400_BAD_REQUEST)
    if 'asm_id' not in data:
        return Response("No asm id sent with the request", status=status.HTTP_400_BAD_REQUEST)
    try:
        file = File.objects.get(id=file_id)
        try:
            asm = Assembly.objects.get(id=data['asm_id'])
            if 'file_type' in data:
                if data['file_type'] == "AD_RAW":
                    # print("Got raw")
                    Assembly.objects.filter(id=data['asm_id']).update(assembly_drawing_raw=file.id)
                elif data['file_type'] == "AD":
                    # print("Got AD")
                    Assembly.objects.filter(id=data['asm_id']).update(assembly_drawing=file.id)
                elif data['file_type'] == "Generic":
                    currentFiles = []
                    if asm.generic_file_ids != None:
                        if len(asm.generic_file_ids) > 0:
                            currentFiles = asm.generic_file_ids
                    # print("Before", currentFiles)
                    currentFiles.append(file.id)
                    # print("After", currentFiles)
                    Assembly.objects.filter(id=data['asm_id']).update(generic_file_ids=currentFiles)
                return Response("Uploaded files", status=status.HTTP_200_OK)
            else:
                currentFiles = []
                if asm.generic_file_ids != None:
                    if len(asm.generic_file_ids) > 0:
                        currentFiles = asm.generic_file_ids
                # print("Before", currentFiles)
                currentFiles.append(file.id)
                # print("After", currentFiles)
                Assembly.objects.filter(id=data['asm_id']).update(generic_file_ids=currentFiles)
                return Response("Uploaded files", status=status.HTTP_200_OK)
        except Assembly.DoesNotExist:
            return Response("Assembly ID not valid, entity not found.", status=status.HTTP_400_BAD_REQUEST)
    except File.DoesNotExist:
        return Response("File ID not valid, entity not found.", status=status.HTTP_400_BAD_REQUEST)


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
def remove_file_connection(request, file_id):  # DEPRECATED
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response

    data = request.data
    if data == None:
        return Response("No data sent with the request", status=status.HTTP_400_BAD_REQUEST)
    if 'asm_id' not in data:
        return Response("Assembly ID missing from request data", status=status.HTTP_400_BAD_REQUEST)
    try:
        asm = Assembly.objects.get(id=data['asm_id'])
        currentFiles = []
        if asm.generic_file_ids != None:
            if len(asm.generic_file_ids) > 0:
                currentFiles = asm.generic_file_ids
        if file_id not in currentFiles:
            return Response("No file to remove", status=status.HTTP_304_NOT_MODIFIED)
        fileHistory = []
        if asm.generic_files_used != None:
            if len(asm.generic_files_used) > 0:
                fileHistory = asm.generic_files_used
        for i, value in enumerate(currentFiles):
            # print("\n",i,":", file_id, "vs", value)
            if file_id == value:
                currentFiles.pop(i)
                fileHistory.append(file_id)
                break
        Assembly.objects.filter(id=data['asm_id']).update(
            generic_file_ids=currentFiles,
            generic_files_used=fileHistory
        )
        return Response("File removed", status=status.HTTP_200_OK)
    except Assembly.DoesNotExist:
        return Response("Assembly object not found", status=status.HTTP_204_NO_CONTENT)
