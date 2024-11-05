from django.core.exceptions import MultipleObjectsReturned
from django.contrib.auth import get_user_model, authenticate
from django.contrib.auth.backends import ModelBackend
from django.contrib.auth.models import User
from rest_framework import authentication
from rest_framework import exceptions


class EmailAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        email = request.data.get('email')
        password = request.data.get('password')

        if not email or not password:
            return None  # No attempt to authenticate if email or password isn't provided
        print(email)
        print(User.objects.filter(email__iexact=email).exists())
        if not User.objects.filter(email=email).exists():
            raise exceptions.AuthenticationFailed('No such user')
        username = User.objects.get(email=email).username
        user = authenticate(username=username, password=password)
        if user is None:
            raise exceptions.AuthenticationFailed('No such user or wrong password')

        return (user, None)  # authentication successful


class EmailAuthBackend(ModelBackend):
    def authenticate(self, request, username=None, password=None, **kwargs):
        UserModel = get_user_model()
        try:
            user = UserModel.objects.get(email=username)  # Using username as the email
            if user.check_password(password):
                return user
        except UserModel.DoesNotExist:
            return None
        except MultipleObjectsReturned:
            return None

    def get_user(self, user_id):
        UserModel = get_user_model()
        try:
            return UserModel.objects.get(pk=user_id)
        except UserModel.DoesNotExist:
            return None
