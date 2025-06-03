# backend/api/tests.py
from django.test import TestCase
from rest_framework.test import APITestCase
from rest_framework import status
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from .models import Agent, Space, Context, Relationship
from users.models import AdminProfile
import json

User = get_user_model()


class BaseAPITest(APITestCase):
    """Base test class with common setup"""

    def setUp(self):
        """Create test users and authenticate"""
        # Create admin user
        self.admin_user = User.objects.create_user(
            username='admin',
            password='testpass123',
            role='admin'
        )
        AdminProfile.objects.create(
            user=self.admin_user,
            first_name='Admin',
            last_name='User',
            email='admin@test.com',
            access_level=10
        )

        # Create regular agent user
        self.agent_user = User.objects.create_user(
            username='agent',
            password='testpass123',
            role='agent'
        )

        # Create another admin for permission tests
        self.admin_user2 = User.objects.create_user(
            username='admin2',
            password='testpass123',
            role='admin'
        )

        # Default to admin authentication
        self.client.force_authenticate(user=self.admin_user)

        # Create some test data
        self.create_test_data()

    def create_test_data(self):
        """Create initial test data"""
        # Create test agents
        self.agent1 = Agent.objects.create(name='Dr. Smith', access_level=5)
        self.agent2 = Agent.objects.create(name='Dr. Johnson', access_level=7)
        self.agent3 = Agent.objects.create(name='Nurse Williams', access_level=3)
        self.agent4 = Agent.objects.create(name='Patient Brown', access_level=1)

        # Create test spaces
        self.space1 = Space.objects.create(name='Operating Room 1', capacity=5)
        self.space2 = Space.objects.create(name='Consultation Room A', capacity=2)
        self.space3 = Space.objects.create(name='Large Conference Hall', capacity=50)

        # Create test contexts
        self.context1 = Context.objects.create(
            name='Morning Surgery Session',
            scheduled=timezone.now() + timedelta(days=1),
            space=self.space1
        )
        self.context1.agents.add(self.agent1, self.agent3)

        self.context2 = Context.objects.create(
            name='Afternoon Consultation',
            scheduled=timezone.now() + timedelta(days=2),
            space=self.space2
        )
        self.context2.agents.add(self.agent2)

        # Create test relationships
        self.relationship1 = Relationship.objects.create(
            doctor=self.agent1,
            patient=self.agent4
        )


class AgentAPITest(BaseAPITest):
    """Test Agent API endpoints"""

    def test_list_agents(self):
        """Test listing all agents"""
        url = '/api/agents/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 4)

    def test_list_agents_with_pagination(self):
        """Test pagination in agent listing"""
        # Create more agents
        for i in range(25):
            Agent.objects.create(name=f'Agent {i}', access_level=i % 10)

        url = '/api/agents/?page_size=10'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 10)
        self.assertIn('next', response.data)
        self.assertIn('previous', response.data)

    def test_filter_agents_by_access_level(self):
        """Test filtering agents by access level"""
        url = '/api/agents/?access_level=5'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Dr. Smith')

    def test_filter_agents_by_access_level_range(self):
        """Test filtering agents by access level range"""
        url = '/api/agents/?min_access_level=5&max_access_level=7'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_search_agents_by_name(self):
        """Test searching agents by name"""
        url = '/api/agents/?search=Smith'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Dr. Smith')

    def test_create_agent_success(self):
        """Test successful agent creation"""
        url = '/api/agents/'
        data = {
            'name': 'Dr. New Agent',
            'access_level': 6
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Dr. New Agent')
        self.assertEqual(response.data['access_level'], 6)
        self.assertIn('id', response.data)
        self.assertIn('created_at', response.data)

    def test_create_agent_validation_errors(self):
        """Test agent creation with validation errors"""
        url = '/api/agents/'

        # Test short name
        data = {'name': 'A', 'access_level': 5}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

        # Test invalid access level
        data = {'name': 'Valid Name', 'access_level': -1}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('access_level', response.data)

        # Test access level too high
        data = {'name': 'Valid Name', 'access_level': 11}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('access_level', response.data)

    def test_create_agent_duplicate_name(self):
        """Test creating agent with duplicate name"""
        url = '/api/agents/'
        data = {'name': 'Dr. Smith', 'access_level': 5}  # Name already exists
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

    def test_create_agent_high_access_level_permission(self):
        """Test that only admins can create agents with high access levels"""
        # Switch to agent user
        self.client.force_authenticate(user=self.agent_user)

        url = '/api/agents/'
        data = {'name': 'High Access Agent', 'access_level': 8}
        response = self.client.post(url, data, format='json')

        # Agent users shouldn't be able to create agents at all
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_retrieve_agent(self):
        """Test retrieving a single agent"""
        url = f'/api/agents/{self.agent1.id}/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Dr. Smith')
        self.assertEqual(response.data['access_level'], 5)

    def test_update_agent_full(self):
        """Test full update (PUT) of agent"""
        url = f'/api/agents/{self.agent1.id}/'
        data = {
            'name': 'Dr. Smith Updated',
            'access_level': 6
        }
        response = self.client.put(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Dr. Smith Updated')
        self.assertEqual(response.data['access_level'], 6)

        # Verify in database
        self.agent1.refresh_from_db()
        self.assertEqual(self.agent1.name, 'Dr. Smith Updated')
        self.assertEqual(self.agent1.access_level, 6)

    def test_update_agent_partial(self):
        """Test partial update (PATCH) of agent"""
        url = f'/api/agents/{self.agent1.id}/'
        data = {'access_level': 6}  # Only updating access_level
        response = self.client.patch(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['name'], 'Dr. Smith')  # Unchanged
        self.assertEqual(response.data['access_level'], 6)  # Updated

    def test_delete_agent(self):
        """Test deleting an agent"""
        agent_id = self.agent4.id
        url = f'/api/agents/{agent_id}/'
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Agent.objects.filter(id=agent_id).exists())

    def test_delete_agent_with_relationships(self):
        """Test deleting an agent that has relationships"""
        # agent1 is a doctor with patients
        url = f'/api/agents/{self.agent1.id}/'
        response = self.client.delete(url)

        # Should still delete (CASCADE)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Agent.objects.filter(id=self.agent1.id).exists())
        # Relationship should also be deleted
        self.assertFalse(Relationship.objects.filter(doctor=self.agent1).exists())

    def test_agent_ordering(self):
        """Test ordering agents"""
        # Order by name ascending
        url = '/api/agents/?ordering=name'
        response = self.client.get(url)
        names = [a['name'] for a in response.data['results']]
        self.assertEqual(names, sorted(names))

        # Order by access_level descending
        url = '/api/agents/?ordering=-access_level'
        response = self.client.get(url)
        levels = [a['access_level'] for a in response.data['results']]
        self.assertEqual(levels, sorted(levels, reverse=True))

    def test_unauthorized_access(self):
        """Test accessing agents without authentication"""
        self.client.force_authenticate(user=None)
        url = '/api/agents/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SpaceAPITest(BaseAPITest):
    """Test Space API endpoints"""

    def test_list_spaces(self):
        """Test listing all spaces"""
        url = '/api/spaces/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 3)

    def test_filter_spaces_by_capacity(self):
        """Test filtering spaces by minimum capacity"""
        url = '/api/spaces/?min_capacity=5'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)  # space1 and space3

    def test_create_space_success(self):
        """Test successful space creation"""
        url = '/api/spaces/'
        data = {
            'name': 'New Surgery Room',
            'capacity': 8
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'New Surgery Room')
        self.assertEqual(response.data['capacity'], 8)

    def test_create_space_validation_errors(self):
        """Test space creation with validation errors"""
        url = '/api/spaces/'

        # Test short name
        data = {'name': 'AB', 'capacity': 5}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('name', response.data)

        # Test zero capacity
        data = {'name': 'Valid Space Name', 'capacity': 0}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('capacity', response.data)

        # Test excessive capacity
        data = {'name': 'Valid Space Name', 'capacity': 1001}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('capacity', response.data)

    def test_update_space_reduce_capacity_validation(self):
        """Test that reducing capacity validates against existing contexts"""
        # First, fill the context to capacity
        self.context1.agents.add(self.agent2, self.agent4)  # Now has 4 agents

        url = f'/api/spaces/{self.space1.id}/'
        data = {
            'name': 'Operating Room 1',
            'capacity': 3  # Reducing from 5 to 3, but context has 4 agents
        }
        response = self.client.put(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('capacity', response.data)

    def test_space_contexts_endpoint(self):
        """Test retrieving contexts for a specific space"""
        url = f'/api/spaces/{self.space1.id}/contexts/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['name'], 'Morning Surgery Session')

    def test_delete_space_with_contexts(self):
        """Test deleting a space that has contexts"""
        url = f'/api/spaces/{self.space1.id}/'
        response = self.client.delete(url)

        # Should delete, but contexts will have null space
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.context1.refresh_from_db()
        self.assertIsNone(self.context1.space)


class ContextAPITest(BaseAPITest):
    """Test Context API endpoints"""

    def test_list_contexts(self):
        """Test listing all contexts"""
        url = '/api/contexts/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 2)

    def test_filter_contexts_by_space(self):
        """Test filtering contexts by space"""
        url = f'/api/contexts/?space={self.space1.id}'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Morning Surgery Session')

    def test_filter_contexts_by_agent(self):
        """Test filtering contexts by agent"""
        url = f'/api/contexts/?agent={self.agent1.id}'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_filter_contexts_by_date_range(self):
        """Test filtering contexts by date range"""
        from_date = timezone.now().isoformat()
        to_date = (timezone.now() + timedelta(days=1, hours=12)).isoformat()

        url = f'/api/contexts/?scheduled_after={from_date}&scheduled_before={to_date}'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['name'], 'Morning Surgery Session')

    def test_create_context_success(self):
        """Test successful context creation"""
        url = '/api/contexts/'
        scheduled_time = timezone.now() + timedelta(days=3, hours=10)
        data = {
            'name': 'Future Medical Procedure',
            'scheduled': scheduled_time.isoformat(),
            'space_id': self.space1.id,
            'agent_ids': [self.agent1.id, self.agent2.id]
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['name'], 'Future Medical Procedure')
        self.assertEqual(len(response.data['agents']), 2)
        self.assertIsNotNone(response.data['space_detail'])
        self.assertEqual(len(response.data['agents_detail']), 2)

    def test_create_context_exceeds_capacity(self):
        """Test creating context with too many agents for space"""
        url = '/api/contexts/'
        scheduled_time = timezone.now() + timedelta(days=3)
        data = {
            'name': 'Overcrowded Context',
            'scheduled': scheduled_time.isoformat(),
            'space_id': self.space2.id,  # Capacity is 2
            'agent_ids': [self.agent1.id, self.agent2.id, self.agent3.id]  # 3 agents
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('agent_ids', response.data)

    def test_create_context_past_date(self):
        """Test creating context with past date"""
        url = '/api/contexts/'
        past_time = timezone.now() - timedelta(days=1)
        data = {
            'name': 'Past Context',
            'scheduled': past_time.isoformat(),
            'space_id': self.space1.id,
            'agent_ids': [self.agent1.id]
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('scheduled', response.data)

    def test_create_context_scheduling_conflict(self):
        """Test creating context with scheduling conflict"""
        url = '/api/contexts/'
        # Same time as context1
        data = {
            'name': 'Conflicting Context',
            'scheduled': self.context1.scheduled.isoformat(),
            'space_id': self.space1.id,  # Same space
            'agent_ids': [self.agent2.id]
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('scheduled', response.data)

    def test_create_context_agent_conflict(self):
        """Test creating context with agent scheduling conflict"""
        url = '/api/contexts/'
        # Slightly overlapping time
        conflict_time = self.context1.scheduled + timedelta(hours=1)
        data = {
            'name': 'Agent Conflict Context',
            'scheduled': conflict_time.isoformat(),
            'space_id': self.space2.id,  # Different space
            'agent_ids': [self.agent1.id]  # agent1 is already in context1
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('agent_ids', response.data)

    def test_add_agent_to_context(self):
        """Test adding an agent to an existing context"""
        url = f'/api/contexts/{self.context1.id}/add_agent/'
        data = {'agent_id': self.agent2.id}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'agent added')

        # Verify agent was added
        self.assertIn(self.agent2, self.context1.agents.all())

    def test_add_agent_exceeds_capacity(self):
        """Test adding agent when it would exceed space capacity"""
        # Fill the space first
        self.context1.agents.add(self.agent2, self.agent4)  # Now at capacity (5)

        url = f'/api/contexts/{self.context1.id}/add_agent/'
        new_agent = Agent.objects.create(name='Extra Agent', access_level=2)
        data = {'agent_id': new_agent.id}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)

    def test_remove_agent_from_context(self):
        """Test removing an agent from a context"""
        url = f'/api/contexts/{self.context1.id}/remove_agent/'
        data = {'agent_id': self.agent1.id}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['status'], 'agent removed')

        # Verify agent was removed
        self.assertNotIn(self.agent1, self.context1.agents.all())

    def test_remove_nonexistent_agent(self):
        """Test removing an agent that doesn't exist"""
        url = f'/api/contexts/{self.context1.id}/remove_agent/'
        data = {'agent_id': 99999}
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_context_has_availability_filter(self):
        """Test filtering contexts by availability"""
        # Fill context2 to capacity
        self.context2.agents.add(self.agent1)  # Now at capacity (2)

        url = '/api/contexts/?has_availability=true'
        response = self.client.get(url)

        # Only context1 should have availability
        self.assertEqual(len(response.data['results']), 1)
        self.assertEqual(response.data['results'][0]['id'], self.context1.id)


class RelationshipAPITest(BaseAPITest):
    """Test Relationship API endpoints"""

    def test_list_relationships(self):
        """Test listing all relationships"""
        url = '/api/relationships/'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_filter_relationships_by_doctor(self):
        """Test filtering relationships by doctor"""
        url = f'/api/relationships/?doctor={self.agent1.id}'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_filter_relationships_by_patient(self):
        """Test filtering relationships by patient"""
        url = f'/api/relationships/?patient={self.agent4.id}'
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data['results']), 1)

    def test_create_relationship_success(self):
        """Test successful relationship creation"""
        url = '/api/relationships/'
        data = {
            'doctor': self.agent2.id,  # Dr. Johnson
            'patient': self.agent3.id  # Nurse Williams as patient
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['doctor'], self.agent2.id)
        self.assertEqual(response.data['patient'], self.agent3.id)

    def test_create_relationship_low_access_doctor(self):
        """Test creating relationship with low access level doctor"""
        url = '/api/relationships/'
        data = {
            'doctor': self.agent4.id,  # Patient Brown (access_level=1)
            'patient': self.agent3.id
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('doctor', response.data)

    def test_create_duplicate_relationship(self):
        """Test creating duplicate relationship"""
        url = '/api/relationships/'
        data = {
            'doctor': self.agent1.id,
            'patient': self.agent4.id  # This relationship already exists
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_self_relationship(self):
        """Test creating relationship where agent is both doctor and patient"""
        url = '/api/relationships/'
        data = {
            'doctor': self.agent1.id,
            'patient': self.agent1.id  # Same agent
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_circular_relationship(self):
        """Test creating circular relationship"""
        # First create A->B relationship
        Relationship.objects.create(doctor=self.agent1, patient=self.agent2)

        # Try to create B->A relationship
        url = '/api/relationships/'
        data = {
            'doctor': self.agent2.id,
            'patient': self.agent1.id
        }
        response = self.client.post(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_update_relationship(self):
        """Test updating a relationship"""
        url = f'/api/relationships/{self.relationship1.id}/'
        data = {
            'doctor': self.agent2.id,  # Change doctor
            'patient': self.agent4.id  # Keep same patient
        }
        response = self.client.put(url, data, format='json')

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['doctor'], self.agent2.id)

    def test_delete_relationship(self):
        """Test deleting a relationship"""
        url = f'/api/relationships/{self.relationship1.id}/'
        response = self.client.delete(url)

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Relationship.objects.filter(id=self.relationship1.id).exists())


class PermissionTest(BaseAPITest):
    """Test API permissions"""

    def test_agent_user_cannot_create(self):
        """Test that agent users cannot create objects"""
        self.client.force_authenticate(user=self.agent_user)

        # Try to create agent
        url = '/api/agents/'
        data = {'name': 'New Agent', 'access_level': 3}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        # Try to create space
        url = '/api/spaces/'
        data = {'name': 'New Space', 'capacity': 5}
        response = self.client.post(url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_agent_user_can_read(self):
        """Test that agent users can read objects"""
        self.client.force_authenticate(user=self.agent_user)

        # Should be able to list agents
        url = '/api/agents/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Should be able to retrieve specific agent
        url = f'/api/agents/{self.agent1.id}/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_unauthenticated_access_denied(self):
        """Test that unauthenticated users cannot access API"""
        self.client.force_authenticate(user=None)

        endpoints = [
            '/api/agents/',
            '/api/spaces/',
            '/api/contexts/',
            '/api/relationships/'
        ]