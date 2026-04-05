import jwt
import logging
import re
import requests
import uuid
from datetime import timedelta

from django.conf import settings
from django.core.signing import TimestampSigner, BadSignature, SignatureExpired
from django.http import FileResponse
from django.utils import timezone
from django.core.files.base import ContentFile

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, renderer_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response

from .models import File, FileLock
from .fileUtilities import delete_file_with_cleanup, save_file_content
from profiles.models import Profile
from profiles.views import check_permissions_admin
from projects.views import check_project_access
from documents.models import Document
from documents.pdfUtils import process_pdf_and_generate_thumbnail

logger = logging.getLogger(__name__)


LOCK_DURATION_HOURS = 1

# Map file extensions to OnlyOffice document types
DOCUMENT_TYPES = {
    "docx": "word", "doc": "word", "odt": "word", "rtf": "word", "txt": "word",
    "xlsx": "cell", "xls": "cell", "ods": "cell", "csv": "cell",
    "pptx": "slide", "ppt": "slide", "odp": "slide",
}


def _get_document_type(filename):
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return DOCUMENT_TYPES.get(ext, "word")


def _generate_file_token(file_id):
    """Generate a time-limited signed token for OODS to download the file."""
    signer = TimestampSigner()
    return signer.sign(str(file_id))


def _verify_file_token(token, file_id, max_age=3600):
    """Verify a signed file download token. Returns True if valid."""
    signer = TimestampSigner()
    try:
        value = signer.unsign(token, max_age=max_age)
        return str(value) == str(file_id)
    except (BadSignature, SignatureExpired):
        return False


def _sign_jwt(payload):
    """Sign a payload with the OnlyOffice JWT secret."""
    return jwt.encode(payload, settings.ONLYOFFICE_JWT_SECRET, algorithm="HS256")


def _verify_jwt(token):
    """Verify and decode a JWT from OnlyOffice."""
    return jwt.decode(token, settings.ONLYOFFICE_JWT_SECRET, algorithms=["HS256"])


def _get_or_create_lock(file_obj, user):
    """Try to acquire a lock. Returns (lock, is_owner, is_read_only)."""
    try:
        lock = FileLock.objects.get(file=file_obj)
        if lock.is_expired():
            # Expired lock — take it over
            lock.locked_by = user
            lock.locked_at = timezone.now()
            lock.expires_at = timezone.now() + timedelta(hours=LOCK_DURATION_HOURS)
            lock.session_key = str(uuid.uuid4())
            lock.save()
            return lock, True, False
        if lock.locked_by == user:
            # Already locked by this user — extend
            lock.expires_at = timezone.now() + timedelta(hours=LOCK_DURATION_HOURS)
            lock.save()
            return lock, True, False
        # Locked by someone else
        return lock, False, True
    except FileLock.DoesNotExist:
        # No lock — create one
        lock = FileLock.objects.create(
            file=file_obj,
            locked_by=user,
            expires_at=timezone.now() + timedelta(hours=LOCK_DURATION_HOURS),
            session_key=str(uuid.uuid4()),
        )
        return lock, True, False


def _make_document_key(file_obj):
    """Generate a unique document key for OODS caching.
    Must change whenever file content changes.
    Uses the storage path hash so it changes on every save_file_content call."""
    file_name = file_obj.file.name if file_obj.file else ""
    timestamp = int(file_obj.last_updated.timestamp() * 1000) if file_obj.last_updated else 0
    return f"{file_obj.id}_{timestamp}_{hash(file_name) & 0xFFFF:04x}"


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def get_editor_config(request, file_id):
    """Return the OnlyOffice editor configuration for a file."""
    user = request.user

    try:
        file_obj = File.objects.get(id=file_id)
    except File.DoesNotExist:
        return Response("File not found", status=status.HTTP_404_NOT_FOUND)

    # Check project access
    file_qs = File.objects.filter(id=file_id)
    if not check_project_access(file_qs, user):
        return Response("Unauthorized", status=status.HTTP_403_FORBIDDEN)

    # Determine filename and extension
    # Always derive extension from the actual storage filename, not display_name
    storage_name = file_obj.file.name.split("/")[-1] if file_obj.file else "document"
    filename = file_obj.display_name or storage_name
    ext = storage_name.rsplit(".", 1)[-1].lower() if "." in storage_name else "docx"

    # Check if this is a released document (read-only)
    force_read_only = False
    docs = Document.objects.filter(files=file_obj)
    for doc in docs:
        if doc.release_state == "Released":
            force_read_only = True
            break

    # Lock management
    if force_read_only:
        lock = None
        is_owner = False
        is_read_only = True
    else:
        lock, is_owner, is_read_only = _get_or_create_lock(file_obj, user)

    # Generate temporary download token for OODS
    file_token = _generate_file_token(file_id)
    callback_base = settings.ONLYOFFICE_CALLBACK_BASE
    download_url = f"{callback_base}/api/files/onlyoffice/download/{file_id}/?token={file_token}"
    callback_url = f"{callback_base}/api/files/onlyoffice/callback/{file_id}/"

    # Build editor config
    doc_type = _get_document_type(storage_name)

    config = {
        "documentType": doc_type,
        "document": {
            "fileType": ext,
            "key": _make_document_key(file_obj),
            "title": filename,
            "url": download_url,
            "permissions": {
                "edit": not is_read_only,
                "download": True,
                "print": True,
                "review": False,
                "comment": False,
            },
        },
        "editorConfig": {
            "callbackUrl": callback_url,
            "mode": "view" if is_read_only else "edit",
            "lang": "en",
            "user": {
                "id": str(user.id),
                "name": f"{user.first_name} {user.last_name}".strip() or user.username,
            },
        },
    }

    # Sign the config with JWT for OODS
    config["token"] = _sign_jwt(config)

    # Include lock info for the frontend
    lock_info = None
    if lock and not lock.is_expired():
        lock_info = {
            "locked_by_id": lock.locked_by.id,
            "locked_by_name": f"{lock.locked_by.first_name} {lock.locked_by.last_name}".strip() or lock.locked_by.username,
            "expires_at": lock.expires_at.isoformat(),
            "is_owner": is_owner,
        }

    return Response({
        "config": config,
        "is_read_only": is_read_only,
        "lock_info": lock_info,
        "ds_url": settings.ONLYOFFICE_DS_URL,
    }, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([AllowAny])
def download_file_for_oods(request, file_id):
    """Unauthenticated file download endpoint for OnlyOffice Document Server.
    Protected by a time-limited signed token."""
    token = request.GET.get("token")
    if not token:
        return Response("Token required", status=status.HTTP_401_UNAUTHORIZED)

    if not _verify_file_token(token, file_id):
        return Response("Invalid or expired token", status=status.HTTP_403_FORBIDDEN)

    try:
        file_obj = File.objects.get(id=file_id)
        return FileResponse(file_obj.file.open("rb"), status=status.HTTP_200_OK)
    except File.DoesNotExist:
        return Response("File not found", status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response(str(e), status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@permission_classes([AllowAny])
def editor_callback(request, file_id):
    """Callback endpoint called by OnlyOffice Document Server when editing events occur.
    Status codes from OODS:
        0 - no document with the key identifier could be found
        1 - document is being edited
        2 - document is ready for saving
        3 - document saving error
        4 - document is closed with no changes
        6 - document is being edited, but the current document state is saved
        7 - error has occurred while force saving the document
    """
    body = request.data
    logger.warning(f"OnlyOffice callback for file {file_id}: {body}")

    # Verify JWT from OODS — required since our OODS is configured with JWT_SECRET
    token = body.get("token")
    if not token:
        logger.warning(f"OnlyOffice callback missing JWT for file {file_id}")
        return Response({"error": 1}, status=status.HTTP_403_FORBIDDEN)
    try:
        _verify_jwt(token)
    except jwt.InvalidTokenError:
        logger.warning(f"OnlyOffice callback JWT verification failed for file {file_id}")
        return Response({"error": 1}, status=status.HTTP_403_FORBIDDEN)

    cb_status = body.get("status")

    try:
        file_obj = File.objects.get(id=file_id)
    except File.DoesNotExist:
        return Response({"error": 1}, status=status.HTTP_404_NOT_FOUND)

    # Status 2: document ready for saving, Status 6: force save
    if cb_status in (2, 6):
        download_url = body.get("url")
        # OODS may return URLs with its external address (e.g. localhost:8088)
        # which isn't reachable from inside Docker. Rewrite to internal hostname.
        if download_url:
            download_url = re.sub(
                r'^https?://[^/]+',
                settings.ONLYOFFICE_INTERNAL_DS_URL,
                download_url
            )
        logger.warning(f"OnlyOffice save: status={cb_status}, url={download_url}")
        if download_url:
            try:
                resp = requests.get(download_url, timeout=120)
                resp.raise_for_status()
                logger.warning(f"OnlyOffice downloaded {len(resp.content)} bytes for file {file_id}")

                # Build filename with extension from the storage path or OODS filetype
                storage_name = file_obj.file.name.split("/")[-1] if file_obj.file else ""
                filetype = body.get("filetype", "")
                if "." in storage_name:
                    save_name = storage_name
                elif filetype:
                    base = file_obj.display_name or "document"
                    save_name = f"{base}.{filetype}"
                else:
                    save_name = storage_name or (file_obj.display_name or "document")
                saved_path = save_file_content(file_obj, save_name, ContentFile(resp.content))
                logger.warning(f"OnlyOffice saved file {file_id} at path: {saved_path}")
            except Exception as e:
                logger.error(f"OnlyOffice save error for file {file_id}: {e}", exc_info=True)
                return Response({"error": 1, "message": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    # Status 2 or 4: editing is complete — release lock
    if cb_status in (2, 4):
        FileLock.objects.filter(file=file_obj).delete()

    return Response({"error": 0}, status=status.HTTP_200_OK)


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def unlock_file(request, file_id):
    """Manually release a file lock. Available to lock owner and org admins."""
    user = request.user

    try:
        lock = FileLock.objects.get(file_id=file_id)
    except FileLock.DoesNotExist:
        return Response({"message": "No lock found"}, status=status.HTTP_200_OK)

    # Lock owner can always unlock
    if lock.locked_by == user:
        lock.delete()
        return Response({"message": "Lock released"}, status=status.HTTP_200_OK)

    # Admins can force-unlock
    if check_permissions_admin(user):
        lock.delete()
        return Response({"message": "Lock released by admin"}, status=status.HTTP_200_OK)

    return Response("Not authorized to release this lock", status=status.HTTP_403_FORBIDDEN)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def get_lock_status(request, file_id):
    """Check the lock status of a file."""
    try:
        lock = FileLock.objects.get(file_id=file_id)
        if lock.is_expired():
            lock.delete()
            return Response({"locked": False}, status=status.HTTP_200_OK)
        return Response({
            "locked": True,
            "locked_by_id": lock.locked_by.id,
            "locked_by_name": f"{lock.locked_by.first_name} {lock.locked_by.last_name}".strip() or lock.locked_by.username,
            "expires_at": lock.expires_at.isoformat(),
            "is_owner": lock.locked_by == request.user,
        }, status=status.HTTP_200_OK)
    except FileLock.DoesNotExist:
        return Response({"locked": False}, status=status.HTTP_200_OK)


@api_view(("DELETE",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def delete_document_pdf(request, document_id, pdf_type):
    """Delete the pdf_source or pdf_print from a document.
    pdf_type must be 'source' or 'print'."""
    user = request.user
    try:
        doc = Document.objects.get(id=document_id)
    except Document.DoesNotExist:
        return Response("Document not found", status=status.HTTP_404_NOT_FOUND)

    # Check project access
    doc_qs = Document.objects.filter(id=document_id)
    if not check_project_access(doc_qs, user):
        return Response("Unauthorized", status=status.HTTP_403_FORBIDDEN)

    if doc.release_state == "Released":
        return Response("Cannot delete PDFs from a released document", status=status.HTTP_403_FORBIDDEN)

    if pdf_type == "print":
        if doc.pdf_print:
            delete_file_with_cleanup(doc.pdf_print)
            doc.pdf_print = None
            doc.save()
            return Response({"message": "PDF Print deleted"}, status=status.HTTP_200_OK)
        return Response({"message": "No PDF Print to delete"}, status=status.HTTP_200_OK)
    elif pdf_type == "source":
        if doc.pdf_source:
            delete_file_with_cleanup(doc.pdf_source)
            doc.pdf_source = None
            doc.save()
            return Response({"message": "PDF Source deleted"}, status=status.HTTP_200_OK)
        return Response({"message": "No PDF Source to delete"}, status=status.HTTP_200_OK)
    else:
        return Response("Invalid pdf_type, must be 'source' or 'print'", status=status.HTTP_400_BAD_REQUEST)


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated])
def convert_to_pdf(request, file_id):
    """Convert an Office file to PDF using OnlyOffice Conversion API,
    then save it as pdf_source and run the PDF print pipeline."""
    user = request.user

    try:
        file_obj = File.objects.get(id=file_id)
    except File.DoesNotExist:
        return Response("File not found", status=status.HTTP_404_NOT_FOUND)

    # Check access
    file_qs = File.objects.filter(id=file_id)
    if not check_project_access(file_qs, user):
        return Response("Unauthorized", status=status.HTTP_403_FORBIDDEN)

    # Find the parent document
    doc = Document.objects.filter(files=file_obj).first()
    if not doc:
        return Response("No document found for this file", status=status.HTTP_400_BAD_REQUEST)

    # Determine file extension
    storage_name = file_obj.file.name.split("/")[-1] if file_obj.file else ""
    ext = storage_name.rsplit(".", 1)[-1].lower() if "." in storage_name else ""

    # Generate a temporary download token for OODS to fetch the file
    file_token = _generate_file_token(file_id)
    callback_base = settings.ONLYOFFICE_CALLBACK_BASE
    download_url = f"{callback_base}/api/files/onlyoffice/download/{file_id}/?token={file_token}"

    # Build the document key
    doc_key = _make_document_key(file_obj)

    # Call OODS Conversion API
    conversion_payload = {
        "async": False,
        "filetype": ext,
        "key": f"{doc_key}_pdf",
        "outputtype": "pdf",
        "url": download_url,
    }
    # OODS expects the JWT to wrap the payload under a "payload" key
    conversion_payload["token"] = _sign_jwt({"payload": conversion_payload})

    internal_ds_url = settings.ONLYOFFICE_INTERNAL_DS_URL
    try:
        resp = requests.post(
            f"{internal_ds_url}/ConvertService.ashx",
            json=conversion_payload,
            headers={
                "Content-Type": "application/json",
                "Accept": "application/json",
            },
            timeout=120,
        )
        resp.raise_for_status()
        result = resp.json()
    except Exception as e:
        logger.error(f"OODS conversion request failed: {e}")
        return Response(
            {"error": f"Conversion request failed: {str(e)}"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    if result.get("error"):
        return Response(
            {"error": f"Conversion failed with error code {result['error']}"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    pdf_url = result.get("fileUrl")
    if not pdf_url:
        return Response(
            {"error": "No PDF URL returned from conversion"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    # Rewrite URL to internal Docker hostname
    pdf_url = re.sub(r'^https?://[^/]+', internal_ds_url, pdf_url)

    # Download the converted PDF
    try:
        pdf_resp = requests.get(pdf_url, timeout=120)
        pdf_resp.raise_for_status()
    except Exception as e:
        logger.error(f"Failed to download converted PDF: {e}")
        return Response(
            {"error": f"Failed to download converted PDF: {str(e)}"},
            status=status.HTTP_502_BAD_GATEWAY,
        )

    # Save new pdf_source first, then delete old to prevent data loss
    old_pdf_source = doc.pdf_source

    pdf_file = File()
    pdf_file.display_name = f"{file_obj.display_name or storage_name} (PDF Source)"
    pdf_file.project = file_obj.project
    pdf_filename = storage_name.rsplit(".", 1)[0] + ".pdf" if "." in storage_name else "document.pdf"
    pdf_file.file.save(
        f"{uuid.uuid4().hex}/{pdf_filename}",
        ContentFile(pdf_resp.content),
    )
    pdf_file.save()

    doc.pdf_source = pdf_file
    doc.save()

    # Only delete old pdf_source after new one is safely saved
    if old_pdf_source:
        try:
            delete_file_with_cleanup(old_pdf_source)
        except Exception:
            pass

    # Run the PDF print pipeline
    org_id = -1
    try:
        profile = Profile.objects.get(user=user)
        if profile.organization_id and profile.organization_id != -1:
            org_id = profile.organization_id
    except Profile.DoesNotExist:
        pass

    try:
        process_pdf_and_generate_thumbnail(doc.id, org_id, user=user)
    except Exception as e:
        logger.error(f"PDF pipeline failed: {e}", exc_info=True)
        return Response(
            {"message": "PDF created but pipeline processing failed", "error": str(e)},
            status=status.HTTP_200_OK,
        )

    return Response(
        {"message": "PDF generated and processed successfully"},
        status=status.HTTP_200_OK,
    )
