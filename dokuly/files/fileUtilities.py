from .models import File
import os


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

def assemble_file_dict(row_number: None, file_id: -1, file_title: None, file_name: None, type: None, uri: None, is_archived=False, view_uri=None):
    """ A method for creating a dict of file information.
    We use this function to ensure all items in a dict list have the same fields.

    ## Example

    >>> assemble_file_dict("1", 2, "Assembly Drawing", "ad.pdf", "ad", "/files/ad.pdf")
    {'row_number': '1', 'file_id': 2, 'title': 'Assembly Drawing', 'file_name': 'ad.pdf', 'type': 'ad', 'uri': '/files/ad.pdf', 'is_archived': False}
    """
    return {
        "row_number": row_number,
        "file_id": file_id,
        "title": file_title,
        "file_name": file_name,
        "type": type,
        "uri": uri,
        "is_archived": is_archived,
        "is_threemf_file": file_name.lower().endswith(".3mf") if file_name else False,
        "view_uri": view_uri
    }

def get_file_name_by_id(id):
    if id == -1 or id == None:
        return ""

    file_db_obj = File.objects.get(id=id)
    path =  str(file_db_obj.file)
    file_name = get_file_name(path)
    return file_name

def get_file_uri_formatted(domain_type, identifier, id):
    "Returns a formatted string for download file views"
    return f"api/files/download/file/{id}/"

def get_file_view_uri_formatted(domain_type, identifier, id):
    "Returns a formatted string for download file views"
    return f"api/files/view/{id}/"

def get_image_uri_formatted(id):
    return f"api/files/images/download/{id}/"