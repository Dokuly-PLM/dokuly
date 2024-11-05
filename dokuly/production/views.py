from django.shortcuts import render
from django.http import HttpResponse
from production.models import Production
from rest_framework import generics, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from .serializers import ProductionSerializer
from files.serializers import FileSerializer
from files.models import File
from pcbas.models import Pcba
from django.db.models import Q
from django.contrib.auth.decorators import login_required
import json
from profiles.views import check_user_auth_and_app_permission
from organizations.permissions import APIAndProjectAccess

# This is a way to set up specific views while still using the rest_framework
# Using views like this allows for faster db queries by the usage of filtering in backend
# This also lets us fetch data by specific api calls from the client, and lets us fetch data from server quickly
# in situations where we dont need all the data in one or more tables

# Need to rewrite this and utilize the new assembly id


@api_view(('GET',))
@renderer_classes((JSONRenderer,))
@login_required(login_url='/login')
def fetch_single_production(request, id):
    # Check user authentication and permissions
    permission, response = check_user_auth_and_app_permission(
        request, "production")
    if not permission:
        return response

    data = Production.objects.select_related(
        'lot',
        'pcba',
        'assembly',
        'description',
        'part'
    ).get(id=id)

    # Serialize the fetched data
    serializer = ProductionSerializer(data, many=False)
    return Response(serializer.data)


# EVERYTHING BELOW THIS LINE IS DEPRECATED ---------------------------------------------------


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def clear_edit_history(request, prodId):
    return Response()


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def edit_software_info(request, prod_id, file_id):
    permission, response = check_user_auth_and_app_permission(
        request, "production")
    if not permission:
        return response
    data = request.data
    prod_object = Production.objects.get(id=prod_id)
    serializerCurrent = ProductionSerializer(prod_object, many=False)
    current_software_history = []
    if 'software_history' in serializerCurrent.data:
        if serializerCurrent.data['software_history'] != None:
            current_software_history = serializerCurrent.data['software_history']
    if 'software_array' in data:
        current_software_history.append(data['software_array'])
    Production.objects.filter(id=prod_id).update(
        software_history=current_software_history,
    )
    File.objects.filter(id=file_id).update(
        display_name=data['display_name']
    )
    newProd = Production.objects.get(id=prod_id)
    serializer = ProductionSerializer(newProd, many=False)
    newFile = File.objects.get(id=file_id)
    serializerFile = FileSerializer(newFile, many=False)
    url = newFile.file.url
    files = []
    file_ids = []
    if 'file_ids' in serializer.data:
        if serializer.data['file_ids'] != None:
            file_ids = serializer.data['file_ids']
    for id in file_ids:
        if id != None and id != "" and id != -1:
            file = File.objects.get(id=id)
            url = file.file.url
            entry = {
                'url': url,
                'id': file.id,
                'active': file.active,
                'display_name': file.display_name
            }
            files.append(entry)
    entry = {
        'url': url,
        'id': newFile.id,
        'display_name': serializerFile.data['display_name'],
        'active': serializerFile.data['display_name']
    }
    data = {
        'prod': serializer.data,
        'file': entry,
        'files': files
    }
    return Response(data, status=status.HTTP_200_OK)


@api_view(('PUT', 'POST'))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def edit_pcba_prod(request, id):
    permission, response = check_user_auth_and_app_permission(
        request, "production")
    if not permission:
        return response
    data = request.data
    if data == None or id == None:
        return Response("Data sent not valid", status=status.HTTP_400_BAD_REQUEST)
    sub_prod = False
    if data['sub_production'] == "true":
        sub_prod = True

    current_prod = Production.objects.get(id=data['id'])
    serializerCurrent = ProductionSerializer(current_prod, many=False)
    current_history = []
    if serializerCurrent.data['edit_history'] != None:
        current_history = list(serializerCurrent.data['edit_history'])
    current_history.append(data['entry'])
    if data['state'] == "Delivered" or data['state'] == "Ready for shipment":
        Production.objects.filter(id=id).update(
            comment=data['comment'],
            state=data['state'],
            assembly_date=data['assembly_date'],
            revision=data['revision'],
            sub_production=sub_prod,
            edit_history=current_history,
            customer_id=data['customer_id'],
            last_updated=data['last_updated']
        )
    else:
        Production.objects.filter(id=id).update(
            comment=data['comment'],
            state=data['state'],
            assembly_date=data['assembly_date'],
            revision=data['revision'],
            sub_production=sub_prod,
            edit_history=current_history,
            last_updated=data['last_updated']
        )
    new_prod = Production.objects.get(id=data['id'])
    serializer = ProductionSerializer(new_prod, many=False)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def add_pcba_prod_edge(request, source, target):
    permission, response = check_user_auth_and_app_permission(
        request, "production")
    if not permission:
        return response
    prod_obj_source = Production.objects.get(id=source)
    prod_obj_target = Production.objects.get(id=target)
    current_next = []
    if prod_obj_source.next_prod != None:
        if len(prod_obj_source.next_prod) > 0:
            current_next = list(prod_obj_source.next_prod)

    if target != None and prod_obj_source != None:
        if target not in current_next:
            current_next.append(target)
            Production.objects.filter(id=source).update(next_prod=current_next)
        else:
            return Response("Target is already added, two connections to same prod not allowed", status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response("Target is None or prod not found", status=status.HTTP_404_NOT_FOUND)

    current_prev = []
    if prod_obj_target.prev_prod != None:
        if len(prod_obj_target.prev_prod) > 0:
            current_prev = list(prod_obj_target.prev_prod)

    if source != None and prod_obj_target != None:
        if source not in current_prev:
            current_prev.append(source)
            Production.objects.filter(id=target).update(prev_prod=current_prev)
        else:
            return Response("Source is already added, two connections to same prod not allowed", status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response("Source is None or prod not found", status=status.HTTP_404_NOT_FOUND)

    return Response("Added %d as target in %d and added %d as source in %d" %
                    (target, source, source, target), status=status.HTTP_200_OK)


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def remove_edge(request, source, target):
    permission, response = check_user_auth_and_app_permission(
        request, "production")
    if not permission:
        return response
    prod_obj_source = Production.objects.get(id=source)
    prod_obj_target = Production.objects.get(id=target)
    current_next = []
    if len(prod_obj_source.next_prod) > 0:
        current_next = list(prod_obj_source.next_prod)

    if target != None and prod_obj_source != None:
        if target in current_next and current_next != None:
            current_next.remove(target)
            Production.objects.filter(id=source).update(next_prod=current_next)
        else:
            return Response("Target not found", status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response("Target is None or prod not found", status=status.HTTP_404_NOT_FOUND)

    current_prev = []
    if len(prod_obj_target.prev_prod) > 0:
        current_prev = list(prod_obj_target.prev_prod)

    if source != None and prod_obj_target != None:
        if source in current_prev and current_prev != None:
            current_prev.remove(source)
            Production.objects.filter(id=target).update(prev_prod=current_prev)
        else:
            return Response("Target not found", status=status.HTTP_400_BAD_REQUEST)
    else:
        return Response("Target is None or prod not found", status=status.HTTP_404_NOT_FOUND)
    return Response("Removed connection between Productions %d and %d" % (source, target), status=status.HTTP_200_OK)


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def fetch_pcba_prod_nodes(request, asmID):
    permission, response = check_user_auth_and_app_permission(
        request, "production")
    if not permission:
        return response
    data = Production.objects.filter(asm_serial_id=asmID)
    serializer = ProductionSerializer(data, many=True)
    return Response(serializer.data)


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def add_id_to_added_node(request, nodeId, id):
    permission, response = check_user_auth_and_app_permission(
        request, "production")
    if not permission:
        return response
    Production.objects.filter(id=nodeId).update(asm_serial_id=id)
    if nodeId == None or id == None:
        return Response("Values received by server not valid (%d, %d)" % (nodeId, id))
    if type(nodeId) is not int or type(id) is not int:
        return Response("Values received by server not valid, expected type (int, int) but got (", type(nodeId), ", ", type(id), ")")
    return Response("Saved asm id %d in production %d" % (id, nodeId), status=status.HTTP_200_OK)


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def remove_node(request, nodeId, flag):
    permission, response = check_user_auth_and_app_permission(
        request, "production")
    if not permission:
        return response
    if flag == 0:
        Production.objects.filter(id=nodeId).update(
            asm_serial_id=None)  # Remove serial connection
        return Response("Removed node, no connections to remove", status=status.HTTP_200_OK)
    if flag == 1:
        node_to_remove = Production.objects.get(id=nodeId)  # Node to remove
        Production.objects.filter(id=nodeId).update(
            asm_serial_id=None)  # Remove serial connection
        Production.objects.filter(id=nodeId).update(
            next_prod=[])  # Remove connections to forward nodes
        Production.objects.filter(id=nodeId).update(
            prev_prod=[])  # Remove connections to backward nodes
        currentNext = []
        if node_to_remove.next_prod != None:
            if len(node_to_remove.next_prod) != 0:
                currentNext = list(node_to_remove.next_prod)
        currentPrev = []
        if node_to_remove.prev_prod != None:
            if len(node_to_remove.prev_prod) != 0:
                currentPrev = list(node_to_remove.prev_prod)
        if currentNext == [] and currentPrev == []:
            return Response("Removed node, no connections to remove", status=status.HTTP_200_OK)
        if currentNext != []:
            for node in currentNext:
                nextNode = Production.objects.get(id=node)
                nextNodePrev = list(nextNode.prev_prod)
                if nextNodePrev != None:
                    if nodeId in nextNodePrev:
                        nextNodePrev.remove(nodeId)
                Production.objects.filter(id=node).update(
                    prev_prod=nextNodePrev)
        if currentPrev != []:
            for node in currentPrev:
                prevNode = Production.objects.get(id=node)
                prevNodeNext = list(prevNode.next_prod)
                if prevNodeNext != None:
                    if nodeId in prevNodeNext:
                        prevNodeNext.remove(nodeId)
                Production.objects.filter(id=node).update(
                    next_prod=prevNodeNext)
    return Response("Removed node with id %d and its connections" % (nodeId), status=status.HTTP_200_OK)
