from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from django.contrib.auth.decorators import login_required

from .methods import create_part_number_with_specific_primary_key

@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
def offset_part_number(request, offset_value):
    """View for setting a part number offset value.
    """
    if request.user == None:
        return Response("Not Authorized", status=status.HTTP_401_UNAUTHORIZED)
    if offset_value == None:
        return Response("No id sent with the request", status=status.HTTP_400_BAD_REQUEST)
    try:
        create_part_number_with_specific_primary_key(offset_value)
        
        return Response(f"Next free part_number is {offset_value}", status=status.HTTP_200_OK)
    except Exception as e:
        return Response(f"offset_part_number failed: {e}", status=status.HTTP_404_NOT_FOUND)