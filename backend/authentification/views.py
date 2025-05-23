from django.shortcuts import render

# Create your views here.
from rest_framework import generics
from .models import User
from .serializers import UserSerializer

from rest_framework.permissions import AllowAny

from rest_framework_simplejwt.views import TokenObtainPairView
from .serializers import MyTokenObtainPairSerializer

# Create your views here.

class CreateUserView(generics.CreateAPIView): #DRF (Django REST Framework) POST-Route: this view is called when someone calls a POST-request (eg. /register)
    queryset = User.objects.all()
    serializer_class = UserSerializer # defines how the input data(JSON) is transformed into a Django-object
    permission_classes = [AllowAny] # everyone can use this endpoint (even non-logged in users)


# include JWT for custom user model
class MyTokenObtainPairView(TokenObtainPairView):
    serializer_class = MyTokenObtainPairSerializer