"""
This module defines the data models for the OMNI-SYS backend API.
"""

from django.db import models

class OMNISysObject(models.Model):
    """
    Base model for all objects in the OMNI-SYS system.
    """
    id = models.AutoField(primary_key=True)
    created_at = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=100)
    is_archived = models.BooleanField(default=False)

    class Meta:
        abstract = True # Prevents Django from creating a DB table for this model

class Agent(OMNISysObject):
    pass

class Space(OMNISysObject):
    capacity = models.PositiveIntegerField()

class Context(OMNISysObject):
    scheduled = models.DateTimeField()
    space = models.ForeignKey(Space, on_delete=models.SET_NULL, null=True)
    agents = models.ManyToManyField(Agent, related_name='contexts')

class Relationship(models.Model):
    agent_from = models.ForeignKey(
        Agent, on_delete=models.CASCADE, null=True, related_name='relationships_from'
    )
    agent_to = models.ForeignKey(
        Agent, on_delete=models.CASCADE, null=True, related_name='relationships_to'
    )
    description = models.CharField(max_length=100, null=True)
    created_at = models.DateTimeField(auto_now_add=True) 
