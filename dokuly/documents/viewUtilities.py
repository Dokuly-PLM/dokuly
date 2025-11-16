import os
from django.conf import settings
import random

from documents.models import Reference_List
from assemblies.models import Assembly
from parts.models import Part
from pcbas.models import Pcba
from documents.models import Document_Prefix


def query_data_to_reference_list(query_data):
    """Extract reference list object from query data.
    - The data must contain the pcba, part or asm id on the following form: asm_id, pcba_id, part_id.
    """
    asm_id = None
    part_id = None
    pcba_id = None

    if query_data["asm_id"] != None:
        asm_id = query_data["asm_id"]
    elif query_data["part_id"] != None:
        part_id = query_data["part_id"]
    elif query_data["pcba_id"] != None:
        pcba_id = query_data["pcba_id"]
    else:
        return None, -1, ""

    reference_list, reference_list_id, release_state = get_reference_list(
        asm_id=asm_id, part_id=part_id, pcba_id=pcba_id)

    return reference_list, reference_list_id, release_state


def get_reference_list(asm_id=None, part_id=None, pcba_id=None):
    """Get the reference document list from an asm, part or a pcba.
    If no reference list exists, a new list will be created and attached to the target object.

    One of the following arguments must be supplied to the function.
    :param asm_id: defaults to None
    :type asm_id: int
    :param part_id: defaults to None
    :type part_id: int
    :param pcba_id: defaults to None
    :type pcba_id: int
    """

    reference_list = None
    release_state = None

    if asm_id != None:
        target_obj = Assembly.objects.get(id=asm_id)
    elif part_id != None:
        target_obj = Part.objects.get(id=part_id)
    elif pcba_id != None:
        target_obj = Pcba.objects.get(id=pcba_id)
    else:
        return None, -1, ""

    release_state = target_obj.release_state.capitalize()
    reference_list_id = target_obj.reference_list_id

    if reference_list_id == -1:
        reference_list = Reference_List.objects.create()
        reference_list.save()

        if asm_id != None:
            Assembly.objects.filter(id=asm_id).update(
                reference_list_id=int(reference_list.id))
        elif part_id != None:
            Part.objects.filter(id=part_id).update(
                reference_list_id=int(reference_list.id))
        elif pcba_id != None:
            Pcba.objects.filter(id=pcba_id).update(
                reference_list_id=int(reference_list.id))

    else:
        reference_list = Reference_List.objects.get(id=reference_list_id)

    return reference_list, reference_list_id, release_state


def get_file_name(path):
    """Extract the file name with extension from a path.

    ## Example

    >>> get_file_name("media/documents/file.pdf")
    'file.pdf'
    >>> file_name = get_file_name(None)
    >>> print(file_name)
    None
    """
    if path == None:
        return None

    file_name, file_extension = get_file_name_and_extension(path)
    return file_name + file_extension


def get_file_name_and_extension(path):
    """Extract the file name with extension from a path.

    ## Example

    >>> get_file_name_and_extension("media/documents/file.pdf")
    ('file', '.pdf')
    >>> file_name = get_file_name_and_extension(None)
    >>> print(file_name)
    (None, None)
    """
    if path == None:
        return None, None

    base_name = os.path.basename(str(path))
    file_name = os.path.splitext(base_name)[0]
    file_extension = os.path.splitext(base_name)[1]
    return file_name, file_extension


def assemble_file_dict(row_number: None, file_title: None, file_name: None, type: None, uri: None):
    """ A method for creating a dict of file information.
    We use this function to ensure all items in a dict list has the same fields.

    ## Example

    >>> assemble_file_dict("1", "Assembly Drawing", "ad.pdf", "ad", "/files/ad.pdf")
    {'row_number': '1', 'title': 'Assembly Drawing', 'file_name': 'ad.pdf', 'type': 'ad', 'uri': '/files/ad.pdf'}
    """
    return {"row_number": row_number, "title": file_title, "file_name": file_name, "type": type, "uri": uri}


def assemble_full_document_number(entry, document, project, customer, part, assembly):
    fullNumber = ""
    if entry['full_doc_number'] != None:
        fullNumber = entry['full_doc_number']
    else:
        pre = ""
        if document.prefix_id != None and document.prefix_id != -1:
            prefix = Document_Prefix.objects.get(
                id=int(document.prefix_id))
            pre = prefix.prefix
        else:
            pre = document.document_type
        if project != None:
            fullNumber = f"{pre}{project.full_project_number}-{document.document_number}{document.revision}"
        else:
            fullNumber = f"{pre}??-{document.document_number}{document.revision}"
    return fullNumber


def assemble_full_document_number_no_prefix_db_call(entry, document, project, customer, part, assembly, prefix):
    if entry['full_doc_number'] is not None:
        return entry['full_doc_number']

    pre = prefix if prefix else ""

    if project is not None:
        fullNumber = f"{pre}{project.full_project_number}-{document.document_number}{document.revision}"
    else:
        fullNumber = f"{pre}??-{document.document_number}{document.revision}"
    return fullNumber


if __name__ == "__main__":
    import doctest
    doctest.testmod()
