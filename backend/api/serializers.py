from django.contrib.auth.models import User
from rest_framework import serializers


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "password"]
        extra_kwargs = {"password": {"write_only": True}} # not returned in response!

    def create(self, validated_data):
        print(validated_data)
        user = User.objects.create_user(**validated_data) # hashes the password and saves user in database
        return user
