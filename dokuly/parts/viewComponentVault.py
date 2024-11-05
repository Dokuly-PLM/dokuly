import json
from django.http import HttpResponse
from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from django.contrib.auth.decorators import login_required
from django.conf import settings
from urllib import response
import requests


@api_view(('PUT', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url="/#/login")
def search_component_vault_by_mpn(request):
    if request.user == None:
        return Response("Unauthorized", status=status.HTTP_401_UNAUTHORIZED)
    data = request.data
    try:
        if not "mpn" in request.data:
            return Response("No MPN found", status=status.HTTP_400_BAD_REQUEST)
        mpn = data["mpn"]
        api_key = ""
        if 'api_key' in data:
            api_key = data['api_key']
        else:
            api_key = settings.COMPONENT_VAULT_API_KEY
        try:
            headers = {
                'Authorization': f'Api-Key {api_key}'
            }
            form_data = {'searchString': mpn}
            url = f"https://componentvault.com/partsApi/v2/searchByMpn/"
            response = requests.put(
                url, data=form_data, headers=headers, timeout=90)
            if response.status_code == 200:
                # Decode the response content to a string
                response_text = response.content.decode('utf-8')

                # Load the string into a Python dictionary using json.loads
                response_dict = json.loads(response_text)
                if response.status_code == 401 or response.status_code == 403:
                    return Response(f"Missing credentials or unauthorized: {response.status_code}", status=status.HTTP_400_BAD_REQUEST)
                return Response(response_dict, status=status.HTTP_200_OK)
            else:
                return Response("No parts found!", status=status.HTTP_204_NO_CONTENT)
        except requests.exceptions.Timeout:
            return Response("Request timed out!", status=status.HTTP_408_REQUEST_TIMEOUT)
    except Exception as e:
        print(str(e))
        return Response(str(e), status=status.HTTP_400_BAD_REQUEST)
