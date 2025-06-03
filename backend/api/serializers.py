from rest_framework import serializers
from .models import Agent, Space, Context, Relationship


class AgentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agent
        fields = ['id', 'name', 'access_level', 'created_at']
        read_only_fields = ['id', 'created_at']


class SpaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Space
        fields = ['id', 'name', 'capacity', 'created_at']
        read_only_fields = ['id', 'created_at']


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
                  'space_detail', 'agents_detail', 'space_id', 'agent_ids', 'created_at']
        read_only_fields = ['id', 'created_at']


class RelationshipSerializer(serializers.ModelSerializer):
    doctor_detail = AgentSerializer(source='doctor', read_only=True)
    patient_detail = AgentSerializer(source='patient', read_only=True)

    class Meta:
        model = Relationship
        fields = ['id', 'doctor', 'patient', 'doctor_detail', 'patient_detail']