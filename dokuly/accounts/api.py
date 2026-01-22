from rest_framework import generics, permissions
from rest_framework.response import Response
from knox.models import AuthToken
from rest_framework import viewsets, permissions
from .serializers import UserSerializer, RegisterSerializer, LoginSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from knox.auth import TokenAuthentication
from rest_framework.authentication import BasicAuthentication
from datetime import datetime
from profiles.models import Profile
from profiles.serializers import ProfileSerializer
from rest_framework import status
from organizations.models import Organization
from django.conf import settings
from accounts.email_authentication import EmailAuthentication
import requests

# Register API


class RegisterAPI(generics.GenericAPIView):
    authentication_classes = [BasicAuthentication]
    serializer_class = RegisterSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user.last_login = datetime.now()
        user = serializer.save()
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "token": AuthToken.objects.create(user)[1],
            "token_created:": datetime.now().strftime("%Y,%m,%d,%H,%M,%S")
        })

# Login API


class LoginAPI(generics.GenericAPIView):
    authentication_classes = [EmailAuthentication, BasicAuthentication]
    serializer_class = LoginSerializer

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        profile = Profile.objects.get(user=user)
        org = Organization.objects.get(id=profile.organization_id)
        profile_data = ProfileSerializer(profile, many=False).data
        if profile_data["is_active"] == False:
            return Response("User is not active, contact admin", status=status.HTTP_401_UNAUTHORIZED)
        if profile_data['mfa_validated'] and profile.mfa_hash != None:
            return Response(status=status.HTTP_200_OK)
        user.last_login = datetime.now()
        user.save()
        return Response({
            "user": UserSerializer(user, context=self.get_serializer_context()).data,
            "token": AuthToken.objects.create(user)[1],
            "token_created": datetime.now().strftime("%d,%m,%Y,%H,%M,%S")
        })


class Login2FaAPI(generics.GenericAPIView):

    authentication_classes = [EmailAuthentication, BasicAuthentication]
    serializer_class = LoginSerializer

    def put(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data
        profile = Profile.objects.get(user=user)
        if not profile.is_active:
            return Response("User is not active, contact admin", status=status.HTTP_401_UNAUTHORIZED)
        org = Organization.objects.get(id=profile.organization_id)
        
        # If org doesn't enforce 2FA, allow login regardless of 2FA state
        if not org.enforce_2fa:
            return Response(status=status.HTTP_202_ACCEPTED)
        
        # If org enforces 2FA, check 2FA status
        if profile.mfa_validated and profile.mfa_hash != None:
            return Response(status=status.HTTP_200_OK)
        elif not profile.mfa_validated and profile.mfa_hash == None and org.enforce_2fa:
            return Response(status=status.HTTP_201_CREATED)
        elif not profile.mfa_validated and org.enforce_2fa:
            return Response(status=status.HTTP_201_CREATED)
        else:
            return Response(status=status.HTTP_202_ACCEPTED)

# Get User API


class UserAPI(generics.RetrieveAPIView):
    authentication_classes = (TokenAuthentication,)
    permission_classes = (IsAuthenticated,)
    serializer_class = UserSerializer

    def get_object(self):
        return self.request.user
