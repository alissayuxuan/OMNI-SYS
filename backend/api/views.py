from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Agent, Space, Context, Relationship
from .serializers import AgentSerializer, SpaceSerializer, ContextSerializer, RelationshipSerializer


class AgentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Agent CRUD operations
    """
    queryset = Agent.objects.all()
    serializer_class = AgentSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Optionally filter agents by access_level"""
        queryset = Agent.objects.all()
        access_level = self.request.query_params.get('access_level', None)
        if access_level is not None:
            queryset = queryset.filter(access_level=access_level)
        return queryset.order_by('-created_at')


class SpaceViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Space CRUD operations
    """
    queryset = Space.objects.all()
    serializer_class = SpaceSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Optionally filter spaces by capacity"""
        queryset = Space.objects.all()
        min_capacity = self.request.query_params.get('min_capacity', None)
        if min_capacity is not None:
            queryset = queryset.filter(capacity__gte=min_capacity)
        return queryset.order_by('-created_at')

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

    @action(detail=True, methods=['post'])
    def add_agent(self, request, pk=None):
        """Add an agent to a context"""
        context = self.get_object()
        agent_id = request.data.get('agent_id')

        try:
            agent = Agent.objects.get(pk=agent_id)
            context.agents.add(agent)
            return Response({'status': 'agent added'})
        except Agent.DoesNotExist:
            return Response(
                {'error': 'Agent not found'},
                status=status.HTTP_404_NOT_FOUND
            )

    @action(detail=True, methods=['post'])
    def remove_agent(self, request, pk=None):
        """Remove an agent from a context"""
        context = self.get_object()
        agent_id = request.data.get('agent_id')

        try:
            agent = Agent.objects.get(pk=agent_id)
            context.agents.remove(agent)
            return Response({'status': 'agent removed'})
        except Agent.DoesNotExist:
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

        patient_id = self.request.query_params.get('patient', None)
        if patient_id is not None:
            queryset = queryset.filter(patient_id=patient_id)

        return queryset