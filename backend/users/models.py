"""
models.py – User and Profile Models

Custom user-related models for the authentication system are defined here.
The model introduces a CustomUser model that extends Django's AbstractUser and 
adds a 'role' field to distinguish between two types of users: 'admin' and 'agent'.

It also defines:
- AdminProfile: A profile model linked to users with the 'admin' role.
- AgentProfile: A profile model linked to users with the 'agent' role and associated 
  with an 'Agent' object from the main application.
"""

from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone


from api.models import Agent


class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('admin', 'Admin'),
        ('agent', 'Agent'),
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)

    def is_admin(self):
        return self.role == 'admin'

    def is_agent(self):
        return self.role == 'agent'


class AdminProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, limit_choices_to={'role': 'admin'}) #Der limit_choices_to-Parameter sorgt dafür, dass z.B. ein Admin-Profil nur einem User mit Rolle admin zugewiesen werden kann.
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)


class AgentProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, limit_choices_to={'role': 'agent'}, related_name='agent_profile')

    agent_object = models.OneToOneField(Agent, on_delete=models.CASCADE, null=False)