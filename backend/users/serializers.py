# serializers.py

from rest_framework import serializers
from .models import CustomUser, AdminProfile, AgentProfile

from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken,AccessToken
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.exceptions import InvalidToken

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'role']


class AdminProfileSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer()

    class Meta:
        model = AdminProfile
        fields = ['user', 'first_name', 'last_name', 'email', 'access_level']


class AgentProfileSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer()

    class Meta:
        model = AgentProfile
        fields = ['user', 'agent_type']


class RegisterUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['username', 'password', 'role']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data) #kommen hier admin/agent spezifische daten rein?
        return user
    

# Custom Token Refresh Serializer to encode user role into token
class CustomTokenRefreshSerializer(TokenRefreshSerializer):  

    def validate(self, attrs):
        data = super().validate(attrs)

        refresh = self.token_class(attrs["refresh"])
        user_id = refresh.get("user_id", None)
        if user_id is None:
            raise InvalidToken("No user_id in refresh token")

        User = get_user_model()
        user = User.objects.get(id=user_id)

        access = AccessToken.for_user(user)
        access['role'] = user.role  # Wichtig: wieder hinzufügen
        data["access"] = str(access)
        data["role"] = user.role

        return data
    

# Custom Token Obtain Pair Serializer to encode user role into token
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = getattr(user, 'role', None)
        return token
    
    #optional: if you want to send role in response
    def validate(self, attrs):
        data = super().validate(attrs)

        # Add role
        data['role'] = getattr(self.user, 'role', None)  # assumes `role` field exists on user
        return data