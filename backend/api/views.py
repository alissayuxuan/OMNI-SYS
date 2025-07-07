from rest_framework import viewsets, status
from rest_framework.decorators import action, permission_classes, api_view
from rest_framework.filters import SearchFilter, OrderingFilter
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from .models import Agent, Space, Context, Relationship
from .serializers import AgentSerializer, SpaceSerializer, ContextSerializer, RelationshipSerializer
from django_filters.rest_framework import DjangoFilterBackend
from django.core.cache import cache
import json
from .filters import AgentFilter, SpaceFilter, ContextFilter
from .pagination import StandardResultsSetPagination
from django.db import IntegrityError
import logging
from mqtt_backend.comm_node_manager import CommNodeManager
from users.models import CustomUser, AgentProfile
from django.shortcuts import get_object_or_404
import redis

logger = logging.getLogger('omnisyslogger')

# Mixin to add archive/unarchive actions to ModelViewSets
class ArchiveMixin:
        """ Mixin to add archive/unarchive actions to a ModelViewSet.
        Assumes the model has an 'is_archived' BooleanField."""

        @action(detail=True, methods=['post'])
        def archive(self, request, pk=None):
            obj = self.get_object()
            if obj.is_archived:
                return Response({'status': f'{obj.__class__.__name__.lower()} already archived'})
            obj.is_archived = True
            obj.save()
            return Response({'status': f'{obj.__class__.__name__.lower()} archived'})

        @action(detail=True, methods=['post'])
        def unarchive(self, request, pk=None):
            obj = self.get_object()
            if not obj.is_archived:
                return Response({'status': f'{obj.__class__.__name__.lower()} already unarchived'})
            obj.is_archived = False
            obj.save()
            return Response({'status': f'{obj.__class__.__name__.lower()} unarchived'})

def handle_api_error(exception, default_message="An error occurred"):
    """Simple helper to format error responses"""
    error_message = str(exception) if str(exception) else default_message

    # Customize based on exception type if needed
    if isinstance(exception, IntegrityError):
        error_message = "This operation conflicts with existing data"
    elif isinstance(exception, ValueError):
        error_message = f"Invalid value: {str(exception)}"
    elif hasattr(exception, 'detail'):
        # DRF validation errors
        error_message = str(exception.detail)

    return Response({
        'error': error_message
    }, status=status.HTTP_400_BAD_REQUEST)


class AgentViewSet(ArchiveMixin, viewsets.ModelViewSet):
    """
    ViewSet for Agent CRUD operations
    """
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_class = AgentFilter
    ordering_fields = ['name', 'created_at']
    ordering = ['-created_at']  # Default ordering
    search_fields = ['name']  # Fields for ?search= parameter
    pagination_class = StandardResultsSetPagination

    def _filter_queryset(self, queryset):
        """Apply common filtering for Agent queryset."""
        access_level = self.request.query_params.get('access_level', None)
        if access_level is not None:
            queryset = queryset.filter(access_level=access_level)
        return queryset.order_by('-created_at')

    def get_queryset(self):
        queryset = Agent.objects.all()
        archived = self.request.query_params.get('archived', 'true').lower()
        if archived != 'true':
            queryset = queryset.filter(is_archived=False)
        
        return self._filter_queryset(queryset)

    def create(self, request, *args, **kwargs):
        try: 
            logger.info(f"Creating new agent with data: {request.data}")
            response = super().create(request, *args, **kwargs)
            logger.info(f"Successfully created agent with ID: {response.data.get('id')}") 

            agent_id = response.data.get('id')
            username = request.data.get('username')
            password = request.data.get('password')

            if agent_id and username and password:
                node = CommNodeManager.create_node(agent_id, username, password)
                if node:
                    client_id = node.client._client_id
                    response.data['client_created'] = True
                    logger.info(f"Communication node created with client ID: {client_id}")
                else:
                    logger.warning(f"Failed to create communication node for agent ID: {agent_id}")
            return response

        except Exception as e:
            logger.error(f"Error creating agent: {str(e)}")
            return handle_api_error(e, "Failed to create agent")

    def update(self, request, *args, **kwargs):
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            logger.info(
                f"User {request.user.username} updating agent ID: {instance.id} with data: {request.data} (partial={partial})")
            response = super().update(request, *args, **kwargs)
            logger.info(f"Successfully updated agent ID: {instance.id}")
            return response

        except Exception as e:
            logger.error(f"Error updating agent: {str(e)}")
            return handle_api_error(e, "Failed to update agent")

    def list(self, request, *args, **kwargs):
        try:
            logger.debug(f"User {request.user.username} listing agents with params: {request.query_params}")
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error listing agents: {str(e)}")
            return handle_api_error(e, "Failed to retrieve agents")

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            logger.debug(f"User {request.user.username} retrieving agent ID: {instance.id}")
            return super().retrieve(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error retrieving agent: {str(e)}")
            return handle_api_error(e, "Failed to retrieve agent")

    def destroy(self, request, *args, **kwargs):
        try:
            obj = self.get_object()
            logger.info(f"Deleting agent with ID: {obj.id}")
            agent_id = obj.id

            try:
                CommNodeManager.shutdown_node(agent_id)
            except Exception as comm_error:
                logger.error(f"Failed to shutdown comm node: {str(comm_error)}")
                # Continue with deletion anyway

            return super().destroy(request, *args, **kwargs)

        except Exception as e:
            logger.error(f"Error deleting agent: {str(e)}")
            return handle_api_error(e, "Failed to delete agent")

class SpaceViewSet(ArchiveMixin, viewsets.ModelViewSet):
    """
    ViewSet for Space CRUD operations
    """
    queryset = Space.objects.all()
    serializer_class = SpaceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = SpaceFilter
    ordering_fields = ['name', 'capacity', 'created_at']
    ordering = ['-created_at']
    pagination_class = StandardResultsSetPagination

    def _filter_queryset(self, queryset):
        """Apply common filtering for Space queryset."""
        min_capacity = self.request.query_params.get('min_capacity', None)
        if min_capacity is not None:
            queryset = queryset.filter(capacity__gte=min_capacity)
        return queryset.order_by('-created_at')

    def get_queryset(self):
        """Return spaces, optionally including archived ones, and optionally filtered."""
        queryset = Space.objects.all()
        archived = self.request.query_params.get("archived", "true").lower()
        if archived != "true":
            queryset = queryset.filter(is_archived=False)

        return self._filter_queryset(queryset)

    def create(self, request, *args, **kwargs):
        try:
            logger.info(f"User {request.user.username} creating new space with data: {request.data}")
            response = super().create(request, *args, **kwargs)
            logger.info(
                f"Successfully created space with ID: {response.data.get('id')}, capacity: {response.data.get('capacity')}")
            return response

        except Exception as e:
            logger.error(f"Error creating space: {str(e)}")
            return handle_api_error(e, "Failed to create space")

    def update(self, request, *args, **kwargs):
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            old_capacity = instance.capacity
            logger.info(
                f"User {request.user.username} updating space ID: {instance.id} with data: {request.data} (partial={partial})")
            response = super().update(request, *args, **kwargs)

            # Log capacity changes specifically
            new_capacity = response.data.get('capacity')
            if old_capacity != new_capacity:
                logger.warning(f"Space ID: {instance.id} capacity changed from {old_capacity} to {new_capacity}")

            logger.info(f"Successfully updated space ID: {instance.id}")
            return response

        except Exception as e:
            logger.error(f"Error updating space: {str(e)}")
            return handle_api_error(e, "Failed to update space")

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error listing spaces: {str(e)}")
            return handle_api_error(e, "Failed to retrieve spaces")

    def retrieve(self, request, *args, **kwargs):
        try:
            return super().retrieve(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error retrieving space: {str(e)}")
            return handle_api_error(e, "Failed to retrieve space")

    def destroy(self, request, *args, **kwargs):
        try:
            obj = self.get_object()
            # Check if space has contexts
            context_count = obj.context_set.count()
            if context_count > 0:
                logger.error(
                    f"User {request.user.username} attempted to delete space ID: {obj.id} with {context_count} contexts")

            logger.warning(
                f"User {request.user.username} deleting space ID: {obj.id}, name: {obj.name}, capacity: {obj.capacity}")
            response = super().destroy(request, *args, **kwargs)
            logger.warning(f"Successfully deleted space ID: {obj.id}")
            return response

        except Exception as e:
            logger.error(f"Error deleting space: {str(e)}")
            return handle_api_error(e, "Failed to delete space")

    @action(detail=True, methods=['get'])
    def contexts(self, request, pk=None):
        """Get all contexts for a specific space"""
        try:
            space = self.get_object()
            contexts = Context.objects.filter(space=space)
            serializer = ContextSerializer(contexts, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"Error retrieving contexts for space: {str(e)}")
            return handle_api_error(e, "Failed to retrieve contexts for space")


class ContextViewSet(ArchiveMixin, viewsets.ModelViewSet):
    """
    ViewSet for Context CRUD operations
    """
    queryset = Context.objects.all()
    serializer_class = ContextSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter]
    filterset_class = ContextFilter
    ordering_fields = ['scheduled', 'created_at']
    ordering = ['scheduled']  # Upcoming first
    pagination_class = StandardResultsSetPagination

    def _filter_queryset(self, queryset):
        """Apply common filtering for Context queryset."""
        # Filter by space
        space_id = self.request.query_params.get('space', None)
        if space_id is not None:
            queryset = queryset.filter(space_id=space_id)

        # Filter by agent
        agent_id = self.request.query_params.get('agent', None)
        if agent_id is not None:
            queryset = queryset.filter(agents__id=agent_id)

        # Filter by date range
        from_date = self.request.query_params.get('from_date', None)
        to_date = self.request.query_params.get('to_date', None)
        if from_date:
            queryset = queryset.filter(scheduled__gte=from_date)
        if to_date:
            queryset = queryset.filter(scheduled__lte=to_date)

        return queryset.order_by('scheduled')

    def get_queryset(self):
        """Return non-archived contexts by default, optionally include archived ones."""
        queryset = Context.objects.all()

        archived = self.request.query_params.get("archived", "true").lower()
        if archived != "true":
            queryset = queryset.filter(is_archived=False)

        return self._filter_queryset(queryset)

    def create(self, request, *args, **kwargs):
        try:
            logger.info(f"User {request.user.username} creating new context with data: {request.data}")

            # Log space and agent assignments
            space_id = request.data.get('space_id')
            agent_ids = request.data.get('agent_ids', [])
            logger.info(f"Context will be assigned to space ID: {space_id} with {len(agent_ids)} agents: {agent_ids}")

            response = super().create(request, *args, **kwargs)
            logger.info(
                f"Successfully created context ID: {response.data.get('id')} scheduled for {response.data.get('scheduled')}")
            return response

        except Exception as e:
            logger.error(f"Error creating context: {str(e)}")
            return handle_api_error(e, "Failed to create context")

    def update(self, request, *args, **kwargs):
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            old_scheduled = instance.scheduled
            old_space_id = instance.space_id if instance.space else None
            old_agent_ids = list(instance.agents.values_list('id', flat=True))

            logger.info(
                f"User {request.user.username} updating context ID: {instance.id} with data: {request.data} (partial={partial})")
            response = super().update(request, *args, **kwargs)

            # Log significant changes
            new_scheduled = response.data.get('scheduled')
            new_space_id = response.data.get('space')
            new_agent_ids = response.data.get('agents', [])

            if str(old_scheduled) != str(new_scheduled):
                logger.warning(f"Context ID: {instance.id} rescheduled from {old_scheduled} to {new_scheduled}")
            if old_space_id != new_space_id:
                logger.warning(f"Context ID: {instance.id} moved from space {old_space_id} to {new_space_id}")
            if set(old_agent_ids) != set(new_agent_ids):
                logger.info(f"Context ID: {instance.id} agents changed from {old_agent_ids} to {new_agent_ids}")

            logger.info(f"Successfully updated context ID: {instance.id}")
            return response

        except Exception as e:
            logger.error(f"Error updating context: {str(e)}")
            return handle_api_error(e, "Failed to update context")

    def list(self, request, *args, **kwargs):
        try:
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error listing contexts: {str(e)}")
            return handle_api_error(e, "Failed to retrieve contexts")

    def retrieve(self, request, *args, **kwargs):
        try:
            return super().retrieve(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error retrieving context: {str(e)}")
            return handle_api_error(e, "Failed to retrieve context")

    def destroy(self, request, *args, **kwargs):
        try:
            obj = self.get_object()
            logger.warning(
                f"User {request.user.username} deleting context ID: {obj.id}, name: {obj.name}, scheduled: {obj.scheduled}")
            logger.info(f"Context had {obj.agents.count()} agents assigned")
            response = super().destroy(request, *args, **kwargs)
            logger.warning(f"Successfully deleted context ID: {obj.id}")
            return response

        except Exception as e:
            logger.error(f"Error deleting context: {str(e)}")
            return handle_api_error(e, "Failed to delete context")

    @action(detail=True, methods=['post'])
    def add_agent(self, request, pk=None):
        """Add an agent to a context"""
        try:
            context = self.get_object()
            agent_id = request.data.get('agent_id')

            logger.info(f"User {request.user.username} adding agent ID: {agent_id} to context ID: {context.id}")

            if not agent_id:
                return Response({
                    'error': 'agent_id is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                agent = Agent.objects.get(pk=agent_id)
            except Agent.DoesNotExist:
                return Response({
                    'error': f'Agent with ID {agent_id} not found'
                }, status=status.HTTP_404_NOT_FOUND)

            # Check capacity before adding
            if context.space and context.agents.count() >= context.space.capacity:
                logger.error(f"Failed to add agent {agent_id} to context {context.id}: Space capacity exceeded")
                return Response({
                    'error': 'Space capacity exceeded'
                }, status=status.HTTP_400_BAD_REQUEST)

            context.agents.add(agent)
            logger.info(f"Successfully added agent ID: {agent_id} (name: {agent.name}) to context ID: {context.id}")
            return Response({'status': 'agent added'})

        except Exception as e:
            logger.error(f"Error adding agent to context: {str(e)}")
            return handle_api_error(e, "Failed to add agent to context")

    @action(detail=True, methods=['post'])
    def remove_agent(self, request, pk=None):
        """Remove an agent from a context"""
        try:
            context = self.get_object()
            agent_id = request.data.get('agent_id')

            logger.info(f"User {request.user.username} removing agent ID: {agent_id} from context ID: {context.id}")

            if not agent_id:
                return Response({
                    'error': 'agent_id is required'
                }, status=status.HTTP_400_BAD_REQUEST)

            try:
                agent = Agent.objects.get(pk=agent_id)
            except Agent.DoesNotExist:
                return Response({
                    'error': f'Agent with ID {agent_id} not found'
                }, status=status.HTTP_404_NOT_FOUND)

            if agent not in context.agents.all():
                logger.warning(f"Agent ID: {agent_id} was not in context ID: {context.id}")

            context.agents.remove(agent)
            logger.info(f"Successfully removed agent ID: {agent_id} (name: {agent.name}) from context ID: {context.id}")
            return Response({'status': 'agent removed'})

        except Exception as e:
            logger.error(f"Error removing agent from context: {str(e)}")
            return handle_api_error(e, "Failed to remove agent from context")


class RelationshipViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Relationship CRUD operations
    """
    queryset = Relationship.objects.all()
    serializer_class = RelationshipSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        """Filter relationships by agent_from or agent_to"""
        queryset = Relationship.objects.all()

        agent_from_id = self.request.query_params.get('agent_from', None)
        if agent_from_id is not None:
            queryset = queryset.filter(agent_from_id=agent_from_id)
            logger.debug(f"Filtering relationships by agent_from_id={agent_from_id}")

        agent_to_id = self.request.query_params.get('agent_to', None)
        if agent_to_id is not None:
            queryset = queryset.filter(agent_to_id=agent_to_id)
            logger.debug(f"Filtering relationships by agent_to_id={agent_to_id}")
        return queryset

    def create(self, request, *args, **kwargs):
        try:
            agent_from_id = request.data.get('agent_from')
            agent_to_id = request.data.get('agent_to')
            description = request.data.get('description', '')

            logger.info(
                f"User {request.user.username} creating relationship: agent {agent_from_id} -> agent {agent_to_id} ({description})")

            # Check if relationship already exists (same direction)
            existing = Relationship.objects.filter(
                agent_from_id=agent_from_id,
                agent_to_id=agent_to_id
            ).exists()

            if existing:
                logger.warning(f"Relationship already exists from agent {agent_from_id} to agent {agent_to_id}")
                return Response({
                    'error': f'Relationship already exists from agent {agent_from_id} to agent {agent_to_id}'
                }, status=status.HTTP_400_BAD_REQUEST)

            # Prevent self-referential relationships
            if agent_from_id == agent_to_id:
                logger.warning(f"Attempted to create self-referential relationship for agent {agent_from_id}")
                return Response({
                    'error': 'An agent cannot have a relationship with itself'
                }, status=status.HTTP_400_BAD_REQUEST)

            response = super().create(request, *args, **kwargs)
            logger.info(f"Successfully created relationship ID: {response.data.get('id')}")
            return response

        except Exception as e:
            logger.error(f"Error creating relationship: {str(e)}")
            return handle_api_error(e, "Failed to create relationship")

    def update(self, request, *args, **kwargs):
        try:
            partial = kwargs.pop('partial', False)
            instance = self.get_object()
            old_agent_from_id = instance.agent_from_id
            old_agent_to_id = instance.agent_to_id
            old_description = instance.description

            logger.info(
                f"User {request.user.username} updating relationship ID: {instance.id} with data: {request.data} (partial={partial})")

            # Validate against self-referential relationship if agents are being updated
            new_agent_from_id = request.data.get('agent_from', old_agent_from_id)
            new_agent_to_id = request.data.get('agent_to', old_agent_to_id)

            if new_agent_from_id == new_agent_to_id:
                logger.warning(f"Attempted to update relationship {instance.id} to be self-referential")
                return Response({
                    'error': 'An agent cannot have a relationship with itself'
                }, status=status.HTTP_400_BAD_REQUEST)

            response = super().update(request, *args, **kwargs)

            new_agent_from_id = response.data.get('agent_from')
            new_agent_to_id = response.data.get('agent_to')
            new_description = response.data.get('description')

            # Log significant changes
            if old_agent_from_id != new_agent_from_id or old_agent_to_id != new_agent_to_id:
                logger.warning(
                    f"Relationship ID: {instance.id} changed from agent {old_agent_from_id}->agent {old_agent_to_id} to agent {new_agent_from_id}->agent {new_agent_to_id}")

            if old_description != new_description:
                logger.info(
                    f"Relationship ID: {instance.id} description changed from '{old_description}' to '{new_description}'")

            logger.info(f"Successfully updated relationship ID: {instance.id}")
            return response

        except Exception as e:
            logger.error(f"Error updating relationship: {str(e)}")
            return handle_api_error(e, "Failed to update relationship")

    def list(self, request, *args, **kwargs):
        try:
            logger.debug(f"User {request.user.username} listing relationships with params: {request.query_params}")
            return super().list(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error listing relationships: {str(e)}")
            return handle_api_error(e, "Failed to retrieve relationships")

    def retrieve(self, request, *args, **kwargs):
        try:
            instance = self.get_object()
            logger.debug(f"User {request.user.username} retrieving relationship ID: {instance.id}")
            return super().retrieve(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Error retrieving relationship: {str(e)}")
            return handle_api_error(e, "Failed to retrieve relationship")

    def destroy(self, request, *args, **kwargs):
        try:
            obj = self.get_object()
            agent_from_name = obj.agent_from.name if obj.agent_from else "Unknown"
            agent_to_name = obj.agent_to.name if obj.agent_to else "Unknown"

            logger.warning(
                f"User {request.user.username} deleting relationship ID: {obj.id} "
                f"from agent {agent_from_name} (ID: {obj.agent_from_id}) "
                f"to agent {agent_to_name} (ID: {obj.agent_to_id}) "
                f"- Description: '{obj.description}'")

            response = super().destroy(request, *args, **kwargs)
            logger.warning(f"Successfully deleted relationship ID: {obj.id}")
            return response

        except Exception as e:
            logger.error(f"Error deleting relationship: {str(e)}")
            return handle_api_error(e, "Failed to delete relationship")

@api_view(['GET'])
def get_agent_id_by_username(request, username):
    """Return the agent_id from an agent username based on CustomUser table"""
    user = get_object_or_404(CustomUser, username=username)
    agent_profile = get_object_or_404(AgentProfile, user=user)
    agent = get_object_or_404(Agent, id=agent_profile.agent_object.id, is_archived=False)
    if agent.is_archived:
        return Response({"error": "Agent is archived"}, status=404)

    return Response({
        "agent_id": agent.id,
        "agent_name": agent.name
    })