import { useState, useEffect } from 'react';
import api from '../api';
import { jwtDecode } from "jwt-decode";
import { ACCESS_TOKEN } from "../constants";

export const useHospitalData = (filterByCurrentUser = false) => {
  const [users, setUsers] = useState([]);
  const [objects, setObjects] = useState([]);
  const [relationships, setRelationships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // Get current user info from JWT token
  useEffect(() => {
    if (filterByCurrentUser) {
      const token = localStorage.getItem(ACCESS_TOKEN);
      if (token) {
        try {
          const decoded = jwtDecode(token);
          setCurrentUser({
            id: decoded.user_id,
            username: decoded.username || decoded.sub,
            role: decoded.role
          });
        } catch (error) {
          console.error('Error decoding token:', error);
        }
      }
    }
  }, [filterByCurrentUser]);

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, [currentUser]);

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
      const allObjects = [
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
            participantIds: context.agents.map(agentId => `agent-${agentId}`),
            django_id: context.id
          },
          createdAt: context.created_at,
        }))
      ];

      // Create relationships based on Context participants and Space associations
      const allRelationships = [];
      let relationshipId = 1;

      contextsResponse.data.results.forEach(context => {
        // Create relationships between agents and contexts
        context.agents.forEach(agentId => {
          allRelationships.push({
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
          allRelationships.push({
            id: `rel-${relationshipId++}`,
            fromObjectId: `space-${context.space}`,
            toObjectId: `context-${context.id}`,
            relationshipType: 'hosts',
            properties: {},
            createdAt: context.created_at
          });
        }
      });

      // Filter data if requested and user is an agent
      let filteredObjects = allObjects;
      let filteredRelationships = allRelationships;

      if (filterByCurrentUser && currentUser && currentUser.role === 'agent') {
        const userRelatedData = filterDataForUser(allObjects, allRelationships, currentUser);
        filteredObjects = userRelatedData.objects;
        filteredRelationships = userRelatedData.relationships;
      }

      setObjects(filteredObjects);
      setRelationships(filteredRelationships);
      setUsers([]); // Keep empty for now

    } catch (err) {
      console.error('Error fetching hospital data:', err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  // Filter data to show only objects related to the current user
  const filterDataForUser = (allObjects, allRelationships, user) => {
    // Find the current user's agent object
    // You might need to adjust this logic based on how you link Django users to agents
    // For now, we'll try to match by username or look for a specific naming pattern
    const currentUserAgent = allObjects.find(obj =>
      obj.type === 'agent' && (
        obj.properties.username === user.username ||
        obj.name.toLowerCase().includes(user.username.toLowerCase()) ||
        obj.properties.django_id === user.id // if you have a direct link
      )
    );

    if (!currentUserAgent) {
      // If no agent found for user, return empty data
      console.warn('No agent found for current user:', user.username);
      return { objects: [], relationships: [] };
    }

    console.log('Found current user agent:', currentUserAgent);

    // Find all objects connected to the current user
    const connectedObjectIds = new Set([currentUserAgent.id]);

    // First pass: Find directly connected objects
    allRelationships.forEach(rel => {
      if (rel.fromObjectId === currentUserAgent.id) {
        connectedObjectIds.add(rel.toObjectId);
      }
      if (rel.toObjectId === currentUserAgent.id) {
        connectedObjectIds.add(rel.fromObjectId);
      }
    });

    // Second pass: Find agents in the same contexts
    const userContexts = Array.from(connectedObjectIds).filter(id => id.startsWith('context-'));
    userContexts.forEach(contextId => {
      allRelationships.forEach(rel => {
        if (rel.toObjectId === contextId && rel.relationshipType === 'participates_in') {
          connectedObjectIds.add(rel.fromObjectId); // Add other agents in same context
        }
        if (rel.fromObjectId === contextId && rel.relationshipType === 'hosts') {
          connectedObjectIds.add(rel.toObjectId); // Add spaces hosting user's contexts
        }
      });
    });

    // Third pass: Find spaces related to user's contexts
    const userSpaces = Array.from(connectedObjectIds).filter(id => id.startsWith('space-'));
    userSpaces.forEach(spaceId => {
      allRelationships.forEach(rel => {
        if (rel.fromObjectId === spaceId && rel.relationshipType === 'hosts') {
          connectedObjectIds.add(rel.toObjectId); // Add contexts in user's spaces
        }
      });
    });

    // Filter objects to only include connected ones
    const filteredObjects = allObjects.filter(obj => connectedObjectIds.has(obj.id));

    // Filter relationships to only include those between filtered objects
    const filteredRelationships = allRelationships.filter(rel =>
      connectedObjectIds.has(rel.fromObjectId) && connectedObjectIds.has(rel.toObjectId)
    );

    console.log(`Filtered data for user ${user.username}:`, {
      totalObjects: allObjects.length,
      filteredObjects: filteredObjects.length,
      totalRelationships: allRelationships.length,
      filteredRelationships: filteredRelationships.length,
      connectedObjectIds: Array.from(connectedObjectIds)
    });

    return { objects: filteredObjects, relationships: filteredRelationships };
  };

  // Rest of your existing methods (createUser, deleteUser, etc.) remain the same
  const createUser = async (userData) => {
    try {
      throw new Error('User creation not implemented yet');
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  };

  const deleteUser = async (userId) => {
    try {
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
        response = await api.post('/api/agents/', {
          name: objectData.name,
          access_level: objectData.properties.access_level || 3
        });

        newObject = {
          id: `agent-${response.data.id}`,
          name: response.data.name,
          type: 'agent',
          category: objectData.category,
          properties: { ...objectData.properties, django_id: response.data.id },
          createdAt: response.data.created_at,
          updatedAt: response.data.created_at
        };
      } else if (objectData.type === 'space') {
        response = await api.post('/api/spaces/', {
          name: objectData.name,
          capacity: objectData.properties.capacity || 5
        });

        newObject = {
          id: `space-${response.data.id}`,
          name: response.data.name,
          type: 'space',
          category: objectData.category,
          properties: { ...objectData.properties, django_id: response.data.id },
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
          properties: { ...objectData.properties, django_id: response.data.id },
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
    currentUser,
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