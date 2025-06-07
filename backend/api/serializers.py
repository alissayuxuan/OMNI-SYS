from django.db import models
from rest_framework import serializers
from .models import Agent, Space, Context, Relationship
from django.utils import timezone
from django.db.models import Q
import re
from datetime import timedelta


class AgentSerializer(serializers.ModelSerializer):
    # Add computed fields
    context_count = serializers.SerializerMethodField()
    is_doctor = serializers.SerializerMethodField()
    is_patient = serializers.SerializerMethodField()

    class Meta:
        model = Agent
        fields = ['id', 'name', 'access_level', 'created_at',
                  'context_count', 'is_doctor', 'is_patient']
        read_only_fields = ['id', 'created_at']

    def get_context_count(self, obj):
        """Get number of contexts this agent is assigned to"""
        return obj.contexts.count()

    def get_is_doctor(self, obj):
        """Check if agent has any doctor relationships"""
        return obj.patients.exists()

    def get_is_patient(self, obj):
        """Check if agent has any patient relationships"""
        return obj.doctors.exists()

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

    def validate_access_level(self, value):
        """Validate access level is within acceptable range"""
        if value < 0:
            raise serializers.ValidationError("Access level cannot be negative")

        if value > 10:
            raise serializers.ValidationError("Access level cannot exceed 10")

        # Custom business rule: Only admins can create agents with access level > 7
        request = self.context.get('request')
        if request and value > 7:
            if not hasattr(request.user, 'role') or request.user.role != 'admin':
                raise serializers.ValidationError(
                    "Only administrators can create agents with access level greater than 7"
                )

        return value

    def validate(self, data):
        """Object-level validation"""
        # Custom business rule: Doctors should have higher access levels
        # This is just an example - adjust based on your business logic
        if self.instance:  # Update operation
            # Check if this agent is a doctor
            if self.instance.patients.exists() and data.get('access_level', self.instance.access_level) < 5:
                raise serializers.ValidationError(
                    "Doctors must have an access level of at least 5"
                )

        return data


class SpaceSerializer(serializers.ModelSerializer):
    # Add computed fields
    current_contexts = serializers.SerializerMethodField()
    utilization_rate = serializers.SerializerMethodField()
    is_available = serializers.SerializerMethodField()

    class Meta:
        model = Space
        fields = ['id', 'name', 'capacity', 'created_at',
                  'current_contexts', 'utilization_rate', 'is_available']
        read_only_fields = ['id', 'created_at']

    def get_current_contexts(self, obj):
        """Get number of active contexts in this space"""
        return obj.context_set.filter(scheduled__gte=timezone.now()).count()

    def get_utilization_rate(self, obj):
        """Calculate average utilization rate"""
        contexts = obj.context_set.all()
        if not contexts:
            return 0.0

        total_agents = sum(context.agents.count() for context in contexts)
        total_possible = contexts.count() * obj.capacity

        if total_possible == 0:
            return 0.0

        return round((total_agents / total_possible) * 100, 2)

    def get_is_available(self, obj):
        """Check if space has any availability now"""
        # Check if there's a context scheduled for now that's at capacity
        now = timezone.now()
        current_contexts = obj.context_set.filter(
            scheduled__lte=now,
            scheduled__gte=now - timedelta(hours=2)  # Assume 2-hour slots
        )

        for context in current_contexts:
            if context.agents.count() >= obj.capacity:
                return False

        return True

    def validate_name(self, value):
        """Validate space name"""
        if len(value.strip()) < 3:
            raise serializers.ValidationError("Space name must be at least 3 characters long")

        # Check for reserved names
        reserved_names = ['admin', 'test', 'null', 'undefined']
        if value.lower() in reserved_names:
            raise serializers.ValidationError(f"'{value}' is a reserved name and cannot be used")

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
                raise serializers.ValidationError(
                    f"Cannot reduce capacity to {value}. "
                    f"{over_capacity_contexts.count()} contexts have more agents than this capacity."
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

    # Computed fields
    duration_hours = serializers.FloatField(required=False, write_only=True, default=2.0)
    is_upcoming = serializers.SerializerMethodField()
    is_full = serializers.SerializerMethodField()
    available_slots = serializers.SerializerMethodField()

    class Meta:
        model = Context
        fields = ['id', 'name', 'scheduled', 'space', 'agents',
                  'space_detail', 'agents_detail', 'space_id', 'agent_ids',
                  'created_at', 'duration_hours', 'is_upcoming', 'is_full', 'available_slots']
        read_only_fields = ['id', 'created_at']

    def get_is_upcoming(self, obj):
        """Check if context is in the future"""
        return obj.scheduled > timezone.now()

    def get_is_full(self, obj):
        """Check if context has reached capacity"""
        if not obj.space:
            return False
        return obj.agents.count() >= obj.space.capacity

    def get_available_slots(self, obj):
        """Get number of available slots"""
        if not obj.space:
            return 0
        return max(0, obj.space.capacity - obj.agents.count())

    def validate_name(self, value):
        """Validate context name"""
        if len(value.strip()) < 5:
            raise serializers.ValidationError("Context name must be at least 5 characters long")

        # Context names should be descriptive
        if len(value.split()) < 2:
            raise serializers.ValidationError(
                "Context name should be descriptive (at least 2 words)"
            )

        return value.strip()

    def validate_scheduled(self, value):
        """Validate scheduled time"""
        # Cannot schedule in the past (with 5-minute grace period)
        min_time = timezone.now() - timedelta(minutes=5)
        if value < min_time:
            raise serializers.ValidationError("Cannot schedule contexts in the past")

        # Cannot schedule too far in the future (e.g., 1 year)
        max_time = timezone.now() + timedelta(days=365)
        if value > max_time:
            raise serializers.ValidationError("Cannot schedule contexts more than 1 year in advance")

        # Check for reasonable hours (e.g., between 6 AM and 10 PM)
        if value.hour < 6 or value.hour > 22:
            raise serializers.ValidationError(
                "Contexts should be scheduled between 6:00 AM and 10:00 PM"
            )

        # Check for weekends if needed
        if value.weekday() in [5, 6]:  # Saturday = 5, Sunday = 6
            # Example: warn about weekend scheduling
            # You could make this an error instead
            pass

        return value

    def validate_agent_ids(self, value):
        """Validate agent list"""
        if not value:
            raise serializers.ValidationError("At least one agent must be assigned to the context")

        # Check for duplicate agents
        if len(value) != len(set(value)):
            raise serializers.ValidationError("Duplicate agents are not allowed")

        # Check agent availability (example business rule)
        # This is a simple example - you might want more complex availability checking
        for agent in value:
            # Check if agent has required access level
            if agent.access_level < 1:
                raise serializers.ValidationError(
                    f"Agent '{agent.name}' has insufficient access level"
                )

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
            duration_hours = data.get('duration_hours', 2.0)
            start_time = scheduled
            end_time = scheduled + timedelta(hours=duration_hours)

            # Find overlapping contexts in the same space
            overlapping = Context.objects.filter(
                space=space,
                scheduled__lt=end_time,
                scheduled__gte=start_time - timedelta(hours=2)  # Assume default 2-hour duration
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
                    scheduled__lt=scheduled + timedelta(hours=2),
                    scheduled__gt=scheduled - timedelta(hours=2)
                )

                if self.instance:
                    agent_conflicts = agent_conflicts.exclude(pk=self.instance.pk)

                if agent_conflicts.exists():
                    raise serializers.ValidationError({
                        'agent_ids': f"Agent '{agent.name}' is already scheduled at this time"
                    })

        return data


class RelationshipSerializer(serializers.ModelSerializer):
    doctor_detail = AgentSerializer(source='doctor', read_only=True)
    patient_detail = AgentSerializer(source='patient', read_only=True)

    # Add validation fields
    relationship_duration = serializers.SerializerMethodField()

    class Meta:
        model = Relationship
        fields = ['id', 'doctor', 'patient', 'doctor_detail', 'patient_detail', 'relationship_duration']

    def get_relationship_duration(self, obj):
        """Calculate how long this relationship has existed"""
        # Assuming you might add created_at to Relationship model
        return "N/A"  # Placeholder

    def validate_doctor(self, value):
        """Validate doctor"""
        # Ensure the agent has sufficient access level to be a doctor
        if value.access_level < 5:
            raise serializers.ValidationError(
                f"Agent '{value.name}' cannot be a doctor (access level too low)"
            )

        return value

    def validate_patient(self, value):
        """Validate patient"""
        # Example: patients shouldn't have high access levels
        if value.access_level > 7:
            raise serializers.ValidationError(
                f"Agent '{value.name}' has too high access level to be a patient"
            )

        return value

    def validate(self, data):
        """Object-level validation"""
        doctor = data.get('doctor') or (self.instance.doctor if self.instance else None)
        patient = data.get('patient') or (self.instance.patient if self.instance else None)

        # Prevent self-relationships
        if doctor and patient and doctor.id == patient.id:
            raise serializers.ValidationError(
                "An agent cannot be both doctor and patient in the same relationship"
            )

        # Check if relationship already exists
        if doctor and patient:
            existing = Relationship.objects.filter(
                doctor=doctor,
                patient=patient
            )

            if self.instance:
                existing = existing.exclude(pk=self.instance.pk)

            if existing.exists():
                raise serializers.ValidationError(
                    f"Relationship between doctor '{doctor.name}' and patient '{patient.name}' already exists"
                )

        # Limit number of patients per doctor
        if doctor:
            patient_count = doctor.patients.count()
            if self.instance and self.instance.doctor == doctor:
                patient_count -= 1  # Don't count the current relationship

            max_patients = 50  # Example limit
            if patient_count >= max_patients:
                raise serializers.ValidationError({
                    'doctor': f"Doctor '{doctor.name}' already has {max_patients} patients (maximum allowed)"
                })

        # Check for circular relationships (A is doctor of B, B is doctor of A)
        if doctor and patient:
            reverse_exists = Relationship.objects.filter(
                doctor=patient,
                patient=doctor
            ).exists()

            if reverse_exists:
                raise serializers.ValidationError(
                    f"Circular relationship detected: '{patient.name}' is already a doctor of '{doctor.name}'"
                )

        return data

    def create(self, validated_data):
        """Custom create to add logging or additional logic"""
        instance = super().create(validated_data)

        # Example: You could send notifications here
        # notify_patient_assignment(instance.doctor, instance.patient)

        return instance


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