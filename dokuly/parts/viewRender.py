# views.py
from django.http import HttpResponse, JsonResponse
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from django.contrib.auth.decorators import login_required
from files.models import File
import trimesh
import os
from django.core.files.storage import default_storage
import io
import base64

def convert_threemf_to_gltf(threeMF_data: bytes):
    # Load the 3MF file
    file = io.BytesIO(threeMF_data)
    mesh = trimesh.load(file, file_type='3mf')

    # Export the model to glTF
    gltf_data = mesh.export(file_type="glb")

    return gltf_data

@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def convert_threemf_to_gltf_view(request, file_id):
    if request.user is None:
        return HttpResponse("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)

    # Get the 3MF file
    threeMF_file = File.objects.get(id=file_id)

    # Read the file using default_storage
    with default_storage.open(threeMF_file.file.name, 'rb') as file:
        # Load the data into memory
        threeMF_data = file.read()

        # Convert the 3MF file to glTF
        mesh = trimesh.load(io.BytesIO(threeMF_data), file_type='3mf')
        gltf_data = mesh.export(file_type='glb')

    # Encode the GLTF data as base64
    gltf_data_b64 = base64.b64encode(gltf_data).decode()

    # Create a JSON response with the base64-encoded GLTF data
    file_name = os.path.splitext(os.path.basename(threeMF_file.file.name))[0] + ".glb"
    response_data = {
        "file_name": file_name,
        "gltf_data_b64": gltf_data_b64
    }
    return JsonResponse(response_data)
