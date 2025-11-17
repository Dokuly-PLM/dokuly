import requests
import pcbas.viewUtilities as util
import json
from django.contrib.auth.decorators import login_required
from rest_framework import status
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.renderers import JSONRenderer
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from organizations.permissions import APIAndProjectAccess
from .serializers import PcbaSerializer
from parts.models import Part
from pcbas.models import Pcba
from assembly_bom.models import Assembly_bom, Bom_item
from profiles.views import check_user_auth_and_app_permission
import csv
from django.db import transaction
from assembly_bom.serializers import BomItemSerializer
from assemblies.models import Assembly
from django.db.models import Q


#TODO is this deprecated?
@api_view(("POST",))
@renderer_classes((JSONRenderer,))
@permission_classes([IsAuthenticated | APIAndProjectAccess])
def upload_pcba_bom(request, pcba_id, **kwargs):
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
            # Retrieve or create a BOM for the given PCBA
            pcba = Pcba.objects.get(pk=pcba_id)

            if pcba.release_state == "Released":
                return Response(
                    "Can't edit a released pcba!", status=status.HTTP_400_BAD_REQUEST
                )

            bom, created = Assembly_bom.objects.get_or_create(pcba=pcba)

            # Prepare data for bulk operations
            bom_items_to_create = []
            full_part_numbers_with_revision = set()
            temporary_mpns = set()

            for row in csv_rows:
                # Extract necessary fields (adjust field names as per your CSV columns)
                designator = row.get('Reference', '').strip()
                temporary_mpn = row.get('MPN', '').strip() or None
                quantity = int(row.get('QUANTITY', '1'))
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
            for assembly in assemblies_qs:
                key = (assembly.full_part_number, assembly.revision)
                assembly_map[key] = assembly

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
