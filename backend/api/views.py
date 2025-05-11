from django.shortcuts import render
from django.contrib.auth.models import User
from rest_framework import generics
from .serializers import UserSerializer
from rest_framework.permissions import IsAuthenticated, AllowAny

# Create your views here.

class CreateUserView(generics.CreateAPIView): #DRF (Django REST Framework) POST-Route: this view is called when someone calls a POST-request (eg. /register)
    queryset = User.objects.all()
    serializer_class = UserSerializer # defines how the input data(JSON) is transformed into a Django-object
    permission_classes = [AllowAny] # everyone can use this endpoint (even non-logged in users)
