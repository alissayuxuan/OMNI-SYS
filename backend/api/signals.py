"""
This module listens for model changes and logs field-level updates.
"""

import logging
from django.db.models.signals import pre_save
from django.dispatch import receiver
from .models import Agent, Space, Context, Relationship

db_logger = logging.getLogger('db_logger')

def format_related_agent(value):
    # If value is an Agent instance, format name and id
    if isinstance(value, Agent):
        return f"{value.name} (ID {value.id})"
    # If value is a primary key (int), try to fetch Agent
    if isinstance(value, int):
        try:
            agent = Agent.objects.get(id=value)
            return f"{agent.name} (ID {agent.id})"
        except Agent.DoesNotExist:
            return f"Agent ID {value} (not found)"
    return str(value)

def get_changes(old, new, fields):
    """ 
    Utility function to get changes between old and new instances for specified fields
    """
    changes = []
    for field in fields:
        old_val = getattr(old, field, None) 
        new_val = getattr(new, field, None) 

        # Special handling for Relationship foreign keys
        if field in ['agent_from', 'agent_to']:
            old_val_str = format_related_agent(old_val)
            new_val_str = format_related_agent(new_val)
        else:
            old_val_str = str(old_val)
            new_val_str = str(new_val)

        if old_val != new_val:
            changes.append(f"{field}: '{old_val_str}' → '{new_val_str}'")
    return changes

@receiver(pre_save, sender=Agent)
def log_agent_changes(sender, instance, **kwargs):
    """
    Signal handler to log changes to Agent before save.
    Skips logging if it's a new record (no pk yet).
    """
    if not instance.pk:
        return
    old = Agent.objects.get(pk=instance.pk)
    changes = get_changes(old, instance, ['name', 'is_archived'])
    if changes:
        db_logger.info(f"Agent ID {instance.pk} was updated | Changes: " + "; ".join(changes))

@receiver(pre_save, sender=Space)
def log_space_changes(sender, instance, **kwargs):
    """ 
    Signal handler to log changes to Space before save.
    """
    if not instance.pk:
        return
    old = Space.objects.get(pk=instance.pk)
    changes = get_changes(old, instance, ['name', 'capacity', 'is_archived'])
    if changes:
        db_logger.info(f"Space ID {instance.pk} was updated | Changes: " + "; ".join(changes))

@receiver(pre_save, sender=Context)
def log_context_changes(sender, instance, **kwargs):
    """
    Signal handler to log changes to Context before save.
    """
    if not instance.pk:
        return
    old = Context.objects.get(pk=instance.pk)
    changes = get_changes(old, instance, ['name', 'scheduled', 'space', 'is_archived'])
    if changes:
        db_logger.info(f"Context ID {instance.pk} was updated | Changes: " + "; ".join(changes))

@receiver(pre_save, sender=Relationship)
def log_relationship_changes(sender, instance, **kwargs):
    """
    Signal handler to log changes to Relationship before save.
    """
    if not instance.pk:
        return
    old = Relationship.objects.get(pk=instance.pk)
    changes = get_changes(old, instance, ['agent_from', 'agent_to', 'description'])
    if changes:
        db_logger.info(f"Relationship ID {instance.pk} was updated | Changes: " + "; ".join(changes))
