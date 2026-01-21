import os
import random
import io
import mimetypes
from documents.models import MarkdownText
from django.db import transaction
from files.models import Image, File
from PIL import Image as PILImage
from django.core.files.uploadedfile import InMemoryUploadedFile

import logging
import requests
import tempfile
import uuid
from django.core.files.base import ContentFile
from rest_framework import status
from rest_framework.response import Response

from parts.models import PartType

if __name__ == "__main__":
    import doctest
    doctest.testmod()


def copy_markdown_tabs_to_new_revision(current_obj, new_obj):
    if hasattr(current_obj, 'markdown_note_tabs'):
        existing_tabs = list(current_obj.markdown_note_tabs.all())
        new_tabs = [
            MarkdownText(
                text=tab.text,
                created_by=tab.created_by,
                title=tab.title,
            )
            for tab in existing_tabs
        ]

        with transaction.atomic():
            # Bulk create new MarkdownText instances
            MarkdownText.objects.bulk_create(new_tabs)

            # Associate all new tabs with new_obj
            new_obj.markdown_note_tabs.add(*new_tabs)
            # Preserve the is_latest_revision flag when saving
            is_latest = new_obj.is_latest_revision
            new_obj.save()
            if is_latest:
                new_obj.is_latest_revision = True
                new_obj.save()


def resolve_part_type_for_module(part_type_id, applies_to):
    """
    Helper for create/update endpoints that accept `part_type`.

    Returns (part_type, error_response). If error_response is not None, caller
    should immediately return it.

    - part_type_id may be int/str/None
    - applies_to must be one of: "Part", "PCBA", "Assembly"
    """
    if part_type_id in (None, "", -1, "-1"):
        return None, None

    try:
        part_type_pk = int(part_type_id)
    except (TypeError, ValueError):
        return None, Response(
            "Invalid part_type id", status=status.HTTP_400_BAD_REQUEST
        )

    try:
        part_type = PartType.objects.get(pk=part_type_pk)
    except PartType.DoesNotExist:
        return None, Response(
            f"Part type with id {part_type_pk} not found",
            status=status.HTTP_400_BAD_REQUEST,
        )

    if part_type.applies_to != applies_to:
        return None, Response(
            f"Part type '{part_type.name}' does not apply to {applies_to}",
            status=status.HTTP_400_BAD_REQUEST,
        )

    return part_type, None


def download_image_and_create_thumbnail(part, image_url, user=None):
    """
    Download an image from a URL and create a thumbnail for the part.
    Returns True if successful, False otherwise.
    Automatically cleans up temporary files.
    Creates both original and compressed versions.
    """
    temp_file_path = None
    try:
        # Download image from URL
        response = requests.get(image_url, timeout=10, stream=True)
        response.raise_for_status()

        # Check content type
        content_type = response.headers.get('content-type', '')
        if not content_type.startswith('image/'):
            logging.warning(f"URL does not point to an image: {content_type}")
            return False

        # Get file extension from content type or URL
        ext = '.jpg'
        if 'png' in content_type:
            ext = '.png'
        elif 'jpeg' in content_type or 'jpg' in content_type:
            ext = '.jpg'
        elif 'gif' in content_type:
            ext = '.gif'
        elif 'webp' in content_type:
            ext = '.webp'
        elif 'svg' in content_type:
            ext = '.svg'

        # Create a temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
        temp_file_path = temp_file.name

        # Write image data to temporary file
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                temp_file.write(chunk)
        temp_file.close()

        # Create Image object and upload
        with open(temp_file_path, 'rb') as f:
            image_content = f.read()

            # Delete old thumbnail if exists
            if part.thumbnail:
                old_thumbnail = Image.objects.get(id=part.thumbnail.pk)
                if old_thumbnail.file:
                    old_thumbnail.file.delete()
                if old_thumbnail.image_compressed:
                    old_thumbnail.image_compressed.delete()
                old_thumbnail.delete()

            # Create new thumbnail
            new_thumbnail = Image(
                image_name=f"thumbnail_{part.full_part_number}",
                project=part.project if part.project else None
            )
            new_thumbnail.save()

            # Save the original file
            unique_folder = uuid.uuid4().hex
            file_name = f"{part.full_part_number}_thumbnail{ext}"
            new_thumbnail.file.save(f"{unique_folder}/{file_name}", ContentFile(image_content))

            # Create compressed version using existing compress_image function
            try:
                from files.views import compress_image
                # Reset file pointer and create a file-like object
                f.seek(0)
                compressed_file = compress_image(f, file_name, unique_folder)
                new_thumbnail.image_compressed.save(
                    f"{unique_folder}/compressed_{file_name}", compressed_file
                )
                logging.info(f"Created compressed thumbnail using compress_image function")
            except Exception as comp_error:
                logging.warning(f"Failed to create compressed version: {str(comp_error)}")

            # Attach to part
            part.thumbnail = new_thumbnail
            part.image_url = ""  # Clear image_url after successful download
            part.save()

        logging.info(f"Successfully created thumbnail for part {part.id} from {image_url}")
        return True

    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to download image from {image_url}: {str(e)}")
        return False
    except Exception as e:
        logging.error(f"Failed to create thumbnail from {image_url}: {str(e)}")
        return False
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                logging.warning(f"Failed to delete temporary file {temp_file_path}: {str(e)}")


def download_datasheet_and_attach(part, datasheet_url, user=None):
    """
    Download a datasheet from a URL and attach it to the part.
    Returns True if successful, False otherwise.
    Automatically cleans up temporary files.
    """
    temp_file_path = None
    try:
        # Download datasheet from URL
        response = requests.get(datasheet_url, timeout=30, stream=True)
        response.raise_for_status()

        # Get content type and file extension
        content_type = response.headers.get('content-type', 'application/pdf')

        # Try to get extension from content type or URL
        ext = '.pdf'
        if content_type:
            guess_ext = mimetypes.guess_extension(content_type)
            if guess_ext:
                ext = guess_ext

        # Fallback to URL extension if available
        if ext == '.pdf' and '.' in datasheet_url.split('/')[-1]:
            url_ext = '.' + datasheet_url.split('/')[-1].split('.')[-1].lower()
            if url_ext in ['.pdf', '.doc', '.docx', '.txt', '.xlsx', '.xls']:
                ext = url_ext

        # Create a temporary file
        temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=ext)
        temp_file_path = temp_file.name

        # Write datasheet data to temporary file
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                temp_file.write(chunk)
        temp_file.close()

        # Create File object and upload
        with open(temp_file_path, 'rb') as f:
            file_content = f.read()

            # Delete old datasheet file if exists (check files with "datasheet" in display_name)
            if hasattr(part, 'files') and part.files.exists():
                old_datasheets = part.files.filter(display_name__icontains='datasheet')
                for old_datasheet in old_datasheets:
                    if old_datasheet.file:
                        old_datasheet.file.delete()
                    old_datasheet.delete()

            # Create new datasheet file
            new_datasheet = File(
                display_name=f"Datasheet_{part.full_part_number}{ext}",
                active=1,
                project=part.project if part.project else None
            )
            new_datasheet.save()

            # Save the file
            unique_folder = uuid.uuid4().hex
            file_name = f"{part.full_part_number}_datasheet{ext}"
            new_datasheet.file.save(f"{unique_folder}/{file_name}", ContentFile(file_content))

            # Attach to part via ManyToMany
            part.files.add(new_datasheet)

            # Clear datasheet URL after successful download
            part.datasheet = ""
            part.save()

        logging.info(f"Successfully downloaded datasheet for part {part.id} from {datasheet_url}")
        return True

    except requests.exceptions.RequestException as e:
        logging.error(f"Failed to download datasheet from {datasheet_url}: {str(e)}")
        return False
    except Exception as e:
        logging.error(f"Failed to attach datasheet from {datasheet_url}: {str(e)}")
        return False
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except Exception as e:
                logging.warning(f"Failed to delete temporary file {temp_file_path}: {str(e)}")
