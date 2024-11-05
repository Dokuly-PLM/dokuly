from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from profiles.serializers import ProfileSerializerSmall


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id',
                  'username',
                  'first_name',
                  'last_name',
                  'email'
                  )

# Register Serializer


class UserSerializerNoPersonal(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id',
                  'username',
                  'email'
                  )


class RegisterSerializer(serializers.ModelSerializer):

    class Meta:
        model = User
        fields = (
            'id',
            'username',
            'first_name',
            'last_name',
            'email',
            'password')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):

        user = User.objects.create_user(
            validated_data['username'],
            validated_data['email'],
            validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
        )

        return user

# Login Serializer


class LoginSerializer(serializers.Serializer):
    username = serializers.CharField(required=False)
    password = serializers.CharField()
    email = serializers.EmailField(required=False)

    def validate(self, data):
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')

        if email:
            # Authenticating by email
            if not User.objects.filter(email=email).exists():
                raise serializers.ValidationError("No such user")
            username = User.objects.get(email=email).username
            user = authenticate(username=username, password=password)
        elif username:
            # Authenticating by username
            user = authenticate(username=username, password=password)
        else:
            raise serializers.ValidationError("Must provide either username or email")

        if user is None or not user.is_active:
            raise serializers.ValidationError("Invalid credentials or inactive user")

        return user


class UserSerializerWithProfile(serializers.ModelSerializer):
    profile = ProfileSerializerSmall(read_only=True)  # Nested serializer

    class Meta:
        model = User
        fields = ('id',
                  'username',
                  'first_name',
                  'last_name',
                  'email',
                  'profile'
                  )
