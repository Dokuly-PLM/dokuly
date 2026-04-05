import json
import logging
import os
import subprocess
import tempfile
import uuid

from django.conf import settings
from django.core.files.base import ContentFile
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.http import FileResponse

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, renderer_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response

from .models import File
from projects.views import check_project_access

logger = logging.getLogger(__name__)

STEP_EXTENSIONS = {"step", "stp"}


def _is_step_file(file_obj):
    """Check if a File object contains a STEP/STP file."""
    name = file_obj.file.name if file_obj.file else ""
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    return ext in STEP_EXTENSIONS


def _generate_viewer_token(file_id):
    """Generate a time-limited signed token for the 3D viewer to download the GLB."""
    signer = TimestampSigner()
    return signer.sign(str(file_id))


def _verify_viewer_token(token, file_id, max_age=3600):
    """Verify a signed viewer download token. Returns True if valid."""
    signer = TimestampSigner()
    try:
        value = signer.unsign(token, max_age=max_age)
        return str(value) == str(file_id)
    except (BadSignature, SignatureExpired):
        return False


def convert_step_file(file_obj):
    """Convert a STEP file to GLB using the Node.js converter script.

    Downloads the STEP file from storage, runs the converter,
    and saves the resulting GLB back to storage on the file object.

    Returns True on success, False on failure.
    """
    if not _is_step_file(file_obj):
        return False

    # Determine path to converter script
    # In Docker: /dokuly_image/scripts/convert_step_to_glb.mjs
    # Local dev: relative to manage.py
    script_paths = [
        "/dokuly_image/scripts/convert_step_to_glb.mjs",
        os.path.join(settings.BASE_DIR, "..", "scripts", "convert_step_to_glb.mjs"),
    ]
    script_path = None
    for p in script_paths:
        if os.path.exists(p):
            script_path = p
            break

    if not script_path:
        logger.error("STEP converter script not found")
        return False

    with tempfile.TemporaryDirectory() as tmpdir:
        # Download STEP file from storage to temp file
        step_path = os.path.join(tmpdir, "input.step")
        glb_path = os.path.join(tmpdir, "output.glb")

        try:
            with open(step_path, "wb") as f:
                for chunk in file_obj.file.chunks():
                    f.write(chunk)
        except Exception as e:
            logger.error(f"Failed to download STEP file {file_obj.id}: {e}")
            return False

        # Run the converter
        try:
            result = subprocess.run(
                ["node", script_path, step_path, glb_path],
                capture_output=True,
                text=True,
                timeout=120,
            )
        except subprocess.TimeoutExpired:
            logger.error(f"STEP conversion timed out for file {file_obj.id}")
            return False
        except Exception as e:
            logger.error(f"STEP conversion failed for file {file_obj.id}: {e}")
            return False

        if result.returncode != 0:
            logger.error(
                f"STEP conversion failed for file {file_obj.id}: {result.stderr}"
            )
            return False

        if not os.path.exists(glb_path):
            logger.error(f"GLB output not found for file {file_obj.id}")
            return False

        # Save GLB to storage
        try:
            with open(glb_path, "rb") as f:
                glb_content = f.read()

            # Delete old converted file if it exists
            if file_obj.step_glb_conversion:
                try:
                    file_obj.step_glb_conversion.delete(save=False)
                except Exception:
                    pass

            glb_filename = f"{uuid.uuid4().hex}/model.glb"
            file_obj.step_glb_conversion.save(
                glb_filename, ContentFile(glb_content), save=True
            )
            logger.info(
                f"STEP file {file_obj.id} converted to GLB ({len(glb_content)} bytes)"
            )
            return True
        except Exception as e:
            logger.error(f"Failed to save GLB for file {file_obj.id}: {e}")
            return False


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def convert_step(request, file_id):
    """Trigger STEP → GLB conversion for a file."""
    user = request.user

    try:
        file_obj = File.objects.get(id=file_id)
    except File.DoesNotExist:
        return Response("File not found", status=status.HTTP_404_NOT_FOUND)

    if not _is_step_file(file_obj):
        return Response(
            "File is not a STEP/STP file", status=status.HTTP_400_BAD_REQUEST
        )

    # Check project access
    file_qs = File.objects.filter(id=file_id)
    if not check_project_access(file_qs, user):
        return Response("Unauthorized", status=status.HTTP_403_FORBIDDEN)

    success = convert_step_file(file_obj)
    if success:
        return Response(
            {"message": "Conversion successful"}, status=status.HTTP_200_OK
        )
    return Response(
        {"error": "Conversion failed"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR
    )


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def get_step_viewer_config(request, file_id):
    """Return configuration for the 3D STEP viewer.

    Returns a download URL (token-protected) for the GLB file,
    or a fallback download URL for the raw STEP file if no GLB exists.
    """
    user = request.user

    try:
        file_obj = File.objects.get(id=file_id)
    except File.DoesNotExist:
        return Response("File not found", status=status.HTTP_404_NOT_FOUND)

    if not _is_step_file(file_obj):
        return Response(
            "File is not a STEP/STP file", status=status.HTTP_400_BAD_REQUEST
        )

    # Check project access
    file_qs = File.objects.filter(id=file_id)
    if not check_project_access(file_qs, user):
        return Response("Unauthorized", status=status.HTTP_403_FORBIDDEN)

    token = _generate_viewer_token(file_id)
    filename = file_obj.display_name or (
        file_obj.file.name.split("/")[-1] if file_obj.file else "model"
    )

    has_glb = bool(file_obj.step_glb_conversion)

    config = {
        "file_id": file_id,
        "filename": filename,
        "has_glb": has_glb,
        "token": token,
    }

    if has_glb:
        config["glb_url"] = f"/api/files/step/glb/{file_id}/?token={token}"
    else:
        config["step_url"] = f"/api/files/step/raw/{file_id}/?token={token}"

    # Find parent entity (Part, Assembly, or Pcba) for thumbnail support
    from parts.models import Part
    from assemblies.models import Assembly
    from pcbas.models import Pcba

    parent_lookups = [
        ("parts", Part, "files"),
        ("assemblies", Assembly, "files"),
        ("pcbas", Pcba, "generic_files"),
    ]
    for app_name, Model, field_name in parent_lookups:
        parent = Model.objects.filter(**{field_name: file_obj}).first()
        if parent:
            config["parent_app"] = app_name
            config["parent_id"] = parent.id
            break

    return Response(config, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([AllowAny])
def download_glb(request, file_id):
    """Serve the converted GLB file. Protected by a time-limited signed token."""
    token = request.GET.get("token")
    if not token:
        return Response("Token required", status=status.HTTP_401_UNAUTHORIZED)

    if not _verify_viewer_token(token, file_id):
        return Response("Invalid or expired token", status=status.HTTP_403_FORBIDDEN)

    try:
        file_obj = File.objects.get(id=file_id)
        if not file_obj.step_glb_conversion:
            return Response("No GLB conversion available", status=status.HTTP_404_NOT_FOUND)
        response = FileResponse(
            file_obj.step_glb_conversion.open("rb"),
            content_type="model/gltf-binary",
        )
        response["Content-Disposition"] = 'inline; filename="model.glb"'
        return response
    except File.DoesNotExist:
        return Response("File not found", status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error serving GLB for file {file_id}: {e}")
        return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([AllowAny])
def download_step_raw(request, file_id):
    """Serve the raw STEP file for client-side parsing. Protected by a time-limited signed token."""
    token = request.GET.get("token")
    if not token:
        return Response("Token required", status=status.HTTP_401_UNAUTHORIZED)

    if not _verify_viewer_token(token, file_id):
        return Response("Invalid or expired token", status=status.HTTP_403_FORBIDDEN)

    try:
        file_obj = File.objects.get(id=file_id)
        if not file_obj.file:
            return Response("No file available", status=status.HTTP_404_NOT_FOUND)
        response = FileResponse(
            file_obj.file.open("rb"),
            content_type="application/octet-stream",
        )
        response["Content-Disposition"] = 'inline; filename="model.step"'
        return response
    except File.DoesNotExist:
        return Response("File not found", status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        logger.error(f"Error serving STEP file {file_id}: {e}")
        return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)
