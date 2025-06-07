"""from django.db.models.signals import post_delete
from django.dispatch import receiver
from api.models import Agent
from users.models import AgentProfile  # Passe den Importpfad ggf. an

@receiver(post_delete, sender=Agent)
def delete_agent_profile(sender, instance, **kwargs):
    try:
        profile = AgentProfile.objects.get(agent_object=instance)
        profile.delete()
    except AgentProfile.DoesNotExist:
        pass"""

"""
from django.db.models.signals import post_delete
from django.dispatch import receiver
from api.models import Agent
from users.models import AgentProfile  # oder dein konkreter Pfad
from users.models import CustomUser


@receiver(post_delete, sender=Agent)
def delete_custom_user_from_agent(sender, instance, **kwargs):
    try:
        profile = AgentProfile.objects.get(agent_object=instance)
        user = profile.user
        user.delete()  # löscht auch AgentProfile automatisch
    except AgentProfile.DoesNotExist:
        pass
"""

from django.db.models.signals import pre_delete
from django.dispatch import receiver
from api.models import Agent
from users.models import AgentProfile


@receiver(pre_delete, sender=Agent)
def delete_custom_user_from_agent(sender, instance, **kwargs):
    try:
        profile = AgentProfile.objects.get(agent_object=instance)
        user = profile.user
        user.delete()
    except AgentProfile.DoesNotExist:
        pass

