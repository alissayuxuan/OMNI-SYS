# users/signals.py

from django.db.models.signals import post_delete
from django.dispatch import receiver
from .models import AdminProfile, AgentProfile

@receiver(post_delete, sender=AdminProfile)
def delete_user_when_admin_profile_deleted(sender, instance, **kwargs):
    if instance.user:
        instance.user.delete()

@receiver(post_delete, sender=AgentProfile)
def delete_user_when_agent_profile_deleted(sender, instance, **kwargs):
    if instance.user:
        instance.user.delete()
