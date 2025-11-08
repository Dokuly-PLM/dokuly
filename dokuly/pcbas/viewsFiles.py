from django.http import FileResponse

from rest_framework import status
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from django.views.decorators.clickjacking import xframe_options_exempt
from django.core.exceptions import ObjectDoesNotExist
from rest_framework.permissions import IsAuthenticated
from django.contrib.auth.decorators import login_required
from organizations.permissions import APIAndProjectAccess
from django.db.models import Q
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi

from pcbas.models import Pcba
from files.models import File
import files.fileUtilities as fileUtilities

import os
import uuid
import shutil
from django.shortcuts import get_object_or_404

import pcbas.viewUtilities as util
from profiles.views import check_user_auth_and_app_permission, check_permissions_standard
from files.views import check_file_sizes_vs_limit, get_organization_by_user_id, get_organization_by_id
from files.serializers import FileSerializer


def reset_pcb_layers():
    return {
        "copper top": "",
        "copper bot": "",
        "soldermask top": "",
        "soldermask bot": "",
        "silkscreen top": "",
        "silkscreen bot": "",
        "solder paste top": "",
        "solder paste bot": "",
        "board outline": "",
        "drill": "",
        "zip content": [],  # Files uploaded in the zip.
    }


def remove_old_foreign_key_to_gerber_file_in_generic_files(pcba):
    """Replace the previous foreign key in generic files."""
    gerber_files = pcba.generic_files.filter(display_name="Gerber Files")
    for file_obj in gerber_files:
        pcba.generic_files.remove(file_obj)
    pcba.save()


def upload_render(obj, file_name, file_path):
    try:
        # Update top render.
        with open(file_path, 'rb') as file:
            obj.file.save(f"{uuid.uuid4().hex}/{file_name}", file)
    except (IsADirectoryError):
        print(f"Not a file: {file_path}")


def render_gerber_svg(pcba_obj: Pcba, file_obj: File):
    """Renders SVG based on gerber files for the PCBA with the id passed as argument.
    returns false if there is no file to process.
    """

    unique_path = f"/tmp/{uuid.uuid4().hex}/"
    os.mkdir(unique_path)

    full_part_number = f"PCBA{pcba_obj.part_number}{pcba_obj.revision}"

    if not file_obj:
        return False, "No Gerber file provided."

    try:
        # Get Gerber file from bucket file obj
        with file_obj.file.open() as file:
            target_path = f"{unique_path}{fileUtilities.get_file_name(file.name)}"
            try:
                with open(target_path, 'wb+') as gbr_file:
                    gbr_file.write(file.read())
            except Exception as e:
                print("Failed to read file:", str(e))

        zip_contents = util.get_zip_content(target_path)
        # Store gerber names for possible layer corrections in front-end.
        pcba_obj.pcb_layers["zip content"] = zip_contents
        pcba_obj.save()

        # Update the mapping logic here
        pcb_layers = {
            'copper top': [".gtl", "copper_top"],
            'copper bot': [".gbl", "copper_bottom"],
            'soldermask top': [".gts", "soldermask_top"],
            'soldermask bot': [".gbs", "soldermask_bottom"],
            'silkscreen top': [".gto", "silkscreen_top"],
            'silkscreen bot': [".gbo", "silkscreen_bottom"],
            'solder paste top': [".gtp", "solderpaste_top"],
            'solder paste bot': [".gbp", "solderpaste_bottom"],
            'board outline': [".gko", "profile"],
            'drill': [".drl", "drill"],
        }

        # Map zip contents to layers
        for layer, extensions in pcb_layers.items():
            for file in zip_contents:
                if any(ext in file for ext in extensions):
                    pcba_obj.pcb_layers[layer] = file
                    break

        pcba_obj.save()

        # print(f"PCB Layers: {pcba_obj.pcb_layers}")

        # Render images from the gerbers.
        file_paths = util.render_gerber_to_svg(full_part_number, target_path, pcba_obj.pcb_layers)

        if file_paths[0] == "" or file_paths[1] == "":
            return False, "Exception occurred during render."

        if pcba_obj.pcb_renders is None or len(pcba_obj.pcb_renders) == 0:
            top_render_file_obj = File.objects.create()
            top_render_file_obj.display_name = "Top Render"
            top_render_file_obj.project = pcba_obj.project
            top_render_file_obj.save()

            bottom_render_file_obj = File.objects.create()
            bottom_render_file_obj.display_name = "Bottom Render"
            bottom_render_file_obj.project = pcba_obj.project
            bottom_render_file_obj.save()

            file_list = [top_render_file_obj.id, bottom_render_file_obj.id]

            pcba_obj.pcb_renders = file_list

            pcba_obj.save()

            upload_render(top_render_file_obj, f"{full_part_number}_top_render.svg", file_paths[0])
            upload_render(bottom_render_file_obj, f"{full_part_number}_bot_render.svg", file_paths[1])
        else:
            top_render_file_obj = File.objects.get(id=pcba_obj.pcb_renders[0])
            bottom_render_file_obj = File.objects.get(id=pcba_obj.pcb_renders[1])
            top_render_file_obj.project = pcba_obj.project
            bottom_render_file_obj.project = pcba_obj.project
            try:
                # Remove old render files
                top_render_file_obj.file.delete()
                bottom_render_file_obj.file.delete()
            except Exception as e:
                # print(f"Failed to delete old render files: {str(e)}") # TODO: Replace with logging
                pass
            # Upload new render files
            upload_render(top_render_file_obj, f"{full_part_number}_top_render.svg", file_paths[0])
            upload_render(bottom_render_file_obj, f"{full_part_number}_bot_render.svg", file_paths[1])

        shutil.rmtree(unique_path)
        return True, ""
    except Exception as e:
        return False, f"Exception occurred during render. {str(e)}"


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
def update_pcb_layers(request, pcba_id):
    permission, response = check_user_auth_and_app_permission(request, "pcbas")
    if not permission:
        return response
    data = request.data

    # Retrieve the PCB layers from the request data
    pcb_layers = data.get('pcb_layers')

    try:
        pcba = Pcba.objects.get(id=pcba_id)
        # Update the PCB layers of the Pcba object
        pcba.pcb_layers = pcb_layers
        pcba.save()
        file = File.objects.get(id=pcba.gerber_file.id)
        success, message = render_gerber_svg(pcba, file)
        if not success:
            return Response(f"Failed Gerber render! {message}", status=status.HTTP_400_BAD_REQUEST)
        return Response(status=status.HTTP_200_OK)
    except Pcba.DoesNotExist:
        return Response("Pcba not found", status=status.HTTP_404_NOT_FOUND)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
def render_svg(request, pcba_id):
    permission, response = check_user_auth_and_app_permission(request, "pcbas")
    if not permission:
        return response
    data = request.data
    success, message = render_gerber_svg(pcba_id)
    if not success:
        return Response(f"Failed Gerber render! {message}", status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    data = {'pcb_renders': Pcba.objects.get(id=pcba_id).pcb_renders}
    return Response(data, status=status.HTTP_200_OK)


@api_view(['PUT'])
@login_required(login_url='/login')
@permission_classes([IsAuthenticated])
def add_file_to_pcba(request, pcba_id, file_id):
    """
    Adds a file to the pcbas files field.
    """
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "pcbas")
    if not permission:
        return response

    if not check_permissions_standard(user):
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    try:
        pcba = Pcba.objects.get(pk=pcba_id)
        file = File.objects.get(pk=file_id)

        data = request.data

        if "gerber" in data:
            if data["gerber"]:
                # Delete old gerber file
                if pcba.gerber_file:
                    try:
                        pcba.gerber_file.file.delete()
                        pcba.gerber_file.delete()
                    except Exception as e:
                        # TODO: add backend logging
                        pass

                pcba.gerber_file = file
                pcba.pcb_layers = reset_pcb_layers()
                remove_old_foreign_key_to_gerber_file_in_generic_files(pcba)
                render_gerber_svg(pcba, file)

        # Check if the file is already in the files
        if file in pcba.generic_files.all():
            return Response("File already added", status=status.HTTP_409_CONFLICT)

        # Add file
        pcba.generic_files.add(file)
        pcba.save()
        file.project = pcba.project
        file.save()

        return Response(status=status.HTTP_200_OK)

    except ObjectDoesNotExist:
        return Response("Assembly or file not found", status=status.HTTP_404_NOT_FOUND)


@swagger_auto_schema(
    method='post',
    operation_id='upload_file_to_pcba',
    operation_description="""
    Upload a file to a PCBA.
    
    **Required fields:**
    - `file`: The file to upload (multipart/form-data)
    - `display_name`: Name for the file (max 250 characters)
    
    **Optional fields:**
    - `replace_files`: Set to `true` to replace existing file with same display_name. Default: `false`
    - `gerber`: Set to `true` to mark file as Gerber file for PCB layer processing. Default: `false`
    
    **Note:** The PCBA must not be in "Released" state to upload files.
    """,
    tags=['pcbas'],
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
        openapi.Parameter(
            'gerber',
            openapi.IN_FORM,
            type=openapi.TYPE_BOOLEAN,
            required=False,
            description='If true, mark file as Gerber file for PCB layer processing. Default: false'
        ),
    ],
    consumes=['multipart/form-data'],
    responses={
        201: openapi.Response(description='File uploaded successfully'),
        400: openapi.Response(description='Bad request - missing required fields, PCBA is released, or invalid data'),
        401: openapi.Response(description='Unauthorized - invalid API key or no project access'),
        404: openapi.Response(description='PCBA not found'),
        409: openapi.Response(description='Storage limit exceeded'),
    },
    security=[{'Token': []}, {'Api-Key': []}]
)
@api_view(('POST', ))
@renderer_classes((JSONRenderer, ))
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def upload_file_to_pcba(request, pcba_id, **kwargs):
    """
    Upload a file to a PCBA.
    
    Request must be multipart/form-data with:
    - file: The file to upload (required)
    - display_name: Name for the file (required, max 250 chars)
    - replace_files: Boolean, if true replaces existing file with same name (optional)
    - gerber: Boolean, if true marks file as Gerber file for PCB processing (optional)
    """
    # Check if 'file' is in request data
    if "file" not in request.data:
        return Response("No file in request", status=status.HTTP_400_BAD_REQUEST)

    file = request.FILES.get("file")
    if file is None:
        return Response("Invalid file parameters, file is null", status=status.HTTP_400_BAD_REQUEST)

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

    data = request.data
    if data is None:
        return Response("No data in request", status=status.HTTP_400_BAD_REQUEST)

    if request.method != "POST":
        return Response("Only POST allowed", status=status.HTTP_400_BAD_REQUEST)

    if "display_name" not in data:
        return Response("No display name in request", status=status.HTTP_400_BAD_REQUEST)

    display_name = data["display_name"]
    replace_files = data.get("replace_files", False)

    is_gerber_file = str_to_bool(data.get('gerber', False))

    try:
        # Retrieve the PCBA object
        pcba = Pcba.objects.get(pk=pcba_id)
        file_obj = None

        if pcba.release_state == "Released":
            return Response(
                "Can't edit a released pcba!", status=status.HTTP_400_BAD_REQUEST
            )

        if replace_files:
            # Find existing file with matching display_name in pcba.generic_files
            existing_files = pcba.generic_files.filter(display_name=display_name)
            if existing_files.exists():
                existing_file: File = existing_files.first()
                # Delete the old file content
                if existing_file.file:
                    existing_file.file.delete(save=False)
                # Save the new file content on the same File object
                existing_file.file.save(f"{uuid.uuid4().hex}/{file.name}", file)
                existing_file.save()
                file_obj = existing_file
            else:
                # No existing file to replace; create a new one
                # Max display name length is 250 characters
                new_file = File.objects.create(display_name=display_name[:250])
                new_file.file.save(f"{uuid.uuid4().hex}/{file.name}", file)
                new_file.project = pcba.project
                new_file.save()
                pcba.generic_files.add(new_file)
                file_obj = new_file
        else:
            # Not replacing files; create a new File object
            new_file = File.objects.create(display_name=display_name)
            new_file.file.save(f"{uuid.uuid4().hex}/{file.name}", file)
            new_file.project = pcba.project
            new_file.save()
            pcba.generic_files.add(new_file)
            file_obj = new_file

        # Handle gerber files if 'gerber' flag is True
        if is_gerber_file:
            gerber_file = file_obj
            # Delete old gerber file if it's different
            if pcba.gerber_file and pcba.gerber_file.id != gerber_file.id:
                try:
                    pcba.gerber_file.file.delete()
                    pcba.gerber_file.delete()
                except Exception as e:
                    # TODO: add backend logging
                    pass

            # Assign new gerber file
            pcba.gerber_file = gerber_file
            pcba.pcb_layers = reset_pcb_layers()
            remove_old_foreign_key_to_gerber_file_in_generic_files(pcba)
            render_gerber_svg(pcba, gerber_file)

        pcba.save()
        return Response("Ok", status=status.HTTP_201_CREATED)

    except Pcba.DoesNotExist:
        return Response("PCBA not found", status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        # TODO: add backend logging
        return Response(f"Request failed! {str(e)}", status=status.HTTP_400_BAD_REQUEST)


@api_view(('GET', 'PUT', 'POST', 'DELETE'))
@renderer_classes((JSONRenderer, ))
@permission_classes([IsAuthenticated])
def handle_gerber_files(request, pcba_id):
    """Handle Gerber files for a PCBA.
    """
    try:
        pcba = Pcba.objects.get(id=pcba_id)
        if request.method == 'DELETE':
            # Delete current files and file rows.
            try:
                gerber_file = pcba.gerber_file
                if gerber_file:
                    gerber_file.file.delete()
                    gerber_file.delete()
            except Exception as e:
                # TODO add backend logging
                pass

            if len(pcba.pcb_renders) > 0:
                try:
                    for file_id in pcba.pcb_renders:
                        file_obj = File.objects.get(id=file_id)
                        file_obj.file.delete()
                        file_obj.delete()
                except Exception as e:
                    # TODO add backend logging
                    pass

            pcba.gerber_file = None
            pcba.pcb_renders = []
            pcba.pcb_layers = reset_pcb_layers()
            pcba.save()
            return Response("Ok", status=status.HTTP_204_NO_CONTENT)
        if request.method == 'POST':
            return Response("Not implemented yet", status=status.HTTP_200_OK)
        if request.method == 'PUT':
            return Response("Not implemented yet", status=status.HTTP_200_OK)
        if request.method == 'GET':
            return Response("Not implemented yet", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(f"Gerber files handler failed {str(e)}", status=status.HTTP_400_BAD_REQUEST)


# DEPRECATED
@api_view(('POST', ))
@renderer_classes((JSONRenderer, ))
def upload_pcba_file(request):
    """view supporting uploading arbitrary csv file to create a BOM on the PCBA. 
    """
    permission, response = check_user_auth_and_app_permission(request, "pcbas")
    if not permission:
        return response
    data = request.data

    if data == None:
        return Response("No data in request", status=status.HTTP_400_BAD_REQUEST)

    try:
        id = data['pcba_id']
        user = request.user
        pcba_obj = get_object_or_404(
            Pcba, Q(project__project_members=user) | Q(project__isnull=True), id=id
        )
    except Pcba.DoesNotExist:
        return Response(f"No PCBA object found for PCBA ID {data['pcba_id']}", status=status.HTTP_400_BAD_REQUEST)

    if pcba_obj.release_state == 'Released':
        return Response("PCBA is released", status=status.HTTP_400_BAD_REQUEST)

    if not ("pcba_file" in data):
        return Response("No 'pcba_file' found", status=status.HTTP_400_BAD_REQUEST)

    try:
        file_type = data['file_type']
        pcba_file = request.FILES['pcba_file']

        if file_type == "GBR":
            pcba_obj.document_file.save(f"{uuid.uuid4().hex}/{pcba_file.name}", pcba_file)
            render_gerber_svg(data['pcba_id'])
        elif file_type == "AD":
            pcba_obj.assembly_pdf.save(f"{uuid.uuid4().hex}/{pcba_file.name}", pcba_file)
        elif file_type == "MFG":
            pcba_obj.manufacture_pdf.save(f"{uuid.uuid4().hex}/{pcba_file.name}", pcba_file)
        elif file_type == 'SCH':
            pcba_obj.schematic_pdf.save(f"{uuid.uuid4().hex}/{pcba_file.name}", pcba_file)
        else:
            return Response("Cannot recognize file type!", status=status.HTTP_400_BAD_REQUEST)

        return Response(f"{file_type}Document uploaded", status=status.HTTP_200_OK)
    except Exception as e:
        return Response("Request failed!", status=status.HTTP_400_BAD_REQUEST)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
def fetch_file_list(request, id):
    """View for fetching file list to use in the files table.
    """
    permission, response = check_user_auth_and_app_permission(request, "pcbas")
    if not permission:
        return response
    pcba = Pcba.objects.get(id=id)

    file_list = []

    def get_download_query_string_or_none(id, obj, identifier_str):
        file_attr = getattr(obj, identifier_str)
        if file_attr is None:
            return None, None
        else:
            return f"api/pcbas/download/{identifier_str}/{id}/", f"api/pcbas/view/{identifier_str}/{id}/"

    special_files = [
        ("1", "Assembly Drawing", "assembly_pdf", "AD"),
        ("2", "Manufacture Drawing", "manufacture_pdf", "MFG"),
        ("3", "Schematic", "schematic_pdf", "SCH"),
        ("4", "Gerber Files", "document_file", "GBR")
    ]

    for file_id, file_name, attr_name, file_type in special_files:
        file_attr = getattr(pcba, attr_name)
        if file_attr:  # Check if the file attribute is not None
            download_uri, view_uri = get_download_query_string_or_none(id, pcba, attr_name)
            if download_uri and view_uri:
                file_list.append(util.assemble_file_dict(
                    file_id,
                    file_name,
                    util.get_file_name(file_attr),
                    file_type,
                    download_uri,
                    False,
                    view_uri
                ))

    if pcba.generic_files is not None:
        file_objects = pcba.generic_files.all()
        for i, files_row in enumerate(file_objects):
            try:
                download_uri = fileUtilities.get_file_uri_formatted("file", "files", files_row.id)
                view_uri = fileUtilities.get_file_view_uri_formatted("file", "files", files_row.id)
                if download_uri and view_uri:
                    entry = fileUtilities.assemble_file_dict(
                        str(i + 9),
                        files_row.id,
                        files_row.display_name,
                        fileUtilities.get_file_name_by_id(files_row.id),
                        "Generic",
                        download_uri,
                        (files_row.archived == 1),
                        view_uri
                    )
                    file_list.append(entry)
            except File.DoesNotExist:
                continue

    return Response(file_list)


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
def connect_generic_file_with_pcba(request, pcba_id, file_id):
    """Add connection between uploaded file and a PCBA.
    """
    user = request.user
    if user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    data = request.data
    if data == None:
        return Response("No data sent with request", status=status.HTTP_400_BAD_REQUEST)
    if file_id == None:
        return Response("No file id sent with the request", status=status.HTTP_400_BAD_REQUEST)

    try:
        pcba = Pcba.objects.get(id=pcba_id)
        file_obj = File.objects.get(id=file_id)
        file_obj.project = pcba.project
        pcba.generic_files.add(file_obj)
        file_obj.save()
        pcba.save()
        return Response("File connection made.", status=status.HTTP_200_OK)

    except File.DoesNotExist:
        return Response("File ID not valid, entity not found.", status=status.HTTP_400_BAD_REQUEST)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
def download_file(request, file_identifier, pcba_id):
    """Return the actual file to the client.
    It fetches the file from the storage bucket and serves it over HTTP.
    TODO implement download count for files."""
    permission, response = check_user_auth_and_app_permission(request, "pcbas")
    if not permission:
        return response

    user = request.user
    pcba_obj = get_object_or_404(
        Pcba, Q(project__project_members=user) | Q(project__isnull=True), id=pcba_id
    )

    if file_identifier == "schematic_pdf":
        return FileResponse(pcba_obj.schematic_pdf.open('rb'), as_attachment=True)
    elif file_identifier == "assembly_pdf":
        return FileResponse(pcba_obj.assembly_pdf.open('rb'), as_attachment=True)
    elif file_identifier == "manufacture_pdf":
        return FileResponse(pcba_obj.manufacture_pdf.open('rb'), as_attachment=True)
    elif file_identifier == "document_file":
        return FileResponse(pcba_obj.document_file.open('rb'), as_attachment=True)
    else:
        return Response("Can't recognize file identifier!", status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@renderer_classes([JSONRenderer])
@xframe_options_exempt
def view_file(request, file_identifier, pcba_id):
    """Return the actual file to the client.
    It fetches the file from the storage bucket and serves it over HTTP.
    TODO implement download count for files."""
    print("User is authenticated: ", request.user)
    permission, response = check_user_auth_and_app_permission(request, "pcbas")
    if not permission:
        # Directly return the response from the permission check
        return response

    try:
        user = request.user
        pcba_obj = get_object_or_404(
            Pcba, Q(project__project_members=user) | Q(project__isnull=True), id=pcba_id
        )
    except Pcba.DoesNotExist:
        return Response({"error": "PCBA not found"}, status=status.HTTP_404_NOT_FOUND)

    file_response_map = {
        "schematic_pdf": pcba_obj.schematic_pdf,
        "assembly_pdf": pcba_obj.assembly_pdf,
        "manufacture_pdf": pcba_obj.manufacture_pdf,
        "document_file": pcba_obj.document_file
    }

    file_to_serve = file_response_map.get(file_identifier)
    if file_to_serve:
        return FileResponse(file_to_serve.open('rb'), status=status.HTTP_200_OK)
    else:
        return Response({"error": "Can't recognize file identifier"}, status=status.HTTP_400_BAD_REQUEST)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def download_schematic_pdf(request, pcba_id):
    """Return the actual file to the client.
    It fetches the file from the storage bucket and serves it over HTTP.
    TODO implement download count for files."""
    # Fetch file from DB
    user = request.user
    pcba_obj = get_object_or_404(
        Pcba, Q(project__project_members=user) | Q(project__isnull=True), id=pcba_id
    )

    with pcba_obj.schematic_pdf.open('rb') as file:
        # Pack and return to client.
        return FileResponse(file, as_attachment=True)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def download_assembly_pdf(request, pcba_id):
    """Return the actual file to the client.
    It fetches the file from the storage bucket and serves it over HTTP.
    TODO implement download count for files."""
    # Fetch file from DB
    user = request.user
    pcba_obj = get_object_or_404(
        Pcba, Q(project__project_members=user) | Q(project__isnull=True), id=pcba_id
    )

    with pcba_obj.assembly_pdf.open('rb') as file:
        # Pack and return to client.
        return FileResponse(file, as_attachment=True)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def download_manufacture_pdf(request, pcba_id):
    """Return the actual file to the client.
    It fetches the file from the storage bucket and serves it over HTTP.
    TODO implement download count for files."""
    # Fetch file from DB
    user = request.user
    pcba_obj = get_object_or_404(
        Pcba, Q(project__project_members=user) | Q(project__isnull=True), id=pcba_id
    )

    with pcba_obj.manufacture_pdf.open('rb') as file:
        # Pack and return to client.
        return FileResponse(file, as_attachment=True)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def download_gerber(request, pcba_id):
    """Return the actual file to the client.
    It fetches the file from the storage bucket and serves it over HTTP.
    TODO implement download count for files."""
    # Fetch file from DB
    user = request.user
    pcba_obj = get_object_or_404(
        Pcba, Q(project__project_members=user) | Q(project__isnull=True), id=pcba_id
    )

    with pcba_obj.document_file.open('rb') as file:
        # Pack and return to client.
        return FileResponse(file, as_attachment=True)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
def batch_render_gerber(request):
    """Run through and generate gerbers for all pcbas missing renders."""
    permission, response = check_user_auth_and_app_permission(request, "pcbas")
    if not permission:
        return response

    pcbas = Pcba.objects.exclude(archived=1).exclude(is_archived=True)
    for pcba in pcbas:
        render_gerber_svg(pcba.id)

    return Response(status=status.HTTP_200_OK)


def str_to_bool(value):
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in ['true', '1', 'yes', 'on']
    return False
