from documents.models import Document_Prefix

from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status

from .serializers import DocumentPrefixSerializer

from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status

from profiles.views import check_permissions_standard, check_user_auth_and_app_permission
from django.db.models import Q


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
def fetch_prefixes(request):
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "documents")
    if not permission:
        return response
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    prefixes = Document_Prefix.objects.filter(~Q(archived="True"))
    serializer = DocumentPrefixSerializer(prefixes, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("POST",))
@renderer_classes((JSONRenderer,))
def new_prefix(request):
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "documents")
    if not permission:
        return response
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    data = request.data
    if data == None:
        res = Document_Prefix.objects.all()
        serializer = DocumentPrefixSerializer(res, many=True)
        return Response(serializer.data, status=status.HTTP_400_BAD_REQUEST)
    prefix = Document_Prefix.objects.create(
        prefix=data["prefix"],
        display_name=data["display_name"],
        description=data["description"],
        project_doc=data["project_doc"],
        part_doc=data["part_doc"],
        archived="False",
    )
    prefixes = Document_Prefix.objects.filter(~Q(archived="True"))
    serializer = DocumentPrefixSerializer(prefixes, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("GET",))
@renderer_classes((JSONRenderer,))
def fetch_archived_prefixes(request):
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "documents")
    if not permission:
        return response
    prefixes = Document_Prefix.objects.filter(archived="True")
    serializer = DocumentPrefixSerializer(prefixes, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)


@api_view(("PUT",))
@renderer_classes((JSONRenderer,))
def edit_prefix(request, prefixId):
    user = request.user
    permission, response = check_user_auth_and_app_permission(request, "documents")
    if not permission:
        return response
    check = check_permissions_standard(user)
    if not check:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    if request.data == None or prefixId == None:
        documents = Document_Prefix.objects.all()
        serializer = DocumentPrefixSerializer(documents, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    data = request.data
    if "prefix" in data:
        Document_Prefix.objects.filter(id=prefixId).update(prefix=data["prefix"])
    if "display_name" in data:
        Document_Prefix.objects.filter(id=prefixId).update(
            display_name=data["display_name"]
        )
    if "description" in data:
        Document_Prefix.objects.filter(id=prefixId).update(
            description=data["description"]
        )
    if "part_doc" in data:
        Document_Prefix.objects.filter(id=prefixId).update(part_doc=data["part_doc"])
    if "project_doc" in data:
        Document_Prefix.objects.filter(id=prefixId).update(
            project_doc=data["project_doc"]
        )
    if "archive" in data:
        value = ""
        if data["archive"] == True or data["archive"] == "true":
            value = "True"
        else:
            value = "False"
        # print(data['archive'])
        if value == "True":
            if "archived_date" in data:
                if data["archived_date"] != None:
                    Document_Prefix.objects.filter(id=prefixId).update(
                        archived_date=data["archived_date"]
                    )
        Document_Prefix.objects.filter(id=prefixId).update(archived=value)
        # print(value)
        if value == "False":
            newPrefixes = Document_Prefix.objects.filter(~Q(archived="True"))
            archived = Document_Prefix.objects.filter(archived="True")
            serializer = DocumentPrefixSerializer(newPrefixes, many=True)
            archivedSerializer = DocumentPrefixSerializer(archived, many=True)
            retData = {"prefixes": serializer.data, "archived": archivedSerializer.data}
            return Response(retData, status=status.HTTP_200_OK)
    newPrefixes = Document_Prefix.objects.filter(~Q(archived="True"))
    serializer = DocumentPrefixSerializer(newPrefixes, many=True)
    return Response(serializer.data, status=status.HTTP_200_OK)
