from django.db import models

# Create your models here.

class OMNISysObject(models.Model):
    id = models.AutoField(primary_key=True)
    created_at = models.DateTimeField(auto_now_add=True)
    name = models.CharField(max_length=100)

    class Meta:
        abstract = True

class Agent(OMNISysObject):
    access_level = models.IntegerField(default=0)

class Space(OMNISysObject):
    capacity = models.PositiveIntegerField()

class Context(OMNISysObject):
    scheduled = models.DateTimeField()
    space = models.ForeignKey(Space, on_delete=models.SET_NULL, null=True)
    agents = models.ManyToManyField(Agent, related_name='contexts')

class Relationship(models.Model):
    doctor = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='patients')
    patient = models.ForeignKey(Agent, on_delete=models.CASCADE, related_name='doctors')