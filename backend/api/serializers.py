from django.db import models
from rest_framework import serializers
from .models import Agent, Space, Context, Relationship
from django.utils import timezone
import re
from datetime import timedelta


class AgentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agent
        fields = ['id', 'name', 'created_at', 'is_archived']
        read_only_fields = ['id', 'created_at']

    def validate_name(self, value):
        """Validate agent name"""
        # Check minimum length
        if len(value.strip()) < 2:
            raise serializers.ValidationError("Name must be at least 2 characters long")

        # Check maximum length (even though model has max_length)
        if len(value) > 100:
            raise serializers.ValidationError("Name cannot exceed 100 characters")

        # Check for invalid characters (only letters, numbers, spaces, hyphens, apostrophes)
        if not re.match(r"^[a-zA-Z0-9\s\-'\.]+$", value):
            raise serializers.ValidationError(
                "Name can only contain letters, numbers, spaces, hyphens, periods, and apostrophes"
            )

        # Check for duplicate names (case-insensitive)
        if self.instance:  # Update operation
            exists = Agent.objects.exclude(pk=self.instance.pk).filter(
                name__iexact=value.strip()
            ).exists()
        else:  # Create operation
            exists = Agent.objects.filter(name__iexact=value.strip()).exists()

        if exists:
            raise serializers.ValidationError(f"An agent with the name '{value}' already exists")

        return value.strip()  # Return trimmed value


class SpaceSerializer(serializers.ModelSerializer):

    class Meta:
        model = Space
        fields = ['id', 'name', 'capacity', 'created_at', 'is_archived']
        read_only_fields = ['id', 'created_at']

    def validate_name(self, value):
        """Validate space name"""
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Space name must be at least 3 characters long")

        # Ensure unique name (case-insensitive)
        if self.instance:
            exists = Space.objects.exclude(pk=self.instance.pk).filter(
                name__iexact=value.strip()
            ).exists()
        else:
            exists = Space.objects.filter(name__iexact=value.strip()).exists()

        if exists:
            raise serializers.ValidationError(f"A space with the name '{value}' already exists")

        return value.strip()

    def validate_capacity(self, value):
        """Validate space capacity"""
        if value < 1:
            raise serializers.ValidationError("Capacity must be at least 1")

        if value > 1000:
            raise serializers.ValidationError("Capacity cannot exceed 1000")

        # If updating, check if reducing capacity would affect existing contexts
        if self.instance and value < self.instance.capacity:
            # Check if any contexts have more agents than new capacity
            over_capacity_contexts = self.instance.context_set.annotate(
                agent_count=models.Count('agents')
            ).filter(agent_count__gt=value)

            if over_capacity_contexts.exists():
                # Get the names of the over-capacity contexts
                context_names = list(over_capacity_contexts.values_list('name', flat=True))

                # Create a readable list of context names
                if len(context_names) <= 3:
                    names_str = ", ".join(context_names)
                else:
                    # Show first 3 and indicate there are more
                    names_str = f"{', '.join(context_names[:3])}, and {len(context_names) - 3} more"

                raise serializers.ValidationError(
                    f"Cannot reduce capacity to {value}. "
                    f"{over_capacity_contexts.count()} contexts have more agents than this capacity: {names_str}"
                )

        return value


class ContextSerializer(serializers.ModelSerializer):
    # Nested serializers for read operations
    space_detail = SpaceSerializer(source='space', read_only=True)
    agents_detail = AgentSerializer(source='agents', many=True, read_only=True)

    # IDs for write operations
    space_id = serializers.PrimaryKeyRelatedField(
        source='space',
        queryset=Space.objects.all(),
        write_only=True
    )
    agent_ids = serializers.PrimaryKeyRelatedField(
        source='agents',
        queryset=Agent.objects.all(),
        many=True,
        write_only=True
    )

    class Meta:
        model = Context
        fields = ['id', 'name', 'scheduled', 'space', 'agents',
                  'space_detail', 'agents_detail', 'space_id', 'agent_ids',
                  'created_at', 'is_archived']
        read_only_fields = ['id', 'created_at']

    def validate_name(self, value):
        """Validate context name"""
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Context name must be at least 5 characters long")
        return value

    def validate_scheduled(self, value):
        """Validate scheduled time"""
        # Cannot schedule in the past (more than 1 day)
        min_time = timezone.now() - timedelta(days=1)
        if value < min_time:
            raise serializers.ValidationError("Cannot schedule contexts in the past")

        # Cannot schedule too far in the future (e.g., 2 year)
        max_time = timezone.now() + timedelta(days=730)
        if value > max_time:
            raise serializers.ValidationError("Cannot schedule contexts more than 2 years in advance")
        return value

    def validate_agent_ids(self, value):
        """Validate agent list"""
        if not value:
            raise serializers.ValidationError("At least one agent must be assigned to the context")

        # Check for duplicate agents
        if len(value) != len(set(value)):
            raise serializers.ValidationError("Duplicate agents are not allowed")
        return value

    def validate(self, data):
        """Object-level validation"""
        space = data.get('space') or (self.instance.space if self.instance else None)
        agents = data.get('agents') or (list(self.instance.agents.all()) if self.instance else [])
        scheduled = data.get('scheduled') or (self.instance.scheduled if self.instance else None)

        # Validate capacity
        if space and agents:
            if len(agents) > space.capacity:
                raise serializers.ValidationError({
                    'agent_ids': f"Number of agents ({len(agents)}) exceeds space capacity ({space.capacity})"
                })

        # Check for scheduling conflicts
        if space and scheduled:
            start_time = scheduled

            # Find overlapping contexts in the same space
            overlapping = Context.objects.filter(
                space=space,
                scheduled=start_time
            )

            if self.instance:
                overlapping = overlapping.exclude(pk=self.instance.pk)

            if overlapping.exists():
                conflicts = [f"{c.name} at {c.scheduled}" for c in overlapping[:3]]
                raise serializers.ValidationError({
                    'scheduled': f"Scheduling conflict with: {', '.join(conflicts)}"
                })

        # Check agent availability
        if agents and scheduled:
            for agent in agents:
                # Check if agent is already scheduled at this time
                agent_conflicts = Context.objects.filter(
                    agents=agent,
                    scheduled__lt=scheduled + timedelta(hours=1),
                    scheduled__gt=scheduled - timedelta(hours=1)
                )

                if self.instance:
                    agent_conflicts = agent_conflicts.exclude(pk=self.instance.pk)

                if agent_conflicts.exists():
                    raise serializers.ValidationError({
                        'agent_ids': f"Agent '{agent.name}' is already scheduled at this time"
                    })
        return data

class RelationshipSerializer(serializers.ModelSerializer):
    class Meta:
        model = Relationship
        fields = ['id', 'agent_from', 'agent_to', 'description', 'created_at'] # removed 'name' 
        read_only_fields = ['id', 'created_at']


# Additional validation utilities that can be reused

def validate_future_datetime(value, field_name="Date"):
    """Reusable validator for future datetimes"""
    if value <= timezone.now():
        raise serializers.ValidationError(
            f"{field_name} must be in the future"
        )
    return value


def validate_business_hours(value, field_name="Time"):
    """Reusable validator for business hours"""
    if value.hour < 8 or value.hour >= 18:
        raise serializers.ValidationError(
            f"{field_name} must be during business hours (8 AM - 6 PM)"
        )
    return value


def validate_no_special_characters(value, field_name="Field"):
    """Reusable validator for names without special characters"""
    if not re.match(r'^[a-zA-Z0-9\s]+$', value):
        raise serializers.ValidationError(
            f"{field_name} can only contain letters, numbers, and spaces"
        )
    return value