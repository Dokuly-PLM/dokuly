from distutils import extension
from distutils.command.clean import clean
import os
import shutil
import random
from re import A
from zipfile import ZipFile
from pathlib import Path
import uuid
import requests
from parts.models import Part

def get_matches(array, target_mpn):
    match_array = []
    for idx, item in enumerate(array):
        if item["mpn"] == target_mpn:
            match_array.append(idx)
    return match_array


def build_bom_dict_arrays(pcba, part_array=None):
    """Merge the separate arrays into a unified dict array."""

    numb_bom_items = 0
    if pcba.mpn != None:
        numb_bom_items = len(pcba.mpn)
    elif pcba.refdes != None:
        numb_bom_items = len(pcba.refdes)
    else:
        return [], []

    bom_array = []
    dnm_array = []
    for i in range(numb_bom_items):
        try:
            if pcba.nobom != None:
                if pcba.nobom[i] != "":
                    continue
        except:
            continue

        data = dict()

        try:
            data["mpn"] = pcba.mpn[i]
        except:
            continue

        try:
            data["description"] = ""
            if part_array != None:
                if part_array[i] != None and part_array[i] != -1:
                    data["description"] = part_array[i].display_name
        except:
            continue

        try:
            data["refdes"] = pcba.refdes[i]
        except:
            continue

        try:
            data["part_id"] = -1
            if pcba.bom_part_ids != None and len(pcba.bom_part_ids) != 0:
                data["part_id"] = pcba.bom_part_ids[i]
        except:
            continue

        try:
            data["dnm"] = ""
            if pcba.dnm != None and len(pcba.dnm) != 0:
                data["dnm"] = pcba.dnm[i]
        except:
            continue

        if data["dnm"] != "":
            dnm_array.append(data)
        else:
            bom_array.append(data)

    return bom_array, dnm_array


def add_alternate_part_mpn_to_sorted_bom_array(sorted_bom_array, part_array):
    """Add MPNs of alternate parts to the dict array."""

    alternate_part_ids = []

    if part_array is not None:
        part_array = [part for part in part_array if part is not None]

        alternate_part_ids = [
            part_id
            for part in part_array
            if part is not None and part.alternative_parts is not None
            for part_id in part.alternative_parts
        ]

    if alternate_part_ids:
        alternate_parts = Part.objects.filter(id__in=alternate_part_ids)

        for item in sorted_bom_array:
            main_part = None
            if item is not None:
                if item["part_id"] != None and item["part_id"] != -1:
                    main_part = next(
                        (part for part in part_array if part.id == item["part_id"]),
                        None,
                    )

            alternate_part_mpns = []
            if main_part is not None:
                if main_part.alternative_parts is not None:
                    alternate_part_mpns = [
                        alt_part.mpn
                        for alt_part_id in main_part.alternative_parts
                        if alt_part_id is not None and alt_part_id != -1
                        for alt_part in alternate_parts
                        if alt_part.id == alt_part_id and alt_part.mpn is not None
                    ]

            item["alternate_mpns"] = ", ".join(alternate_part_mpns)

    return sorted_bom_array


def group_by_refdes(bom_array):
    sorted_bom_array = []
    # While loop, but limited for safety.
    for i in range(100000):
        if 0 == len(bom_array):
            break
        target_mpn = bom_array[0]["mpn"]
        matches = get_matches(bom_array, target_mpn)

        refdes_arr = []

        for index in matches:
            refdes_arr.append(bom_array[index]["refdes"])

        data = dict()
        data["mpn"] = bom_array[0]["mpn"]
        data["refdes"] = ", ".join(refdes_arr)
        data["dnm"] = bom_array[0]["dnm"]
        data["part_id"] = bom_array[0]["part_id"]

        if "description" in bom_array[0]:
            data["description"] = bom_array[0]["description"]

        matches.reverse()
        for index in matches:
            del bom_array[index]

        sorted_bom_array.append(data)

    return sorted_bom_array


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


def get_file_name_no_extension(path):
    """Extract the file name without extension from a path.

    ## Example

    >>> get_file_name_no_extension("media/documents/file.pdf")
    'file'
    >>> file_name = get_file_name_no_extension(None)
    >>> print(file_name)
    None
    """
    if path == None:
        return None

    base_name = os.path.basename(str(path))
    file_name = os.path.splitext(base_name)[0]
    return file_name


def get_file_extension(path):
    """Extract the file extension from a path, forced to lower case.

    ## Example

    >>> get_file_extension("media/documents/file.pdf")
    '.pdf'
    >>> get_file_extension("file.Pdf")
    '.pdf'
    >>> file_extension = get_file_name(None)
    >>> print(file_extension)
    None
    """
    if path == None:
        return None

    base_name = os.path.basename(str(path))
    file_extension = os.path.splitext(base_name)[1].lower()
    return file_extension


def get_list_of_files(target_dir):
    """Recursively list all files in the target directory and subdirectories.

    ## Example

    ```python
    get_list_of_files("./tests/data/")
    ['./tests/data/Manufacture_Bot.pdf', './tests/data/Assembly_Top.pdf', './tests/data/Schematic_BW.pdf', './tests/data/PCB1235 v30_2022-05-07.zip', './tests/data/Manufacture_Top.pdf', './tests/data/PCB.png', './tests/data/fusion360Bom.csv', './tests/data/Assembly_Bot.pdf', './tests/data/altiumBom.csv', './tests/data/Schematic.pdf']
    ```
    """
    # names in the given directory
    listOfFile = os.listdir(target_dir)
    all_files = list()
    # Iterate over all the entries
    for entry in listOfFile:
        # Create full path
        full_path = os.path.join(target_dir, entry)
        # If entry is a directory then get the list of files in this directory
        if os.path.isdir(full_path):
            all_files = all_files + get_list_of_files(full_path)
        else:
            all_files.append(full_path)

    return all_files


def rename_no_whitespace(file_list):
    """Renames file to remove white space from file name.
    Only corrects the file name. The path remains untouched.

    ## Arguments
    - `file_list` A list of files, with full path.

    returns a list of the renamed files.
    """
    return_list = []
    for item in file_list:
        filename = get_file_name(item)
        path = os.path.dirname(item)
        clean_name = f"{path}/{filename.replace(' ', '_')}"
        os.rename(item, clean_name)
        return_list.append(clean_name)
    return return_list


def add_string_to_file_names(file_list, prefix_str):
    """Renames files by attahcing a string prefix.

    ## Arguments
    - `file_list` A list of files, with full path.
    - `prefix_str` A string prefix to attach to the file name.

    returns a list of the renamed files.
    """
    return_list = []
    for item in file_list:
        filename = get_file_name(item)
        path = os.path.dirname(item)
        new_name = f"{path}/{prefix_str}{filename}"
        os.rename(item, new_name)
        return_list.append(new_name)
    return return_list


def assemble_file_dict(
    row_number: None,
    file_title: None,
    file_name: None,
    type: None,
    uri: None,
    is_archived=False,
    view_uri=None,
):
    """A method for creating a dict of file information.
    We use this function to ensure all items in a dict list has the same fields.

    ## Example

    >>> assemble_file_dict("1", "Assembly drawing", "ad.pdf", "ad", "/files/ad.pdf")
    {'row_number': '1', 'title': 'Assembly drawing', 'file_name': 'ad.pdf', 'type': 'ad', 'uri': '/files/ad.pdf'}
    """
    return {
        "row_number": row_number,
        "title": file_title,
        "file_name": file_name,
        "type": type,
        "uri": uri,
        "view_uri": view_uri,
        "is_archived": is_archived,
    }


def save_to_media_folder(file, folder, media_root_path):
    """Write the file to the target location: media/<folder>/.
    This function selects a folder to store to based on the folder argument.
    """

    def asseble_path(path, file_name, extension, num_rand=0):
        r_path = path + file_name
        for i in range(num_rand):
            r_path += str(random.randint(0, 9))

        return r_path + extension

    base_name = os.path.basename(str(file.name))
    file_name = os.path.splitext(base_name)[0]
    file_extension = os.path.splitext(base_name)[1]

    target_path = f"{media_root_path}/{folder}/"
    path = asseble_path(target_path, file_name, file_extension)

    i = 0
    while os.path.exists(path):
        path = asseble_path(target_path, file_name, file_extension, i)
        i += 1

    with open(path, "wb+") as destination:
        # for chunk in file.chunks():
        destination.write(file.read())

    unique_name = os.path.basename(path)
    return path, unique_name


def remove_files(file_list, substring):
    """Removes files from list, when their name contains the substring."""
    for idx, item in enumerate(list(file_list)):
        path, base_name = os.path.split(item)
        if substring in base_name.lower():
            file_list.remove(
                item
            )  # TODO lower computation by iterating in reverse and use .pop(idx)

    return file_list


def rename_file_containing_string(file_list, detection_string, new_name):
    """Rename files to improve detection.
    Only the first occurrence is selected.

    See preferred file names [here](https://github.com/tracespace/tracespace/blob/main/packages/fixtures/gerber-filenames.json).

    ## Example

    ```python
    a = ["folder/TOP.gbr", "folder/BOT.gbr", "folder/MID.gbr"]
    rename_file_containing_string(a, "MID.gbr", 'new_name.gbr')
    ['folder/TOP.gbr', 'folder/BOT.gbr', 'folder/new_name.gbr']
    ```
    """
    if detection_string == "":
        return file_list

    for idx, item in enumerate(list(file_list)):
        path, base_name = os.path.split(item)
        if detection_string in base_name:

            new_name = f"{path}/{new_name}"
            os.rename(item, new_name)
            file_list[idx] = new_name
            return file_list
    # File was not found
    return file_list


def strip_path(path_list):
    clean_path = []
    for item in path_list:
        clean_item = os.path.basename(item)
        clean_path.append(clean_item)
    return clean_path


def get_zip_content(gerber_path):
    # Check if file exists.
    if not (os.path.exists(gerber_path)):
        print(f"Can't find file: {gerber_path}")
        return []

    # Check if file is zip archive.
    if get_file_extension(gerber_path) != ".zip":
        print(f"Not a zip file: {gerber_path}")
        return []

    file_name = get_file_name_no_extension(gerber_path)
    # Dont allow white space in path
    output_path = f"/tmp/{file_name.replace(' ', '_')}"

    # Ensure unique temp folder.
    while os.path.exists(output_path + "/"):
        output_path += str(random.randint(0, 9))

    output_path = output_path + "/"

    os.mkdir(output_path)

    # Files to render
    file_list = []
    with ZipFile(gerber_path, "r") as zipObj:
        # Extract all the contents of zip file into different directory
        zipObj.extractall(output_path)
        file_list = get_list_of_files(output_path)

    zip_contents = strip_path(file_list)

    # Clean up folder with extracted zip.
    shutil.rmtree(output_path)
    return zip_contents


def render_gerber_to_svg(part_number, gerber_path, pcb_layers):
    """expects the gerber_path to be a zip archive.
    No logic is implemented to handle recognition of the layer names etc.
    This recognition is handled by [whats-that-gerber](https://github.com/tracespace/tracespace/tree/main/packages/whats-that-gerber).

    ## Arguments

    - `gerber_path` is the path to the zip-archive containing the gerber files.
    - `target_path` is the folder to store the render files.

    - returns an array of paths to the generated files, stored in temporary storage.
    """
    # Check if file exists.
    if not (os.path.exists(gerber_path)):
        print(f"Can't find file: {gerber_path}")
        return []

    # Check if file is zip archive.
    if get_file_extension(gerber_path) != ".zip":
        print(f"Not a zip file: {gerber_path}")
        return []

    file_name = get_file_name_no_extension(gerber_path)
    # Don't allow white space in path
    output_path = f"/tmp/{file_name.replace(' ', '_')}"

    # Ensure unique temp folder.
    while os.path.exists(output_path + "/"):
        output_path += str(random.randint(0, 9))

    output_path = output_path + "/"

    os.mkdir(output_path)

    # Files to render
    file_list = []
    with ZipFile(gerber_path, "r") as zipObj:
        # Extract all the contents of zip file into different directory
        zipObj.extractall(output_path)
        file_list = get_list_of_files(output_path)

    # print(f"Extracted files: {file_list}")

    # Remove files that definitely ain't the correct gerbers.
    file_list = remove_files(file_list, "pnp")
    file_list = remove_files(file_list, ".gbrjob")
    file_list = remove_files(file_list, ".csv")
    # file_list = rename_file_containing_string(file_list, pcb_layers["drill"], 'drill_1_16.xln')

    # print(f"Filtered file list: {file_list}")

    pcb_layer_files = set(
        [value for key, value in pcb_layers.items() if key != "zip content"]
    )
    # Only run the following code if all pcb_layer_files have a value
    if all(pcb_layer_files):
        file_list = [
            file_path
            for file_path in file_list
            if os.path.basename(file_path) in pcb_layer_files
        ]

    # print(f"Files matching PCB layers: {file_list}")

    # Add quotes to allow white space in file path.
    for idx, item in enumerate(file_list):
        file_list[idx] = f'"{item}"'

    # Format the list to allow white space in the path.
    formatted_str = "".join(f"{w} " for w in file_list)

    render_file_path = f"{output_path}rendered"
    os.mkdir(render_file_path)
    # Sending every file in the folder into the render engine.
    # The renderer sorts out the ones it recognizes.
    # print(f"Running tracespace with files: {formatted_str}")
    exit_code = os.system(
        f"tracespace -L --quiet --out={render_file_path} {formatted_str}"
    )

    if exit_code != 0:
        print("Rendering failed with exit code", exit_code)
        return ["", ""]

    rendered_files = get_list_of_files(render_file_path)
    # print(f"Rendered files before renaming: {rendered_files}")

    # Rename and ensure unique paths for rendered files
    def rename_and_move_files(file_paths, part_number, output_folder):
        renamed_files = []
        for file_path in file_paths:
            dir_name, base_name = os.path.split(file_path)
            new_base_name = f"{part_number}-{base_name}"
            new_file_path = os.path.join(output_folder, new_base_name)
            os.rename(file_path, new_file_path)
            renamed_files.append(new_file_path)
        return renamed_files

    rendered_files = rename_and_move_files(rendered_files, part_number, "/tmp")
    # print(f"Rendered files after renaming: {rendered_files}")

    # Identify top and bottom renders
    top_render_path = next((f for f in rendered_files if "top.svg" in f), None)
    bottom_render_path = next((f for f in rendered_files if "bottom.svg" in f), None)

    if top_render_path is None or bottom_render_path is None:
        print("Failed to find top or bottom render paths.")
        return ["", ""]

    # Clean up folder with extracted zip.
    shutil.rmtree(output_path)
    return [top_render_path, bottom_render_path]


def save_temp_file(file):
    """Write the file to a unique path in the /tmp folder."""
    base_name = os.path.basename(str(file.name))
    unique_path = f"/tmp/{uuid.uuid4().hex}/"
    os.mkdir(unique_path)

    path = f"{unique_path}{base_name}"

    with open(path, "wb+") as destination:
        # for chunk in file.chunks():
        destination.write(file.read())

    unique_name = os.path.basename(path)
    return path, unique_name


def find_missing_and_incorrect_connections(master_list, reference_list):
    """Compares two arrays. master_list is the master and contains the valid ids. It can however contain multiple repetitions of the same id.
    The ids listed in bom_ids, that is missing from the bom_part_ids array are returned in th emissing_ids array.
    Ids located in the bom_part_ids, not found in bom_ids are incorrect. These are returned in the incorrect_ids array.
    """
    # Convert None inputs to empty lists
    master_list = master_list or []
    reference_list = reference_list or []

    # Convert the lists to sets to remove duplicates and enable set operations
    master_set = set(master_list)
    reference_set = set(reference_list)

    # Find the set of IDs that are in the master_list but not in the reference_list
    missing_set = master_set - reference_set

    # Find the set of IDs that are in the reference_list but not in the master_list
    incorrect_set = reference_set - master_set

    # Convert the sets back to lists for return
    missing_ids = list(missing_set)
    incorrect_ids = list(incorrect_set)

    return missing_ids, incorrect_ids


if __name__ == "__main__":
    import doctest

    doctest.testmod(raise_on_error=True)
