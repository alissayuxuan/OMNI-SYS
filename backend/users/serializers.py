# serializers.py

from rest_framework import serializers
from .models import CustomUser, AdminProfile, AgentProfile
from api.models import Agent

from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from rest_framework_simplejwt.tokens import RefreshToken,AccessToken
from django.contrib.auth import get_user_model
from rest_framework_simplejwt.exceptions import InvalidToken
from django.db import transaction

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['id', 'username', 'role', 'date_joined']
        read_only_fields = ['date_joined']


class AdminProfileSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer()

    class Meta:
        model = AdminProfile
        fields = '__all__'


class AgentProfileSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer()

    class Meta:
        model = AgentProfile
        fields = '__all__'


class RegisterUserSerializer(serializers.Serializer):
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)
    role = serializers.ChoiceField(choices=[('admin', 'admin'), ('agent', 'agent')])

    # Admin fields
    first_name = serializers.CharField(required=False)
    last_name = serializers.CharField(required=False)
    email = serializers.EmailField(required=False)

    # Agent fields
    agent_name = serializers.CharField(required=False)

    def validate(self, data):
        role = data.get('role')

        if role == 'admin':
            required_fields = ['first_name', 'last_name', 'email']
        elif role == 'agent':
            required_fields = ['agent_name']
        else:
            raise serializers.ValidationError("Invalid role")

        missing = [field for field in required_fields if not data.get(field)]
        if missing:
            raise serializers.ValidationError({field: "This field is required for role {}".format(role) for field in missing})

        return data

    @transaction.atomic
    def create(self, validated_data):
        role = validated_data.pop('role')
        password = validated_data.pop('password')
        username = validated_data.pop('username')
        
        # Extract profile-specific fields
        if role == 'admin':
            admin_fields = {k: validated_data.pop(k) for k in ['first_name', 'last_name', 'email'] if k in validated_data}
        else:
            agent_name = validated_data.pop('agent_name')

        try:
            user = CustomUser.objects.create_user(username=username, role=role)
            user.set_password(password)
            user.save()

            if role == 'admin':
                AdminProfile.objects.create(user=user, **admin_fields)
            else:
                agent_object = Agent.objects.create(name=agent_name)
                AgentProfile.objects.create(user=user, agent_object=agent_object)

                #AgentProfile.objects.create(user=user, **agent_fields)
            return user
        
        except Exception as e:
            raise serializers.ValidationError({"detail": f"Registration failed: {str(e)}"})
    

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