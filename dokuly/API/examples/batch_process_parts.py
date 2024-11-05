# Standard library imports
import argparse
import json
import logging
import os
import re
import shutil
import sys
import time
from contextlib import ExitStack
from itertools import cycle
import requests
from prompt_toolkit import prompt
from prompt_toolkit.completion import PathCompleter
from pyunpack import Archive
from requests_toolbelt import MultipartEncoder
import mimetypes

# --------------------------------------------------------------------

API_KEY = "your_api_key"  # Update with your actual API key
DOKULY_TENANT = "test2"  # Update with your actual tenant name

# Use the "get_project_and_customer_ids.py" script to get the actual project and customer IDs
PROJECT_ID = "7"  # Update with actual project ID
CUSTOMER_ID = "2"  # Update with actual customer ID

# --------------------------------------------------------------------

# Example for extracting parts and documents from a ZIP file
# This example assumes that the ZIP file contains a directory structure like:
# - {Part_prefix}{part_number} {part_display_name}/
#   - Document 1.doc
#   - Document 2.doc
# - Part2 Test Part/
#   - Document 3.doc
#   - stepfile.step
# - Part3 Test Part/
#   - Document 4.doc

# Where the numeric part of "Part3" is the part number and the documents are .doc files.
# Se the PartsMigration.md file for more information.

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
PROTOCOL = "https"  # DO NOT CHANGE
# PROTOCOL = "http" # Only used for localhost
BASE_URL = f"{PROTOCOL}://{DOKULY_TENANT}.dokuly.com"  # DO NOT CHANGE
# BASE_URL = f"{PROTOCOL}://localhost:8000" # Only used for localhost
PARTS_API_URL = f"{BASE_URL}/api/v1/migrate/parts/"  # DO NOT CHANGE
DOCUMENTS_API_URL = f"{BASE_URL}/api/v1/migrate/documents/"  # DO NOT CHANGE
MB_LIMIT = 100  # Maximum size of each batch in MB, DO NOT CHANGE


def get_mime_type(file_name):
    mime_type, _ = mimetypes.guess_type(file_name)
    return mime_type or 'application/octet-stream'


def unzip_file(zip_path):
    # Create a temporary directory to extract files
    temp_dir = os.path.join(os.path.dirname(zip_path), 'temp_extracted')
    os.makedirs(temp_dir, exist_ok=True)

    # Extract the archive
    archive = Archive(zip_path)
    archive.extractall(temp_dir)

    # Return the path to the extracted files
    return temp_dir


def upload_batch(url, batch_data, files_dir):
    multipart_data = {}

    # Ensure batch_data is properly encoded as UTF-8 and converted to JSON
    try:
        # Convert to JSON with ensure_ascii=False to preserve non-ASCII characters
        json_data = json.dumps(batch_data, ensure_ascii=False)
        # Encode as UTF-8
        utf8_data = json_data.encode('utf-8')
        multipart_data['parts'] = utf8_data
    except (TypeError, UnicodeEncodeError) as e:
        logging.error(f"Error encoding batch data: {str(e)}")
        raise ValueError("Invalid data format or encoding issue in batch data")

    logging.debug(f"Uploading data to: {url}")

    with ExitStack() as stack:
        # Add file data
        for i, part in enumerate(batch_data['parts']):
            for j, file_info in enumerate(part['partFiles']):
                full_file_path = os.path.join(files_dir, file_info['fileName'])
                if os.path.exists(full_file_path):
                    field_name = f'file_{i}_{j}'
                    mime_type = get_mime_type(file_info['displayName'])
                    file = stack.enter_context(open(full_file_path, 'rb'))
                    multipart_data[field_name] = (file_info['displayName'], file, mime_type)
                else:
                    print(f"File not found: {full_file_path}")

        # Add project
        multipart_data['projectId'] = PROJECT_ID

        multipart_encoder = MultipartEncoder(fields=multipart_data)

        if "localhost" in BASE_URL:
            session = requests.Session()  # Only used for localhost
            session.headers.update({'Host': 'test2.dokuly.localhost'})  # Only used for localhost

            response = session.post(
                url,
                data=multipart_encoder,
                headers={
                    'Content-Type': multipart_encoder.content_type,
                    'Authorization': f'Api-Key {API_KEY}'
                },
                timeout=3600
            )
        else:
            response = requests.post(
                url,
                data=multipart_encoder,
                headers={
                    'Content-Type': multipart_encoder.content_type,
                    'Authorization': f'Api-Key {API_KEY}'
                },
                timeout=3600
            )
    return response


def upload_document_batch(url, batch_data, files_dir):
    multipart_data = {}

    # Ensure batch_data is properly encoded as UTF-8 and converted to JSON
    try:
        json_data = json.dumps(batch_data, ensure_ascii=False)
        utf8_data = json_data.encode('utf-8')
        multipart_data['documents'] = utf8_data
    except (TypeError, UnicodeEncodeError) as e:
        logging.error(f"Error encoding batch data: {str(e)}")
        raise ValueError("Invalid data format or encoding issue in batch data")

    logging.debug(f"Uploading document batch to: {url}")

    with ExitStack() as stack:
        # Add file data
        for i, document in enumerate(batch_data['documents']):
            file_path = os.path.join(files_dir, document['fileName'])
            if os.path.exists(file_path):
                field_name = f'file_{i}'
                mime_type = get_mime_type(document['displayName'])
                file = stack.enter_context(open(file_path, 'rb'))
                multipart_data[field_name] = (document['displayName'], file, mime_type)
            else:
                logging.warning(f"Document file not found: {file_path}")

        # Add project
        multipart_data['projectId'] = PROJECT_ID
        # Add customer
        multipart_data['customerId'] = CUSTOMER_ID

        multipart_encoder = MultipartEncoder(fields=multipart_data)

        if "localhost" in BASE_URL:
            session = requests.Session()
            session.headers.update({'Host': 'test2.dokuly.localhost'})

            response = session.post(
                url,
                data=multipart_encoder,
                headers={
                    'Content-Type': multipart_encoder.content_type,
                    'Authorization': f'Api-Key {API_KEY}'
                },
                timeout=3600
            )
        else:
            response = requests.post(
                url,
                data=multipart_encoder,
                headers={
                    'Content-Type': multipart_encoder.content_type,
                    'Authorization': f'Api-Key {API_KEY}'
                },
                timeout=3600
            )
    return response


def process_entries(entries):
    parts = []
    documents = []
    part_batches = []
    document_batches = []

    current_part_batch = {"size": 0, "parts": []}
    current_document_batch = {"size": 0, "documents": []}

    def process_file(file_path, part):
        file_name = os.path.basename(file_path)
        file_size = len(entries[file_path])
        if file_name.lower().endswith((".doc", ".docx")):
            document = {
                "fileName": file_path,
                "fileSize": file_size,
                "displayName": file_name,
                "partNumber": part["partNumber"],
            }
            documents.append(document)
            if current_document_batch["size"] + file_size > MB_LIMIT * 1024 * 1024:  # 300 MB limit
                document_batches.append(current_document_batch)
                current_document_batch.clear()
                current_document_batch.update({"size": 0, "documents": []})
            current_document_batch["documents"].append(document)
            current_document_batch["size"] += file_size
        else:
            part["partFiles"].append({
                "fileName": file_path,
                "displayName": file_name
            })
            current_part_batch["size"] += file_size

    for name, entry in entries.items():
        path_parts = re.split(r'[/\\]', name)
        if len(path_parts) >= 3 and path_parts[0] != "":  # We have at least "parts\PRT1 Test\file"
            full_part_name = path_parts[1]  # This is "PRT1 Test" or similar

            # Extract part number and display name
            part_match = re.match(r'([A-Za-z]+)(\d+)\s*(.*)', full_part_name)
            if part_match:
                part_prefix = part_match.group(1)
                part_number = part_match.group(2)
                display_name = part_match.group(3).strip()
                # Handle display name starting with hyphen
                if display_name.startswith('-'):
                    display_name = display_name[1:].capitalize()
            else:
                part_prefix = ""
                part_number = ""
                display_name = full_part_name

            # Check if this part has been processed before
            part = next((p for p in parts if p["name"] == full_part_name), None)
            if not part:
                part = {
                    "name": full_part_name,
                    "displayName": display_name,
                    "partNumber": part_number,
                    "partPrefix": part_prefix,
                    "partFiles": [],
                }
                parts.append(part)

                # Add part to the current batch
                current_part_batch["parts"].append(part)
                part_size_estimate = 1024  # 1 KB for JSON metadata
                current_part_batch["size"] += part_size_estimate
                if current_part_batch["size"] > MB_LIMIT * 1024 * 1024:  # 300 MB limit
                    part_batches.append(current_part_batch)
                    current_part_batch = {"size": 0, "parts": []}

            # Process the file
            process_file(name, part)

    # Add the last batches if they have any content
    if current_part_batch["size"] > 0 and len(current_part_batch["parts"]) > 0:
        part_batches.append(current_part_batch)

    if current_document_batch["size"] > 0 and len(current_document_batch["documents"]) > 0:
        document_batches.append(current_document_batch)

    logging.info(f"Parts: {len(parts)}")
    logging.info(f"Part Files: {sum(len(p['partFiles']) for p in parts)}")
    logging.info(f"Documents: {len(documents)}")
    logging.info(f"Part Batches: {len(part_batches)}")
    logging.info(f"Document Batches: {len(document_batches)}")

    print(json.dumps(parts))
    print(json.dumps(documents))

    def bytes_to_mb(bytes_value):
        return bytes_value / (1024 * 1024)

    print("\nPart batch sizes (MB):")
    [print(f"{bytes_to_mb(b['size']):.2f} MB") for b in part_batches]

    print("\nDocument batch sizes (MB):")
    [print(f"{bytes_to_mb(b['size']):.2f} MB") for b in document_batches]
    print("\n")

    return parts, documents, part_batches, document_batches


def loading_animation():
    for c in cycle(['|', '/', '-', '\\']):
        if loading_animation.done:
            break
        sys.stdout.write('\rUploading ' + c)
        sys.stdout.flush()
        time.sleep(0.1)
    sys.stdout.write('\rUpload complete!\n')


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
    logging.info("Starting the ZIP file processing script")

    completer = PathCompleter()
    parser = argparse.ArgumentParser(description="Process and optionally upload ZIP file contents.")
    parser.add_argument("--upload", action="store_true", help="Upload processed data to the server")
    args = parser.parse_args()

    while True:
        zip_path = prompt("Please enter the path to the ZIP file: ", completer=completer)
        if not os.path.exists(zip_path):
            logging.error("The specified file does not exist.")
            continue
        if not os.path.isfile(zip_path):
            logging.error("The specified path is not a file.")
            continue
        if not zip_path.lower().endswith('.zip'):
            logging.error("The specified file is not a ZIP file.")
            continue

        break

    try:
        extracted_dir = unzip_file(zip_path)
        logging.info(f"Extracted ZIP file to: {extracted_dir}")

        entries = {}
        for root, dirs, files in os.walk(extracted_dir):
            for name in files:
                full_path = os.path.join(root, name)
                relative_path = os.path.relpath(full_path, extracted_dir)
                with open(full_path, 'rb') as f:
                    entries[relative_path] = f.read()

        logging.info(f"Found {len(entries)} files in the ZIP archive")

        parts, documents, part_batches, document_batches = process_entries(entries)

        logging.info(f"Processed {len(parts)} parts and {len(documents)} documents")
        logging.info(f"Created {len(part_batches)} part batches and {len(document_batches)} document batches")

        loading_animation.done = False

        if args.upload:
            logging.info("Uploading data to server...")

            import threading
            spinner = threading.Thread(target=loading_animation)
            spinner.start()

            try:
                for i, batch in enumerate(part_batches, 1):
                    response = upload_batch(
                        PARTS_API_URL,
                        {'parts': batch['parts']},
                        extracted_dir
                    )
                    logging.info(f"\nParts batch {i} upload response: {response.status_code}\n")
                    logging.info(f"\nResponse content: {response.json()}\n")

                if len(document_batches) > 0:
                    for i, batch in enumerate(document_batches, 1):
                        response = upload_document_batch(
                            DOCUMENTS_API_URL,
                            {'documents': batch['documents']},
                            extracted_dir
                        )
                        logging.info(f"\nDocuments batch {i} upload response: {response.status_code}\n")
                        logging.info(f"\nResponse content: {response.json()}\n")
                else:
                    logging.info("No document batches to upload.")
            except Exception as e:
                logging.exception(f"An error occurred while uploading data: {str(e)}")
            finally:
                loading_animation.done = True
                spinner.join()
                time.sleep(0.1)  # ensure clean output
                print("\nUpload finished!\n")

        else:
            logging.info("\n\nDATA NOT UPLOADED. Use --upload flag to upload data;\npython batch_process_parts.py --upload\n\n")

        time.sleep(3)  # Wait for upload to be completely done
        # remove the temporary directory
        shutil.rmtree(extracted_dir)
        logging.info(f"Removed temporary directory: {extracted_dir}")

    except Exception as e:
        logging.exception(f"An error occurred while processing the ZIP file: {str(e)}")
