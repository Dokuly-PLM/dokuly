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


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
def send_mpns_to_componentvault(request):  # DEPRECATED
    permission, response = check_user_auth_and_app_permission(request, "pcbas")
    if not permission:
        return response
    if "api_key" not in request.data:
        return Response("No api key found", status=status.HTTP_400_BAD_REQUEST)
    api_key = request.data["api_key"]
    try:
        pcbas = PcbaSerializer(Pcba.objects.all(), many=True).data
        if len(pcbas) == 0:
            return Response("No pcbas stored", status=status.HTTP_204_NO_CONTENT)
        mpns = []
        for pcba in pcbas:
            if "mpn" not in pcba or pcba["mpn"] == None or len(pcba["mpn"]) == 0:
                continue
            mpns += pcba["mpn"]
        if len(mpns) > 0:
            res = util.send_mpns_to_component_vault_request(mpns, api_key)
            return Response(res, status=status.HTTP_200_OK)
        return Response("No mpns found", status=status.HTTP_204_NO_CONTENT)
    except Exception as e:
        print(str(e))
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/#/login")
def bulk_search_component_vault(request):  # DEPRECATED
    permission, response = check_user_auth_and_app_permission(request, "pcbas")
    if not permission:
        return response
    try:
        if not "bom" in request.data:
            return Response("No BOM found", status=status.HTTP_400_BAD_REQUEST)

        bom = request.data["bom"]
        mpns = []
        try:
            for i, obj in enumerate(bom):
                if obj["mpn"] != "" and obj["mpn"] != None:
                    if obj["part_id"] == -1:
                        mpns.append(obj["mpn"])
        except Exception as e:
            pass
        if len(mpns) == 0:
            return Response(
                "No MPNs found in the BOM", status=status.HTTP_400_BAD_REQUEST
            )
        if "api_key" not in request.data:
            return Response(
                "Invalid server query, missing key", status=status.HTTP_400_BAD_REQUEST
            )
        api_key = request.data["api_key"]
        try:
            headers = {"Authorization": f"Api-Key {api_key}"}
            mpns_to_send = ",".join(mpns)
            data = {"mpns": f"{mpns_to_send}"}
            url = f"https://componentvault.com/partsApi/v1/bulkFetchParts/"
            response = requests.put(url, data=data, headers=headers, timeout=5)
            if response.status_code == 200:
                # Decode the response content to a string
                response_text = response.content.decode("utf-8")
                # Load the string into a Python dictionary using json.loads
                response_dict = json.loads(response_text)
                return Response(response_dict, status=status.HTTP_200_OK)
            elif response.status_code == 204:
                return Response("No parts found!", status=status.HTTP_204_NO_CONTENT)
            else:
                return Response({"status": response.status_code, "msg": response.text})

        except requests.exceptions.Timeout:
            return Response("Request timed out!", status=status.HTTP_204_NO_CONTENT)

    except Exception as e:
        pass
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)


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
