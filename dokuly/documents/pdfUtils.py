"""
PDF processing utilities for document management.

This module contains helper functions for PDF processing, thumbnail generation,
and related operations. It's separated from views.py to avoid circular imports.
"""

import os
import uuid
import tempfile
import shutil
import traceback
from io import BytesIO

from PIL import Image as PILImage
from pdf2image import convert_from_bytes
from django.core.files.base import ContentFile

from files.models import Image
from files.fileUtilities import delete_image_with_cleanup


def generate_pdf_thumbnail(pdf_file, document_title="thumbnail"):
    """
    Generate a thumbnail image from the first page of a PDF file.
    
    Args:
        pdf_file: A file-like object containing the PDF data
        document_title: Title to use for the thumbnail image name
        
    Returns:
        Image object if successful, None otherwise
    """
    
    temp_dir = None
    buffer = None
    images = None
    
    try:
        # Read the PDF file content
        pdf_file.seek(0)
        pdf_content = pdf_file.read()
        
        if not pdf_content:
            print("Error generating PDF thumbnail: Empty PDF content")
            return None
        
        # Create a temporary directory for pdf2image to use
        temp_dir = tempfile.mkdtemp(prefix='dokuly_pdf_thumb_')
        
        # Convert first page of PDF to image
        images = convert_from_bytes(
            pdf_content,
            first_page=1,
            last_page=1,
            dpi=150,  # Resolution for the thumbnail
            fmt='png',
            output_folder=temp_dir,  # Use temp dir to control cleanup
            paths_only=False
        )
        
        if not images:
            print("Error generating PDF thumbnail: No images returned from convert_from_bytes")
            return None
            
        # Get the first page image
        page_image = images[0]
        
        # Create thumbnail (max 300x300 while maintaining aspect ratio)
        page_image.thumbnail((300, 300), PILImage.Resampling.LANCZOS)
        
        # Save to bytes buffer
        buffer = BytesIO()
        page_image.save(buffer, format='PNG', optimize=True)
        buffer.seek(0)
        
        # Create Image model instance
        thumbnail = Image()
        thumbnail.image_name = f"{document_title}_thumbnail.png"
        thumbnail.file.save(
            f"{uuid.uuid4().hex}_thumbnail.png",
            ContentFile(buffer.read()),
            save=True
        )

        return thumbnail
        
    except Exception as e:
        print(f"Error generating PDF thumbnail: {e}")
        print(traceback.format_exc())
        return None
    finally:
        # Clean up resources
        if buffer:
            buffer.close()
        
        # Close PIL images to release resources
        if images:
            for img in images:
                try:
                    img.close()
                except:
                    pass
        
        # Clean up temporary directory and its contents
        if temp_dir and os.path.exists(temp_dir):
            try:
                shutil.rmtree(temp_dir)
            except Exception as cleanup_error:
                print(f"Warning: Failed to clean up temp directory {temp_dir}: {cleanup_error}")


def process_pdf_and_generate_thumbnail(document_id, org_id, user=None, regenerate_thumbnail=True):
    """
    Process a PDF document and generate/regenerate its thumbnail.
    
    This function:
    1. Processes the PDF (adds front page, revision table, etc.)
    2. Refreshes the document to get the updated pdf field
    3. Deletes the old thumbnail if it exists
    4. Generates a new thumbnail from the processed PDF
    
    Args:
        document_id: ID of the Document object
        org_id: Organization ID for processing
        user: User object for logging (optional)
        regenerate_thumbnail: Whether to regenerate the thumbnail (default: True)
        
    Returns:
        None
    """
    # Import here to avoid circular imports (Document model and process_pdf)
    from documents.models import Document
    from documents.pdfProcessor import process_pdf, find_referenced_items
    
    try:
        # Get the document
        document = Document.objects.get(id=document_id)
        
        # Determine if we can process the PDF
        has_pdf_source = document.pdf_source and document.pdf_source.file and document.pdf_source.file.name
        has_pdf_print = document.pdf_print and document.pdf_print.file and document.pdf_print.file.name
        
        if not has_pdf_source and not has_pdf_print:
            print(f"Document {document_id} has no PDF files to process")
            return
        
        # Process PDF if we have pdf_source (adds front page, revision table, etc.)
        if has_pdf_source:
            process_pdf(document_id, org_id)
            
            # Refresh document to get the updated pdf_print field from process_pdf
            document.refresh_from_db()
        
        if regenerate_thumbnail:
            # Archive old thumbnail if it exists
            if document.thumbnail:
                try:
                    delete_image_with_cleanup(document.thumbnail)
                except Exception as e:
                    print(f"Failed to delete old thumbnail: {e}")
            
            # Generate new thumbnail from the final processed PDF (not raw PDF)
            # This ensures the thumbnail shows the front page if enabled
            # Use pdf_print if available (processed), otherwise use pdf_source
            pdf_to_thumbnail = None
            if document.pdf_print and document.pdf_print.file and document.pdf_print.file.name:
                pdf_to_thumbnail = document.pdf_print.file
            elif document.pdf_source and document.pdf_source.file and document.pdf_source.file.name:
                pdf_to_thumbnail = document.pdf_source.file
            
            if pdf_to_thumbnail:
                try:
                    with pdf_to_thumbnail.open('rb') as pdf_file:
                        thumbnail = generate_pdf_thumbnail(pdf_file, document.title)
                        if thumbnail:
                            document.thumbnail = thumbnail
                            document.save()
                except Exception as e:
                    print(f"Failed to generate thumbnail: {e}")
                    traceback.print_exc()
        
        # This is deprecated now that document numbers can be arbitrary. Manual referencing must be added.
        # # Find and link referenced items in the PDF (only if we have a pdf_source to scan)
        # if has_pdf_source:
        #     try:
        #         find_referenced_items(document_id)
        #     except Exception as e:
        #         print(f"Failed to find referenced items: {e}")
            
    except Exception as e:
        print(f"Error in process_pdf_and_generate_thumbnail: {e}")
        traceback.print_exc()
        raise
