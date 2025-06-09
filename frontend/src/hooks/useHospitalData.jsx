import { useState, useEffect } from 'react';
import api from '../api'; // Your existing API instance

export const useHospitalData = () => {
  const [users, setUsers] = useState([]);
  const [objects, setObjects] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch data from your Django REST API
      const [agentsResponse, spacesResponse, contextsResponse] = await Promise.all([
        api.get('/api/agents/'),
        api.get('/api/spaces/'),
        api.get('/api/contexts/')
      ]);

      // Transform Django API data to GraphVisualization format
      const transformedObjects = [
        // Transform Agents to objects
        ...agentsResponse.data.results.map(agent => ({
          id: `agent-${agent.id}`,
          name: agent.name,
          type: 'agent',
          properties: {
            username: `agent_${agent.id}`,
            access_level: agent.access_level
          },
          createdAt: agent.created_at,
        })),

        // Transform Spaces to objects
        ...spacesResponse.data.results.map(space => ({
          id: `space-${space.id}`,
          name: space.name,
          type: 'space',
          properties: {
            capacity: space.capacity,
          },
          createdAt: space.created_at,
        })),

        // Transform Contexts to objects
        ...contextsResponse.data.results.map(context => ({
          id: `context-${context.id}`,
          name: context.name,
          type: 'context',
          properties: {
            time: context.scheduled,
            spaceId: context.space ? `space-${context.space}` : undefined,
            participantIds: context.agents.map(agentId => `agent-${agentId}`)
          },
          createdAt: context.created_at,
        }))
      ];

      // Create relationships based on Context participants and Space associations
      const transformedRelationships = [];
      let relationshipId = 1;

      contextsResponse.data.results.forEach(context => {
        // Create relationships between agents and contexts
        context.agents.forEach(agentId => {
          transformedRelationships.push({
            id: `rel-${relationshipId++}`,
            fromObjectId: `agent-${agentId}`,
            toObjectId: `context-${context.id}`,
            relationshipType: 'participates_in',
            properties: { role: 'participant' },
            createdAt: context.created_at
          });
        });

        // Create relationship between space and context
        if (context.space) {
          transformedRelationships.push({
            id: `rel-${relationshipId++}`,
            fromObjectId: `space-${context.space}`,
            toObjectId: `context-${context.id}`,
            relationshipType: 'hosts',
            properties: {},
            createdAt: context.created_at
          });
        }
      });

      setObjects(transformedObjects);
      setRelationships(transformedRelationships);

      // Note: Your current backend doesn't have a users endpoint that matches
      // the hospital data pattern, so we'll leave users empty for now
      setUsers([]);

    } catch (err) {
      console.error('Error fetching hospital data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const createUser = async (userData) => {
    try {
      // This would need to be implemented in your Django backend
      // const response = await api.post('/api/users/', userData);
      // const newUser = response.data;
      // setUsers(prev => [...prev, newUser]);
      // return newUser;
      throw new Error('User creation not implemented yet');
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const deleteUser = async (userId) => {
    try {
      // await api.delete(`/api/users/${userId}/`);
      // setUsers(prev => prev.filter(user => user.id !== userId));
      throw new Error('User deletion not implemented yet');
    } catch (error) {
      console.error('Error deleting user:', error);
      throw error;
    }
  };

  const createObject = async (objectData) => {
    try {
      let response;
      let newObject;

      if (objectData.type === 'agent') {
        // Create agent via Django API
        response = await api.post('/api/agents/', {
          name: objectData.name,
          access_level: objectData.properties.access_level || 3
        });

        newObject = {
          id: `agent-${response.data.id}`,
          name: response.data.name,
          type: 'agent',
          category: objectData.category,
          properties: objectData.properties,
          createdAt: response.data.created_at,
          updatedAt: response.data.created_at
        };
      } else if (objectData.type === 'space') {
        // Create space via Django API
        response = await api.post('/api/spaces/', {
          name: objectData.name,
          capacity: objectData.properties.capacity || 5
        });

        newObject = {
          id: `space-${response.data.id}`,
          name: response.data.name,
          type: 'space',
          category: objectData.category,
          properties: objectData.properties,
          createdAt: response.data.created_at,
          updatedAt: response.data.created_at
        };
      } else if (objectData.type === 'context') {
        // Create context via Django API
        const agentIds = objectData.properties.participantIds?.map(id =>
          id.replace('agent-', '')
        ) || [];
        const spaceId = objectData.properties.spaceId ?
          objectData.properties.spaceId.replace('space-', '') : null;

        response = await api.post('/api/contexts/', {
          name: objectData.name,
          scheduled: objectData.properties.time,
          space_id: spaceId,
          agent_ids: agentIds
        });

        newObject = {
          id: `context-${response.data.id}`,
          name: response.data.name,
          type: 'context',
          category: objectData.category,
          properties: objectData.properties,
          createdAt: response.data.created_at,
          updatedAt: response.data.created_at
        };
      }

      if (newObject) {
        setObjects(prev => [...prev, newObject]);
        // Refresh relationships to capture new connections
        await fetchAllData();
      }

      return newObject;
    } catch (error) {
      console.error('Error creating object:', error);
      throw error;
    }
  };

  const updateObject = async (objectId, updates) => {
    try {
      const objectType = objectId.split('-')[0];
      const djangoId = objectId.split('-')[1];

      let response;

      if (objectType === 'agent') {
        response = await api.patch(`/api/agents/${djangoId}/`, {
          name: updates.name,
          access_level: updates.properties?.access_level
        });
      } else if (objectType === 'space') {
        response = await api.patch(`/api/spaces/${djangoId}/`, {
          name: updates.name,
          capacity: updates.properties?.capacity
        });
      } else if (objectType === 'context') {
        const agentIds = updates.properties?.participantIds?.map(id =>
          id.replace('agent-', '')
        );
        const spaceId = updates.properties?.spaceId ?
          updates.properties.spaceId.replace('space-', '') : null;

        response = await api.patch(`/api/contexts/${djangoId}/`, {
          name: updates.name,
          scheduled: updates.properties?.time,
          space_id: spaceId,
          agent_ids: agentIds
        });
      }

      if (response) {
        setObjects(prev => prev.map(obj =>
          obj.id === objectId
            ? { ...obj, ...updates, updatedAt: response.data.updated_at || new Date().toISOString() }
            : obj
        ));
        // Refresh to capture relationship changes
        await fetchAllData();
      }

      return response?.data;
    } catch (error) {
      console.error('Error updating object:', error);
      throw error;
    }
  };

  const deleteObject = async (objectId) => {
    try {
      const objectType = objectId.split('-')[0];
      const djangoId = objectId.split('-')[1];

      if (objectType === 'agent') {
        await api.delete(`/api/agents/${djangoId}/`);
      } else if (objectType === 'space') {
        await api.delete(`/api/spaces/${djangoId}/`);
      } else if (objectType === 'context') {
        await api.delete(`/api/contexts/${djangoId}/`);
      }

      setObjects(prev => prev.filter(obj => obj.id !== objectId));
      // Remove related relationships
      setRelationships(prev => prev.filter(rel =>
        rel.fromObjectId !== objectId && rel.toObjectId !== objectId
      ));
    } catch (error) {
      console.error('Error deleting object:', error);
      throw error;
    }
  };

  const createRelationship = async (relationshipData) => {
    try {
      // For your current Django model, relationships are mainly created
      // through Context associations. You might need to extend your backend
      // to support explicit relationships if needed.

      const newRelationship = {
        id: `rel-${Date.now()}`,
        ...relationshipData,
        createdAt: new Date().toISOString()
      };
      setRelationships(prev => [...prev, newRelationship]);
      return newRelationship;
    } catch (error) {
      console.error('Error creating relationship:', error);
      throw error;
    }
  };

  const deleteRelationship = async (relationshipId) => {
    try {
      // Similar to createRelationship, this would need backend support
      setRelationships(prev => prev.filter(rel => rel.id !== relationshipId));
    } catch (error) {
      console.error('Error deleting relationship:', error);
      throw error;
    }
  };

  // Refresh data function
  const refreshData = () => {
    fetchAllData();
  };

  return {
    users,
    objects,
    relationships,
    loading,
    error,
    createUser,
    deleteUser,
    createObject,
    updateObject,
    deleteObject,
    createRelationship,
    deleteRelationship,
    refreshData
  };
};