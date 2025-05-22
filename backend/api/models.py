from django.db import models

# Create your models here.

class Agent(models.Model):
    id = models.AutoField(primary_key=True)

class Relationship(models.Model):
    doctor = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='patients')
    patient = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='doctors')

class Space(models.Model):
    id = models.AutoField(primary_key=True)

class Context(models.Model):
    id = models.AutoField(primary_key=True)
    created = models.DateTimeField(auto_now_add=True)
    scheduled = models.DateTimeField()
    space = models.ForeignKey(Space, on_delete=models.SET_NULL)
    agents = models.ManyToManyField(Agent, related_name='contexts')