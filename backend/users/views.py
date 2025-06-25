from django.shortcuts import get_object_or_404
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenRefreshView, TokenObtainPairView

from .models import CustomUser, AdminProfile, AgentProfile
from .serializers import (
    RegisterUserSerializer, CustomTokenRefreshSerializer, CustomTokenObtainPairSerializer, 
    CustomUserSerializer, AgentProfileSerializer, AdminProfileSerializer,
    AdminProfileUpdateSerializer, AgentProfileUpdateSerializer,
    PasswordChangeSerializer
)

from api.views import handle_api_error  # or adjust path if moved

# Only logged-in admins can access certain views
class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class RegisterUserView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def post(self, request):
        try:
            serializer = RegisterUserSerializer(data=request.data)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response({'message': 'User registered successfully'})
        except Exception as e:
            return handle_api_error(e)


class CustomTokenRefreshView(TokenRefreshView):
    serializer_class = CustomTokenRefreshSerializer


class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = CustomTokenObtainPairSerializer


class UserList(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        try:
            role = request.query_params.get('role')
            users = CustomUser.objects.filter(role=role) if role else CustomUser.objects.all()
            serializer = CustomUserSerializer(users, many=True)
            return Response(serializer.data)
        except Exception as e:
            return handle_api_error(e)


class UserDetail(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request, user_id):
        try:
            user = get_object_or_404(CustomUser, id=user_id)
            serializer = CustomUserSerializer(user)
            return Response(serializer.data)
        except Exception as e:
            return handle_api_error(e)

    def put(self, request, user_id):
        try:
            user = get_object_or_404(CustomUser, id=user_id)
            serializer = CustomUserSerializer(user, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except Exception as e:
            return handle_api_error(e)

    def delete(self, request, user_id):
        try:
            user = get_object_or_404(CustomUser, id=user_id)
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return handle_api_error(e)


class AgentProfileList(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        try:
            agents = AgentProfile.objects.all()
            serializer = AgentProfileSerializer(agents, many=True)
            return Response(serializer.data)
        except Exception as e:
            return handle_api_error(e)


class AgentProfileDetail(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, pk):
        try:
            profile = AgentProfile.objects.get(pk=pk)
            serializer = AgentProfileSerializer(profile)
            return Response(serializer.data)
        except Exception as e:
            return handle_api_error(e)

    def put(self, request, pk):
        try:
            profile = AgentProfile.objects.get(pk=pk)
            serializer = AgentProfileSerializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except Exception as e:
            return handle_api_error(e)

    def delete(self, request, pk):
        try:
            profile = AgentProfile.objects.get(pk=pk)
            profile.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return handle_api_error(e)


class AdminProfileList(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request):
        try:
            admins = AdminProfile.objects.all()
            serializer = AdminProfileSerializer(admins, many=True)
            return Response(serializer.data)
        except Exception as e:
            return handle_api_error(e)


class AdminProfileDetail(APIView):
    permission_classes = [permissions.IsAuthenticated, IsAdmin]

    def get(self, request, pk):
        try:
            profile = AdminProfile.objects.get(pk=pk)
            serializer = AdminProfileSerializer(profile)
            return Response(serializer.data)
        except Exception as e:
            return handle_api_error(e)

    def put(self, request, pk):
        try:
            profile = AdminProfile.objects.get(pk=pk)
            serializer = AdminProfileSerializer(profile, data=request.data, partial=True)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response(serializer.data)
        except Exception as e:
            return handle_api_error(e)

    def delete(self, request, pk):
        try:
            profile = AdminProfile.objects.get(pk=pk)
            profile.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except Exception as e:
            return handle_api_error(e)


class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            user = request.user
            if user.role == 'admin':
                profile = AdminProfile.objects.get(user=user)
                serializer = AdminProfileSerializer(profile)
            elif user.role == 'agent':
                profile = AgentProfile.objects.get(user=user)
                serializer = AgentProfileSerializer(profile)
            else:
                return Response({'detail': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)
            return Response(serializer.data)
        except Exception as e:
            return handle_api_error(e)

    def put(self, request):
        try:
            user = request.user
            if user.role == 'admin':
                profile = AdminProfile.objects.get(user=user)
                serializer = AdminProfileUpdateSerializer(profile, data=request.data, partial=True)
            elif user.role == 'agent':
                profile = AgentProfile.objects.get(user=user)
                serializer = AgentProfileUpdateSerializer(profile, data=request.data, partial=True)
            else:
                return Response({'detail': 'Invalid role'}, status=status.HTTP_400_BAD_REQUEST)

            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response({'detail': 'Profile updated successfully'})
        except Exception as e:
            return handle_api_error(e)


class ChangePasswordView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            serializer = PasswordChangeSerializer(data=request.data, context={'request': request})
            serializer.is_valid(raise_exception=True)
            serializer.save()
            return Response({'detail': 'Password updated successfully'})
        except Exception as e:
            return handle_api_error(e)
