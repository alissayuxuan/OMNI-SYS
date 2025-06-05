from django.db import models

# Create your models here.

# models.py

from django.contrib.auth.models import AbstractUser
from django.db import models

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
    access_level = models.IntegerField(default=1)


class AgentProfile(models.Model):
    user = models.OneToOneField(CustomUser, on_delete=models.CASCADE, limit_choices_to={'role': 'agent'})
    agent_type = models.CharField(max_length=50)
    agent_object = models.OneToOneField(Agent, on_delete=models.CASCADE)