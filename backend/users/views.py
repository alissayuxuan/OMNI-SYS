from django.shortcuts import render

# Create your views here.
from rest_framework import generics, permissions, status
from .models import CustomUser, AdminProfile, AgentProfile
from .serializers import (
    RegisterUserSerializer, CustomTokenRefreshSerializer, CustomTokenObtainPairSerializer, 
    CustomUserSerializer, AgentProfileSerializer, AdminProfileSerializer
)
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView
from django.shortcuts import get_object_or_404



# only logged in admins can enter certain views (eg. register new users)
class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

# register new users
class RegisterUserView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request):
        serializer = RegisterUserSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'User registered successfully'})
        return Response(serializer.errors, status=400)


# Custom Token Refresh View to include user role
class CustomTokenRefreshView(TokenRefreshView):
    serializer_class = CustomTokenRefreshSerializer


# Custom Token Obtain Pair View to include user role
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


# GET, PUT, DELETE api calls on CustomUser
class UserList(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        role = request.query_params.get('role')
        users = CustomUser.objects.filter(role=role) if role else CustomUser.objects.all()
        serializer = CustomUserSerializer(users, many=True)
        return Response(serializer.data)

class UserDetail(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request, user_id):
        user = get_object_or_404(CustomUser, id=user_id)
        serializer = CustomUserSerializer(user)
        return Response(serializer.data)

    def put(self, request, user_id):
        user = get_object_or_404(CustomUser, id=user_id)
        serializer = CustomUserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, user_id):
        user = get_object_or_404(CustomUser, id=user_id)
        user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    

class AgentProfileList(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        agents = AgentProfile.objects.all()
        serializer = AgentProfileSerializer(agents, many=True)
        return Response(serializer.data)

class AgentProfileDetail(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request, pk):
        try:
            profile = AgentProfile.objects.get(pk=pk)
            serializer = AgentProfileSerializer(profile)
            return Response(serializer.data)
        except AgentProfile.DoesNotExist:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        try:
            profile = AgentProfile.objects.get(pk=pk)
        except AgentProfile.DoesNotExist:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = AgentProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            profile = AgentProfile.objects.get(pk=pk)
            profile.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except AgentProfile.DoesNotExist:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

# AdminProfile views (same structure)
class AdminProfileList(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        admins = AdminProfile.objects.all()
        serializer = AdminProfileSerializer(admins, many=True)
        return Response(serializer.data)

class AdminProfileDetail(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request, pk):
        try:
            profile = AdminProfile.objects.get(pk=pk)
            serializer = AdminProfileSerializer(profile)
            return Response(serializer.data)
        except AdminProfile.DoesNotExist:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)

    def put(self, request, pk):
        try:
            profile = AdminProfile.objects.get(pk=pk)
        except AdminProfile.DoesNotExist:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)
        serializer = AdminProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, pk):
        try:
            profile = AdminProfile.objects.get(pk=pk)
            profile.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except AdminProfile.DoesNotExist:
            return Response({'detail': 'Not found'}, status=status.HTTP_404_NOT_FOUND)