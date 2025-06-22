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

