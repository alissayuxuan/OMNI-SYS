from django.shortcuts import render

# Create your views here.
from rest_framework import generics, permissions
from .models import CustomUser, AdminProfile, AgentProfile
from .serializers import (
    RegisterUserSerializer, AdminProfileSerializer, AgentProfileSerializer, CustomTokenRefreshSerializer, CustomTokenObtainPairSerializer
)
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView


# only logged in admins can enter certain views (eg. register new users)
class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'

# register new users
class RegisterUserView(generics.CreateAPIView):
    serializer_class = RegisterUserSerializer
    permission_classes = [IsAdmin]

# admin profile view
class AdminProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'admin':
            return Response({'error': 'Unauthorized'}, status=403)
        profile = AdminProfile.objects.get(user=request.user)
        return Response(AdminProfileSerializer(profile).data)

# agent dashboard view
class AgentDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'agent':
            return Response({'error': 'Unauthorized'}, status=403)
        profile = AgentProfile.objects.get(user=request.user)
        return Response(AgentProfileSerializer(profile).data)


# Custom Token Refresh View to include user role
class CustomTokenRefreshView(TokenRefreshView):
    serializer_class = CustomTokenRefreshSerializer


# Custom Token Obtain Pair View to include user role
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer