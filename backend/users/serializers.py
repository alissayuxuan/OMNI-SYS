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


User = get_user_model()


class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'role', 'date_joined']
        read_only_fields = ['id', 'role', 'date_joined']


# --- READ serializers ---
class AdminProfileSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)

    class Meta:
        model = AdminProfile
        fields = ['id', 'user', 'first_name', 'last_name', 'email']


class AgentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agent
        fields = ['id', 'name'] 

class AgentProfileSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)
    agent_object = AgentSerializer(read_only=True)
    class Meta:
        model = AgentProfile
        fields = ['id', 'user', 'agent_object']




# --- UPDATE serializers ---
class AdminProfileUpdateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    email = serializers.EmailField()

    class Meta:
        model = AdminProfile
        fields = ['username', 'first_name', 'last_name', 'email']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        username = user_data.get('username')

        if username:
            instance.user.username = username
            instance.user.save()

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        return instance


class AgentProfileUpdateSerializer(serializers.ModelSerializer):
    username = serializers.CharField(source='user.username')
    name = serializers.CharField()

    class Meta:
        model = AgentProfile
        fields = ['username', 'name']

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', {})
        username = user_data.get('username')

        if username:
            instance.user.username = username
            instance.user.save()

        instance.agent_object.name = validated_data['name']  # optional fallback
        instance.agent_object.save()
        return instance


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True)

    def validate_current_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Current password is incorrect")
        return value

    def validate_new_password(self, value):
        if len(value) < 8:
            raise serializers.ValidationError("Password must be at least 8 characters")
        return value

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user
    
"""
User = get_user_model()

class CustomUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'role']

class AgentProfileSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)

    class Meta:
        model = AgentProfile
        fields = ['id', 'user', 'agent_object']

class AdminProfileSerializer(serializers.ModelSerializer):
    user = CustomUserSerializer(read_only=True)

    class Meta:
        model = AdminProfile
        fields = ['id', 'user', 'first_name', 'last_name', 'email']
"""
"""
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
"""

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
        access['user_id'] = user.id
        access['role'] = user.role  # Wichtig: wieder hinzufügen
        data["access"] = str(access)
        data["role"] = user.role

        return data
    

# Custom Token Obtain Pair Serializer to encode user role, user id into token
class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):    
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token['role'] = getattr(user, 'role', None)
        token['user_id'] = user.id
        return token
    
    #optional: if you want to send role in response
    def validate(self, attrs):
        data = super().validate(attrs)

        # Add role
        data['role'] = getattr(self.user, 'role', None)  # assumes `role` field exists on user
        data['user_id'] = self.user.id
        return data