from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.filters import SearchFilter
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Agent, Space, Context, Relationship
from .serializers import AgentSerializer, SpaceSerializer, ContextSerializer, RelationshipSerializer
from django_filters.rest_framework import DjangoFilterBackend, OrderingFilter
from .filters import AgentFilter, SpaceFilter, ContextFilter#
import logging
from mqtt_backend.comm_node_manager import CommNodeManager
logger = logging.getLogger('omnisyslogger')

agent_comm_nodes = {}

class AgentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Agent CRUD operations
    """
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, OrderingFilter, SearchFilter]
    filterset_class = AgentFilter
    ordering_fields = ['name', 'access_level', 'created_at']
    ordering = ['-created_at']  # Default ordering
    search_fields = ['name']  # Fields for ?search= parameter

    def get_queryset(self):
        """Optionally filter agents by access_level"""
        queryset = Agent.objects.all()
        access_level = self.request.query_params.get('access_level', None)
        if access_level is not None:
            queryset = queryset.filter(access_level=access_level)
        return queryset.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        logger.info(f"Creating new agent with data: {request.data}")
        response = super().create(request, *args, **kwargs)
        logger.info(f"Successfully created agent with ID: {response.data.get('id')}")
        agent_id = response.data.get('id')
        if agent_id:
            CommNodeManager.create_node(agent_id)
        return response

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        logger.info(f"User {request.user.username} updating agent ID: {instance.id} with data: {request.data} (partial={partial})")
        response = super().update(request, *args, **kwargs)
        logger.info(f"Successfully updated agent ID: {instance.id}") # TODO: Should first check the response code and log next? 
        return response

    def list(self, request, *args, **kwargs):
        logger.debug(f"User {request.user.username} listing agents with params: {request.query_params}")
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        logger.debug(f"User {request.user.username} retrieving agent ID: {instance.id}")
        return super().retrieve(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        logger.info(f"Deleting agent with ID: {obj.id}")
        agent_id = obj.id
        CommNodeManager.shutdown_node(agent_id)
        return super().destroy(request, *args, **kwargs)


class SpaceViewSet(viewsets.ModelViewSet):
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

    def get_queryset(self):
        """Optionally filter spaces by capacity"""
        queryset = Space.objects.all()
        min_capacity = self.request.query_params.get('min_capacity', None)
        if min_capacity is not None:
            queryset = queryset.filter(capacity__gte=min_capacity)
        return queryset.order_by('-created_at')

    def create(self, request, *args, **kwargs):
        logger.info(f"User {request.user.username} creating new space with data: {request.data}")
        response = super().create(request, *args, **kwargs)
        logger.info(
            f"Successfully created space with ID: {response.data.get('id')}, capacity: {response.data.get('capacity')}")
        return response

    def update(self, request, *args, **kwargs):
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

    def destroy(self, request, *args, **kwargs):
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

    @action(detail=True, methods=['get'])
    def contexts(self, request, pk=None):
        """Get all contexts for a specific space"""
        space = self.get_object()
        contexts = Context.objects.filter(space=space)
        serializer = ContextSerializer(contexts, many=True)
        return Response(serializer.data)


class ContextViewSet(viewsets.ModelViewSet):
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

    def get_queryset(self):
        """Filter contexts with various options"""
        queryset = Context.objects.all()

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

    def create(self, request, *args, **kwargs):
        logger.info(f"User {request.user.username} creating new context with data: {request.data}")

        # Log space and agent assignments
        space_id = request.data.get('space_id')
        agent_ids = request.data.get('agent_ids', [])
        logger.info(f"Context will be assigned to space ID: {space_id} with {len(agent_ids)} agents: {agent_ids}")

        response = super().create(request, *args, **kwargs)
        logger.info(
            f"Successfully created context ID: {response.data.get('id')} scheduled for {response.data.get('scheduled')}")
        return response

    def update(self, request, *args, **kwargs):
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

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        logger.warning(
            f"User {request.user.username} deleting context ID: {obj.id}, name: {obj.name}, scheduled: {obj.scheduled}")
        logger.info(f"Context had {obj.agents.count()} agents assigned")
        response = super().destroy(request, *args, **kwargs)
        logger.warning(f"Successfully deleted context ID: {obj.id}")
        return response

    @action(detail=True, methods=['post'])
    def add_agent(self, request, pk=None):
        """Add an agent to a context"""
        context = self.get_object()
        agent_id = request.data.get('agent_id')

        logger.info(f"User {request.user.username} adding agent ID: {agent_id} to context ID: {context.id}")

        try:
            agent = Agent.objects.get(pk=agent_id)

            # Check capacity before adding
            if context.space and context.agents.count() >= context.space.capacity:
                logger.error(f"Failed to add agent {agent_id} to context {context.id}: Space capacity exceeded")
                return Response(
                    {'error': 'Space capacity exceeded'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            context.agents.add(agent)
            logger.info(f"Successfully added agent ID: {agent_id} (name: {agent.name}) to context ID: {context.id}")
            return Response({'status': 'agent added'})
        except Agent.DoesNotExist:
            logger.error(f"Failed to add agent: Agent ID {agent_id} not found")
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def remove_agent(self, request, pk=None):
        """Remove an agent from a context"""
        context = self.get_object()
        agent_id = request.data.get('agent_id')

        logger.info(f"User {request.user.username} removing agent ID: {agent_id} from context ID: {context.id}")

        try:
            agent = Agent.objects.get(pk=agent_id)
            if agent not in context.agents.all():
                logger.warning(f"Agent ID: {agent_id} was not in context ID: {context.id}")

            context.agents.remove(agent)
            logger.info(f"Successfully removed agent ID: {agent_id} (name: {agent.name}) from context ID: {context.id}")
            return Response({'status': 'agent removed'})
        except Agent.DoesNotExist:
            logger.error(f"Failed to remove agent: Agent ID {agent_id} not found")
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class RelationshipViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Relationship CRUD operations
    """
    queryset = Relationship.objects.all()
    serializer_class = RelationshipSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter relationships by doctor or patient"""
        queryset = Relationship.objects.all()

        doctor_id = self.request.query_params.get('doctor', None)
        if doctor_id is not None:
            queryset = queryset.filter(doctor_id=doctor_id)
            logger.debug(f"Filtering relationships by doctor_id={doctor_id}")

        patient_id = self.request.query_params.get('patient', None)
        if patient_id is not None:
            queryset = queryset.filter(patient_id=patient_id)
            logger.debug(f"Filtering relationships by patient_id={patient_id}")

        return queryset

    def create(self, request, *args, **kwargs):
        doctor_id = request.data.get('doctor')
        patient_id = request.data.get('patient')
        logger.info(
            f"User {request.user.username} creating relationship: doctor ID {doctor_id} -> patient ID {patient_id}")

        # Check if relationship already exists
        existing = Relationship.objects.filter(
            doctor_id=doctor_id,
            patient_id=patient_id
        ).exists()

        if existing:
            logger.warning(f"Relationship already exists between doctor {doctor_id} and patient {patient_id}")

        response = super().create(request, *args, **kwargs)
        logger.info(f"Successfully created relationship ID: {response.data.get('id')}")
        return response

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        old_doctor_id = instance.doctor_id
        old_patient_id = instance.patient_id

        logger.info(
            f"User {request.user.username} updating relationship ID: {instance.id} with data: {request.data} (partial={partial})")
        response = super().update(request, *args, **kwargs)

        new_doctor_id = response.data.get('doctor')
        new_patient_id = response.data.get('patient')

        if old_doctor_id != new_doctor_id or old_patient_id != new_patient_id:
            logger.warning(
                f"Relationship ID: {instance.id} changed from doctor {old_doctor_id}->patient {old_patient_id} to doctor {new_doctor_id}->patient {new_patient_id}")

        logger.info(f"Successfully updated relationship ID: {instance.id}")
        return response

    def destroy(self, request, *args, **kwargs):
        obj = self.get_object()
        logger.warning(
            f"User {request.user.username} deleting relationship ID: {obj.id} between doctor {obj.doctor.name} (ID: {obj.doctor_id}) and patient {obj.patient.name} (ID: {obj.patient_id})")
        response = super().destroy(request, *args, **kwargs)
        logger.warning(f"Successfully deleted relationship ID: {obj.id}")
        return response

    def list(self, request, *args, **kwargs):
        logger.debug(f"User {request.user.username} listing relationships with params: {request.query_params}")
        return super().list(request, *args, **kwargs)

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        logger.debug(f"User {request.user.username} retrieving relationship ID: {instance.id}")
        return super().retrieve(request, *args, **kwargs)