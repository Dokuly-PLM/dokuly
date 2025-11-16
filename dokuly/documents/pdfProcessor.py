from documents.models import Document, Document_Prefix

from organizations.models import Organization
from projects.models import Project
from files.models import Image

from datetime import datetime

import os
import uuid
import shutil

# ND Python package
import NdPdfEditor.NdPdfEditor as ndpdf
from NdPdfEditor.NdPdfEditor.editor import Editor

import re
import PyPDF2

from django.db import transaction


def date_str_to_datetime_obj(date_str):
    """Conversion of the two dateitme formats in the SDP database.
    Args:
        date_str (str): the time stamp from the database
    Returns:
        timestamp object
    """
    try:
        datetime_format = "%Y-%m-%dT%H:%M:%SZ"
        timestamp = datetime.strptime(date_str, datetime_format)
    except:
        datetime_format = "%Y-%m-%dT%H:%M:%S.%fZ"
        timestamp = datetime.strptime(date_str, datetime_format)
    return timestamp


def datetime_to_iso_string(datetime_obj):
    """Conversion of the two dateitme formats in the SDP database.
    Args:
        datetime_obj (datetime object): the time stamp.
    Returns:
        yyyy-mm-dd

    ## Example
    >>> input_str   = "2020-07-27T00:00:00Z"
    >>> datetime_format = '%Y-%m-%dT%H:%M:%SZ'
    >>> timestamp = datetime.strptime( input_str, datetime_format)
    >>> datetime_to_iso_string(timestamp)
    '2020-07-27'
    """
    if datetime_obj == None:
        return None

    try:
        return datetime_obj.strftime("%Y-%m-%d")
    except Exception as e:
        print(f"datetime_to_iso_string failed: {e}")
        return None


def process_pdf(
    documentId,
    organization_id,
):

    doc_obj = Document.objects.get(id=documentId)
    if doc_obj.pdf_raw == None or doc_obj.pdf_raw == "":
        return

    # load pdf_raw
    data = Document.objects.get(id=documentId)
    project_data = Project.objects.get(id=data.project.id)

    # Create a unique temp directory for this processing step.
    # Ensures no race condition with other customers processing simultaneously.
    unique_path = f"/tmp/{uuid.uuid4().hex}/"
    os.mkdir(unique_path)
    doc_number = data.full_doc_number
    title = data.title[:220]
    cleaned_file_name = title.replace(" ", "_").replace("/", "_")
    # This file must be accessed after the function has cleaned up its temp folder.
    processed_pdf_file_name = f"{doc_number} - {cleaned_file_name}.pdf"
    processed_pdf_path = unique_path + processed_pdf_file_name

    organization_configured = False
    org_obj = None
    # Get current organization. Assuming only one entry is possible.
    if organization_id != -1:
        try:
            organization_obj = Organization.objects.get(id=organization_id)
            org_obj = organization_obj
            organization_configured = True
        except:
            organization_obj = None
    else:
        organization_obj = None

    # TODO support multiple page formats.
    editor = Editor(orientation="p", format="A4")
    editor.construct_document()

    title = data.title
    if data.created_by != None:
        doc_author = data.created_by.first_name + " " + data.created_by.last_name
    else:
        doc_author = None
    if data.quality_assurance != None:
        doc_checker = (
            f"{data.quality_assurance.first_name} {data.quality_assurance.last_name}"
        )
    else:
        doc_checker = None

    customer_name = data.project.customer.name
    customer_number = str(data.project.customer.customer_id)
    project_number = str(project_data.project_number)
    released_date = data.released_date
    timestamp_obj = released_date
    release_state = data.release_state
    summary = data.summary
    date_string = datetime_to_iso_string(timestamp_obj)

    # Get classification from protection level, fallback to internal field for backwards compatibility
    classification = "Externally Shareable"  # Default
    if data.protection_level is not None:
        classification = data.protection_level.name
    elif data.internal is not None:
        # Fallback to deprecated internal field
        if bool(data.internal) == True:
            classification = "Company Protected"
        else:
            classification = "Externally Shareable"

    # Fetch logo from customers admin database.
    logo_path = ""
    if organization_configured:
        found_logo = True
        if org_obj != None:
            try:
                logo = Image.objects.get(id=org_obj.logo_id)
                os.mkdir(unique_path + "/images")
                try:
                    with logo.file.open() as file:
                        logo_path = f"{unique_path}{file.name}"
                        try:
                            with open(logo_path, "wb+") as logo_file:
                                logo_file.write(file.read())
                        except Exception as e:
                            print(e)
                            found_logo = False
                except:
                    logo_path = ""
                    found_logo = False
            except Image.DoesNotExist:
                found_logo = False

        if not found_logo:
            try:
                if organization_obj != None:
                    with organization_obj.logo.open() as file:
                        logo_path = f"{unique_path}{file.name}"
                        with open(logo_path, "wb+") as logo_file:
                            logo_file.write(file.read())
            except:
                logo_path = ""

    # Fetch document from DB, and store to temp folder.
    target_file_path = f"{unique_path}_target_file.pdf"
    with data.pdf_raw.open() as file:
        with open(target_file_path, "wb+") as destination:
            destination.write(file.read())

    if (doc_obj.front_page == False or doc_obj.front_page == None) and (
        doc_obj.revision_table == False or doc_obj.revision_table == None
    ):  # No edits on the PDF, just copy pdf_raw.
        shutil.copyfile(target_file_path, processed_pdf_path)
    else:
        if doc_obj.front_page == True:
            editor.add_front_page(
                id=doc_number,
                title=title,
                state=release_state,
                released_date=date_string,
                classification=classification,
                customer=customer_name,
                project=customer_number + project_number,
                author=doc_author,
                doc_checker=doc_checker,
                summary=summary,
                logo_path=logo_path,
            )

            # Ensure revision table on separate page.
            if doc_obj.revision_table == True:
                editor.fpdf.add_page()

        if doc_obj.revision_table == True:
            revision_data = []

            def fetch_rev_info(id):
                rev = Document.objects.get(id=id)

                if rev.created_by != None:
                    rev_author = (
                        f"{rev.created_by.first_name} {rev.created_by.last_name}"
                    )
                else:
                    rev_author = ""
                """ TODO
                if data.revision=="A":
                    rev_author = rev.created_by.first_name + ' ' + rev.created_by.last_name
                else:
                    rev_user = User.objects.get(id=id)
                    rev_author = rev_user.first_name + ' ' + rev_user.last_name"""

                date = datetime_to_iso_string(rev.last_updated)

                return {
                    "revision": rev.formatted_revision,  # Use formatted_revision
                    "rev_author": rev_author,
                    "rev_notes": rev.revision_notes,
                    "released_date": date,
                }, rev.previoius_revision_id

            next_id = data.id

            # Basically a while, but with a safety bound as the function is recursive.
            for i in range(0, 255):
                try:
                    rev_info, next_id = fetch_rev_info(next_id)
                    revision_data.append(rev_info)
                except:
                    print("Failed fetching data for revision.")
                if next_id == -1:
                    break

            revision_data.reverse()

            for item in revision_data:
                editor.revision_table_row(
                    revision=item["revision"],
                    rev_notes=item["rev_notes"],
                    rev_author=item["rev_author"],
                    released_date=item["released_date"],
                )

        editor_pdf_path = unique_path + "_editor.pdf"

        # Build front page
        editor.build_pdf(editor_pdf_path)
        ndpdf.mergePdf.merge_pdf_absolute(
            editor_pdf_path, target_file_path, processed_pdf_path
        )

    try:
        if doc_obj.pdf:
            doc_obj.pdf.delete()
        with open(processed_pdf_path, "rb") as file:
            doc_obj.pdf.save(f"{uuid.uuid4().hex}/{processed_pdf_file_name}", file)
    except IsADirectoryError:
        print("Not a file.")

    # Delete temporary stored files.
    shutil.rmtree(unique_path)

    return processed_pdf_path, processed_pdf_file_name


def extract_number_items(matched_number):
    """
    Extract the different items from a matched document number.
    """
    # make warning here as the regex may not match all revision formats

    print("Warning: The regex pattern may not match all revision formats.")

    pattern = r"([A-Z]{2,4})(\d{3})(\d{3})-(\d{1,3})([A-Z]{1,3})"
    matches = re.match(pattern, matched_number)

    prefix = matches.group(1)
    customer = matches.group(2)
    project_number = matches.group(3)
    project_document_number = matches.group(4)
    revision = matches.group(5)

    return prefix, customer, project_number, project_document_number, revision


# TODO currently only handles matching referenced documents.
def find_referenced_items(document_id):
    """Scan through the docuemnt and find referenced documents, parts, PCBAs and Assemblies."""
    try:
        doc_obj = Document.objects.get(id=document_id)

        unique_path = f"/tmp/{uuid.uuid4().hex}/"
        os.mkdir(unique_path)

        # Fetch document from DB, and store to temp folder.
        target_file_path = f"{unique_path}_target_file.pdf"
        with doc_obj.pdf_raw.open() as file:
            with open(target_file_path, "wb+") as destination:
                destination.write(file.read())

        matched_numbers = []

        # Open PDF document
        with open(target_file_path, "rb") as pdf_file:
            pdf_reader = PyPDF2.PdfReader(pdf_file)

            # Loop through each page of the document

            for page_num in range(len(pdf_reader.pages)):
                page = pdf_reader.pages[page_num]
                page_text = page.extract_text()

                # Search for strings that match the pattern
                pattern = r"[A-Z]{2,4}\d{1,10}-\d{1,3}+[A-Z]{1,3}"
                matches = re.findall(pattern, page_text)
                matched_numbers += matches

        matching_documents = Document.objects.filter(
            full_doc_number__in=matched_numbers, is_archived=False
        )

        referenced_ids = doc_obj.referenced_documents.values_list("id", flat=True)

        # Get the set of document ids referenced by the current document
        referenced_document_ids = set(referenced_ids)

        # Get the set of document ids corresponding to the matched numbers
        matching_document_ids = set(matching_documents.values_list("id", flat=True))

        # Add new referenced documents that are not already in the set
        new_referenced_document_ids = matching_document_ids - referenced_document_ids
        if new_referenced_document_ids:
            doc_obj.referenced_documents.add(*new_referenced_document_ids)

        # Remove old referenced documents that are not in the matched numbers
        old_referenced_document_ids = referenced_document_ids - matching_document_ids
        if old_referenced_document_ids:
            doc_obj.referenced_documents.remove(*old_referenced_document_ids)

        # Delete temporary stored files.
        shutil.rmtree(unique_path)

    except Exception as e:
        print(e)


# The code below runs doctest when this file is called.
if __name__ == "__main__":
    import doctest

    print("Running test...")
    doctest.testmod()
