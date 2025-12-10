import json
from rest_framework import status
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from organizations.permissions import APIAndProjectAccess
from parts.models import Part
from assemblies.models import Assembly
from pcbas.models import Pcba
from assembly_bom.models import Assembly_bom, Bom_item
import csv
from django.db import transaction
from django.db.models import Q
from drf_yasg.utils import swagger_auto_schema
from drf_yasg import openapi


@swagger_auto_schema(
    method='post',
    operation_id='upload_assembly_bom',
    operation_description="""
    Upload a BOM (Bill of Materials) CSV file to an assembly.
    
    **Required fields:**
    - `file`: CSV file containing BOM data (multipart/form-data)
    
    **CSV Format:**
    The CSV file should contain the following columns:
    - `Reference`: Reference designator (e.g., "R1", "C5", "U3")
    - `MPN`: Manufacturer Part Number (full part number with revision, e.g., "PRT1234A")
    - `QUANTITY`: Quantity of the item (defaults to 1 if not specified)
    - `DNP`: Do Not Populate flag (if present, item is marked as not mounted)
    
    **Note:** The assembly must not be in "Released" state to upload BOM.
    Existing BOM items will be replaced with the new data.
    """,
    tags=['assemblies'],
    manual_parameters=[
        openapi.Parameter(
            'file',
            openapi.IN_FORM,
            type=openapi.TYPE_FILE,
            required=True,
            description='CSV file containing BOM data'
        ),
    ],
    consumes=['multipart/form-data'],
    responses={
        200: openapi.Response(description='BOM uploaded successfully'),
        400: openapi.Response(description='Bad request - missing file, assembly is released, CSV is empty, or invalid data'),
        401: openapi.Response(description='Unauthorized - invalid API key or no project access'),
        404: openapi.Response(description='Assembly not found'),
    },
    security=[{'Token': []}, {'Api-Key': []}]
)
@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def upload_assembly_bom(request, assembly_id, **kwargs):
    """
    Upload a BOM CSV file to an assembly.
    
    Request must be multipart/form-data with:
    - file: CSV file containing BOM data (required)
    """
    try:
        # Ensure that a file has been uploaded
        if 'file' not in request.FILES:
            return Response("No file uploaded.", status=status.HTTP_400_BAD_REQUEST)

        file = request.FILES['file']

        # Decode the file to read as text
        decoded_file = file.read().decode('utf-8').splitlines()
        reader = csv.DictReader(decoded_file)

        # Collect all rows from the CSV
        csv_rows = []
        for row in reader:
            csv_rows.append(row)

        if not csv_rows:
            return Response("CSV file is empty.", status=status.HTTP_400_BAD_REQUEST)

        # Start a database transaction
        with transaction.atomic():
            # Retrieve the assembly
            try:
                assembly = Assembly.objects.get(pk=assembly_id)
            except Assembly.DoesNotExist:
                return Response("Assembly not found.", status=status.HTTP_404_NOT_FOUND)

            # Check project access for API key requests
            if APIAndProjectAccess.has_validated_key(request):
                if not APIAndProjectAccess.check_project_access(request, assembly.project.pk):
                    return Response(
                        "Not authorized - no access to this project",
                        status=status.HTTP_401_UNAUTHORIZED
                    )

            if assembly.release_state == "Released":
                return Response(
                    "Can't edit a released assembly!", status=status.HTTP_400_BAD_REQUEST
                )

            # Retrieve or create a BOM for the given assembly
            # Handle case where multiple BOMs might exist for the same assembly
            existing_boms = Assembly_bom.objects.filter(assembly_id=assembly_id)
            if existing_boms.exists():
                # Use the first BOM if multiple exist (or most recent if we want to be smarter)
                bom = existing_boms.first()
                # If there are multiple BOMs, delete the extra ones to avoid confusion
                # Keep only the first one
                extra_boms = existing_boms.exclude(id=bom.id)
                if extra_boms.exists():
                    # Delete BOM items from extra BOMs first
                    Bom_item.objects.filter(bom__in=extra_boms).delete()
                    # Then delete the extra BOMs
                    extra_boms.delete()
            else:
                # Create a new BOM if none exists
                bom = Assembly_bom.objects.create(assembly_id=assembly_id)

            # Prepare data for bulk operations
            bom_items_to_create = []
            full_part_numbers_with_revision = set()
            temporary_mpns = set()

            for row in csv_rows:
                # Extract necessary fields (adjust field names as per your CSV columns)
                designator = row.get('Reference', '').strip()
                temporary_mpn = row.get('MPN', '').strip() or None
                quantity_str = row.get('QUANTITY', '1').strip()
                try:
                    quantity = float(quantity_str) if quantity_str else 1.0
                except (ValueError, TypeError):
                    quantity = 1.0
                dnp = row.get('DNP', '').strip()
                is_mounted = not bool(dnp)  # If DNP field is empty, is_mounted is True

                # Collect full_part_number_with_revision for matching
                if temporary_mpn:
                    full_part_number_with_revision = temporary_mpn.strip()
                    revision = full_part_number_with_revision[-1]  # Last letter is revision
                    full_part_number = full_part_number_with_revision[:-1]
                    full_part_numbers_with_revision.add((full_part_number, revision))
                    temporary_mpns.add(temporary_mpn)

                # Prepare Bom_item instance (not saved yet)
                bom_item = Bom_item(
                    bom=bom,
                    designator=designator,
                    quantity=quantity,
                    temporary_mpn=temporary_mpn,
                    is_mounted=is_mounted,
                )
                bom_items_to_create.append(bom_item)

            if len(bom_items_to_create) == 0:
                return Response("No valid rows found in the CSV.", status=status.HTTP_400_BAD_REQUEST)

            # Now that data is prepared and validated, delete existing Bom_items
            Bom_item.objects.filter(bom=bom).delete()

            # Bulk fetch Parts
            parts_qs = Part.objects.filter(
                Q(full_part_number__in=[fpn for fpn, rev in full_part_numbers_with_revision]) &
                Q(revision__in=[rev for fpn, rev in full_part_numbers_with_revision])
            )

            # Build the part_map
            part_map = {}
            for part in parts_qs:
                key = (part.full_part_number, part.revision)
                part_map[key] = part

            # Similarly for Assemblies
            assemblies_qs = Assembly.objects.filter(
                Q(full_part_number__in=[fpn for fpn, rev in full_part_numbers_with_revision]) &
                Q(revision__in=[rev for fpn, rev in full_part_numbers_with_revision])
            )

            assembly_map = {}
            for assembly_obj in assemblies_qs:
                key = (assembly_obj.full_part_number, assembly_obj.revision)
                assembly_map[key] = assembly_obj

            # And for PCBAs
            pcbas_qs = Pcba.objects.filter(
                Q(full_part_number__in=[fpn for fpn, rev in full_part_numbers_with_revision]) &
                Q(revision__in=[rev for fpn, rev in full_part_numbers_with_revision])
            )

            pcba_map = {}
            for pcba_obj in pcbas_qs:
                key = (pcba_obj.full_part_number, pcba_obj.revision)
                pcba_map[key] = pcba_obj

            # Fetch latest revision Parts by mpn
            latest_parts_qs = Part.objects.filter(
                mpn__in=temporary_mpns, is_latest_revision=True
            )

            latest_part_map = {}
            for part in latest_parts_qs:
                latest_part_map[part.mpn] = part

            # Now assign matched objects to bom_items
            for bom_item in bom_items_to_create:
                temporary_mpn = bom_item.temporary_mpn
                if temporary_mpn:
                    full_part_number_with_revision = temporary_mpn.strip()
                    revision = full_part_number_with_revision[-1]  # Last letter is revision
                    full_part_number = full_part_number_with_revision[:-1]
                    key = (full_part_number, revision)

                    part_match = part_map.get(key)
                    assembly_match = assembly_map.get(key) if not part_match else None
                    pcba_match = pcba_map.get(key) if not part_match and not assembly_match else None
                    part_match_latest = None

                    if not part_match and not assembly_match and not pcba_match:
                        part_match_latest = latest_part_map.get(temporary_mpn)
                        if part_match_latest:
                            bom_item.part = part_match_latest
                    else:
                        if part_match:
                            bom_item.part = part_match
                        elif assembly_match:
                            bom_item.assembly = assembly_match
                        elif pcba_match:
                            bom_item.pcba = pcba_match
                    # No need to save here; we'll use bulk_create

            # Bulk create Bom_item instances
            Bom_item.objects.bulk_create(bom_items_to_create)

            # After processing all rows, commit the transaction
            # If any exception occurs, the transaction will be rolled back
            return Response("BOM uploaded", status=status.HTTP_200_OK)

    except Exception as e:
        return Response(f"An error occurred: {str(e)}", status=status.HTTP_400_BAD_REQUEST)

