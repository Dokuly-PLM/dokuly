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
