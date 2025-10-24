from django.shortcuts import get_object_or_404
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from django.db.models import Q
from django.contrib.auth.decorators import login_required

from pcbas.models import Pcba
from parts.models import Part
from assemblies.models import Assembly
from .models import Assembly_bom
from pcbas.serializers import PcbaSerializer
from .serializers import Assembly_bomSerializer
from assemblies.serializers import AssemblySerializer
from parts.serializers import PartSerializer
from profiles.views import check_user_auth_and_app_permission


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def update_comments(request, bomId):
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response
    
    data = request.data
    Assembly_bom.objects.filter(id=bomId).update(comments=data["comments"])
    newBom = Assembly_bom.objects.get(id=bomId)
    serializer = Assembly_bomSerializer(newBom, many=False)
    return Response(serializer.data, status=status.HTTP_202_ACCEPTED)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_bom_by_asm_id(request, asm_id):
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response
    
    if asm_id == None or asm_id == -1:
        return Response("Invalid ASM id", status=status.HTTP_400_BAD_REQUEST)

    bom = get_object_or_404(Assembly_bom, assembly_id=asm_id)
    serializer = Assembly_bomSerializer(bom, many=False)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_bom_by_pcba_id(request, pcba_id):
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response
    
    if pcba_id == None or pcba_id == -1:
        return Response("Invalid PCBA id", status=status.HTTP_400_BAD_REQUEST)

    bom, created = Assembly_bom.objects.get_or_create(pcba__id=pcba_id)
    if created:
        bom.pcba_id = pcba_id
        bom.save()

    serializer = Assembly_bomSerializer(bom, many=False)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def copy_bom(request, asmId):
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response
    
    data = request.data
    Assembly.objects.filter(id=asmId).update(multiple_bom_vars=True)
    newBom = Assembly_bom.objects.get(id=int(data["id"]))
    newBom.id = None
    newBom.save()
    bom = Assembly_bom.objects.last()
    bomId = bom.id
    Assembly_bom.objects.filter(id=bomId).update(assembly_id=asmId)
    new_bom = Assembly_bom.objects.last()
    updated_bom = Assembly_bom.objects.get(id=new_bom.id)
    serializer = Assembly_bomSerializer(updated_bom, many=False)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def fetch_all_boms(request, assembly_id):
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response
    
    if assembly_id == None:
        return Response("Invalid assembly id", status=status.HTTP_400_BAD_REQUEST)
    objects = Assembly_bom.objects.filter(assembly_id=assembly_id)
    serializer = Assembly_bomSerializer(objects, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_bom(request, bom_id):
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response
    
    if bom_id == None:
        return Response("Invalid assembly id", status=status.HTTP_400_BAD_REQUEST)
    objects = Assembly_bom.objects.get(id=bom_id)
    serializer = Assembly_bomSerializer(objects, many=False)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def merged_search(request, search):
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response
    
    if search == None or search == "":
        return Response("Invalid search, try again", status=status.HTTP_400_BAD_REQUEST)
    part_qs = Part.objects.filter(
        Q(mpn__contains=search)
        | Q(part_number__contains=search)
        | Q(display_name__contains=search)
    )
    part_serializer = PartSerializer(part_qs, many=True)
    asm_qs = Assembly.objects.filter(
        Q(part_number__contains=search) | Q(display_name__contains=search)
    )
    asm_serializer = AssemblySerializer(asm_qs, many=True)
    pcba_qs = Pcba.objects.filter(
        Q(part_number__contains=search) | Q(display_name__contains=search)
    )
    pcba_serializer = PcbaSerializer(pcba_qs, many=True)
    data = []
    data.append({"data": part_serializer.data, "type": "PRT"})  # [0] part
    data.append({"data": asm_serializer.data, "type": "ASM"})  # [1] asm
    data.append({"data": pcba_serializer.data, "type": "PCBA"})  # [2] pcba
    return Response(data, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def simple_asm_bom_search(request, search, currentBomId):
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response
    
    if search == None or search == "":
        return Response("Search string not valid", status=status.HTTP_400_BAD_REQUEST)
    boms = []
    qs = Assembly_bom.objects.filter(bom_name__contains=search)
    serializer = Assembly_bomSerializer(qs, many=True)
    for i in range(len(serializer.data)):
        asm = None
        try:
            asm = Assembly.objects.get(id=int(serializer.data[i]["assembly_id"]))
            asm_serializer = AssemblySerializer(asm, many=False)
            asm = asm_serializer.data
        except Exception as e:
            print(e)
        if asm != None and int(serializer.data[i]["id"]) != int(currentBomId):
            result = {"asm": asm_serializer.data, "bom": serializer.data[i]}
            boms.append(result)
    return Response(boms, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
@login_required(login_url="/login")
def get_where_used(request, app, item_id):
    """
    Get all BOMs where a specific part, assembly, or PCBA is used.
    Returns assemblies and PCBAs that contain this item in their BOM.
    Excludes self-references to prevent circular dependencies.
    
    Query parameters:
    - latest_only: If true, only show usage in latest revisions (default: true)
    """
    permission, response = check_user_auth_and_app_permission(request, "assemblies")
    if not permission:
        return response
    
    if item_id is None or item_id == -1:
        return Response("Invalid item id", status=status.HTTP_400_BAD_REQUEST)
    
    # Get query parameter for latest revisions filter
    latest_only = request.GET.get('latest_only', 'true').lower() == 'true'
    
    try:
        from .models import Bom_item
        
        # Find all BOM items that reference this part/assembly/PCBA
        # Filter by the correct field based on the app type
        if app == "parts":
            bom_items = Bom_item.objects.filter(part_id=item_id)
        elif app == "assemblies":
            bom_items = Bom_item.objects.filter(assembly_id=item_id)
        elif app == "pcbas":
            bom_items = Bom_item.objects.filter(pcba_id=item_id)
        else:
            # Fallback to original logic for unknown app types
            bom_items = Bom_item.objects.filter(
                Q(part_id=item_id) | Q(assembly_id=item_id) | Q(pcba_id=item_id)
            )
        
        # Group by parent (assembly/pcba) and BOM to aggregate quantities and designators
        grouped_data = {}
        
        for bom_item in bom_items:
            bom = bom_item.bom
            if not bom:
                continue
                
            # Get the parent assembly or PCBA that owns this BOM
            parent_assembly = None
            parent_pcba = None
            
            if bom.assembly_id:
                try:
                    parent_assembly = Assembly.objects.get(id=bom.assembly_id)
                    # Skip self-references for assemblies
                    if app == "assemblies" and parent_assembly.id == item_id:
                        continue
                    # Filter by latest revision if requested
                    if latest_only and not parent_assembly.is_latest_revision:
                        continue
                except Assembly.DoesNotExist:
                    continue
            elif bom.pcba_id:
                try:
                    parent_pcba = Pcba.objects.get(id=bom.pcba_id)
                    # Skip self-references for PCBAs
                    if app == "pcbas" and parent_pcba.id == item_id:
                        continue
                    # Filter by latest revision if requested
                    if latest_only and not parent_pcba.is_latest_revision:
                        continue
                except Pcba.DoesNotExist:
                    continue
            
            # Create a unique key for grouping (parent + BOM)
            if parent_assembly:
                group_key = f"assembly_{parent_assembly.id}_{bom.id}"
                parent_type = 'assembly'
                parent_obj = parent_assembly
            elif parent_pcba:
                group_key = f"pcba_{parent_pcba.id}_{bom.id}"
                parent_type = 'pcba'
                parent_obj = parent_pcba
            else:
                continue
            
            # Initialize group if it doesn't exist
            if group_key not in grouped_data:
                grouped_data[group_key] = {
                    'parent_type': parent_type,
                    'parent': parent_obj,
                    'bom_id': bom.id,
                    'bom_name': bom.bom_name,
                    'bom_comments': bom.comments,
                    'total_quantity': 0,
                    'designators': [],
                    'bom_items': [],
                    'all_mounted': True,
                    'comments': []
                }
            
            # Aggregate data - ensure quantities are integers
            quantity = int(bom_item.quantity) if bom_item.quantity is not None else 0
            grouped_data[group_key]['total_quantity'] += quantity
            if bom_item.designator:
                grouped_data[group_key]['designators'].append(bom_item.designator)
            grouped_data[group_key]['bom_items'].append(bom_item.id)
            if not bom_item.is_mounted:
                grouped_data[group_key]['all_mounted'] = False
            if bom_item.comment:
                grouped_data[group_key]['comments'].append(bom_item.comment)
        
        # Convert grouped data to final format
        where_used_data = []
        
        for group_key, group_data in grouped_data.items():
            # Serialize parent data
            if group_data['parent_type'] == 'assembly':
                parent_serializer = AssemblySerializer(group_data['parent'], many=False)
            else:
                parent_serializer = PcbaSerializer(group_data['parent'], many=False)
            
            # Create designator string
            designators_str = ', '.join(sorted(set(group_data['designators']))) if group_data['designators'] else 'No designators'
            
            # Create comments string
            comments_str = '; '.join(filter(None, group_data['comments'])) if group_data['comments'] else ''
            
            result_item = {
                'parent_type': group_data['parent_type'],
                'parent': parent_serializer.data,
                'bom_id': group_data['bom_id'],
                'bom_name': group_data['bom_name'],
                'bom_comments': group_data['bom_comments'],
                'total_quantity': int(group_data['total_quantity']),  # Ensure integer
                'designators': designators_str,
                'bom_item_count': len(group_data['bom_items']),
                'all_mounted': group_data['all_mounted'],
                'comments': comments_str,
                'bom_items': group_data['bom_items']  # For debugging/tracking
            }
            
            where_used_data.append(result_item)
        
        return Response(where_used_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        return Response(
            f"get_where_used failed: {e}",
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )
