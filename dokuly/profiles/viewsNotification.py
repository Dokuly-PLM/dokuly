from django.contrib.auth.decorators import login_required

from rest_framework.response import Response
from rest_framework.decorators import api_view, renderer_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import JSONRenderer
from rest_framework import status
from .models import Notification
from .serializers import NotificationSerializer, ProfileSerializer
from django.db import transaction
from django.shortcuts import get_object_or_404


@api_view(('GET', ))
@renderer_classes((JSONRenderer, ))
@login_required(login_url='/login')
def get_unread_notifications(request):
    user = request.user
    if user is None:
        return Response("No user", status=status.HTTP_204_NO_CONTENT)

    try:
        # Fetch all unread notifications for the user
        unread_notifications = Notification.objects.filter(user=user, is_viewed_by_user=False)

        # Serialize the unread notifications
        serialized_notifications = NotificationSerializer(unread_notifications, many=True).data

        return Response(serialized_notifications, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"detail": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@renderer_classes([JSONRenderer])
@login_required(login_url='/login')
def mark_notification_as_viewed(request, notification_id):
    user = request.user
    notification = get_object_or_404(Notification, id=notification_id, user=user)

    try:
        notification.is_viewed_by_user = True
        notification.save()

        # Return the updated notification
        serialized_notification = NotificationSerializer(notification).data
        return Response(serialized_notification, status=status.HTTP_200_OK)

    except Exception as e:
        return Response({"detail": "An unexpected error occurred."}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@renderer_classes([JSONRenderer])
@permission_classes([IsAuthenticated])
def mark_all_notifications_as_read(request):
    user = request.user

    with transaction.atomic():
        # Select notifications that are not yet marked as viewed to update
        notifications = Notification.objects.filter(user=user, is_viewed_by_user=False)
        notifications.update(is_viewed_by_user=True)

        count = notifications.count()

    return Response({"detail": f"{count} notifications marked as read."}, status=status.HTTP_200_OK)
