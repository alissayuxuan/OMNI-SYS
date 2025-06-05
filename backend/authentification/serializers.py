"""from rest_framework import serializers
from .models import User  
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password", "first_name", "last_name"]
        extra_kwargs = {"password": {"write_only": True}} # not returned in response!

    def create(self, validated_data):
        print(validated_data)
        return User.objects.create_user(**validated_data) # hashes the password and saves user in database


# include JWT for custom user model
class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Custom-Felder hinzufügen
        token['username'] = user.username
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        return token
"""