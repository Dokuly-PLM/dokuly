from django.shortcuts import render
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from .models import DomainNames
from .serializers import DomainSerializer
import os


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
def check_availability(request):
    d = request.data
    if 'domain' not in d:
        return Response("Invalid request parameters", status=status.HTTP_400_BAD_REQUEST)
    domain_names = DomainSerializer(DomainNames.objects.all(), many=True).data
    if d['domain'] == None or d['domain'] == "":
        return Response("Invalid workspace domain", status=status.HTTP_400_BAD_REQUEST)

    local_server = bool(int(os.environ.get('DJANGO_LOCAL_SERVER', 0)))
    if local_server:
        for obj in domain_names:
            if obj['schema_name'] == d['domain'] or obj['schema_name'] == f"{d['domain']}.dokuly.localhost":
                return Response("Invalid workspace domain", status=status.HTTP_400_BAD_REQUEST)
        return Response("Valid workspace domain", status=status.HTTP_200_OK)

    for obj in domain_names:
        if obj['schema_name'] == d['domain'] or obj['schema_name'] == f"{d['domain']}.dokuly.com":
            return Response("Invalid workspace domain", status=status.HTTP_400_BAD_REQUEST)
    return Response("Valid workspace domain", status=status.HTTP_200_OK)
