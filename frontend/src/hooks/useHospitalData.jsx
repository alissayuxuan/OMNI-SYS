import { useState } from 'react';

// Mock data
const initialUsers = [
  {
    id: '1',
    email: 'admin@hospital.com',
    role: 'admin',
    name: 'Dr. Sarah Admin',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '2',
    email: 'agent@hospital.com',
    role: 'agent',
    name: 'Dr. John Agent',
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: '3',
    email: 'nurse@hospital.com',
    role: 'agent',
    name: 'Nurse Jane Smith',
    createdAt: '2024-01-01T00:00:00Z'
  }
];

const initialObjects = [
  // Agents
  {
    id: 'agent-1',
    name: 'Dr. Smith',
    type: 'agent',
    category: 'doctor',
    properties: {
      username: 'dr.smith',
      password: 'password123',
      agentRole: 'doctor'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'agent-2',
    name: 'Nurse Johnson',
    type: 'agent',
    category: 'nurse',
    properties: {
      username: 'nurse.johnson',
      password: 'password123',
      agentRole: 'nurse'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'agent-3',
    name: 'Patient Doe',
    type: 'agent',
    category: 'patient',
    properties: {
      username: 'patient.doe',
      password: 'password123',
      agentRole: 'patient'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'agent-4',
    name: 'MRI Scanner A1',
    type: 'agent',
    category: 'device',
    properties: {
      username: 'mri.scanner.a1',
      password: 'device123',
      agentRole: 'device'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  // Spaces
  {
    id: 'space-1',
    name: 'Operating Room 1',
    type: 'space',
    category: 'surgery-room',
    properties: {
      extraInfo: 'Main surgical suite with advanced equipment'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'space-2',
    name: 'Patient Room 101',
    type: 'space',
    category: 'patient-room',
    properties: {
      extraInfo: 'Single occupancy room with private bathroom'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'space-3',
    name: 'Emergency Ward',
    type: 'space',
    category: 'emergency',
    properties: {
      extraInfo: '24/7 emergency care facility'
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  // Contexts
  {
    id: 'context-1',
    name: 'Heart Surgery Procedure',
    type: 'context',
    category: 'surgery',
    properties: {
      description: 'Coronary artery bypass surgery',
      time: '2024-03-15T09:00:00Z',
      spaceId: 'space-1',
      participantIds: ['agent-1', 'agent-2']
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'context-2',
    name: 'Patient Consultation',
    type: 'context',
    category: 'consultation',
    properties: {
      description: 'Regular check-up appointment',
      time: '2024-03-16T14:30:00Z',
      spaceId: 'space-2',
      participantIds: ['agent-1', 'agent-3']
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'context-3',
    name: 'MRI Scan Session',
    type: 'context',
    category: 'diagnostic',
    properties: {
      description: 'Brain MRI scan for diagnosis',
      time: '2024-03-17T11:00:00Z',
      participantIds: ['agent-3', 'agent-4']
    },
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

const initialRelationships = [
  {
    id: 'rel-1',
    fromObjectId: 'agent-1',
    toObjectId: 'context-1',
    relationshipType: 'participates_in',
    properties: { role: 'surgeon' },
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'rel-2',
    fromObjectId: 'agent-2',
    toObjectId: 'context-1',
    relationshipType: 'participates_in',
    properties: { role: 'assistant' },
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'rel-3',
    fromObjectId: 'space-1',
    toObjectId: 'context-1',
    relationshipType: 'hosts',
    properties: {},
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'rel-4',
    fromObjectId: 'agent-1',
    toObjectId: 'context-2',
    relationshipType: 'participates_in',
    properties: { role: 'doctor' },
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'rel-5',
    fromObjectId: 'agent-3',
    toObjectId: 'context-2',
    relationshipType: 'participates_in',
    properties: { role: 'patient' },
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'rel-6',
    fromObjectId: 'space-2',
    toObjectId: 'context-2',
    relationshipType: 'hosts',
    properties: {},
    createdAt: '2024-01-01T00:00:00Z'
  }
];

export const useHospitalData = () => {
  const [users, setUsers] = useState(initialUsers);
  const [objects, setObjects] = useState(initialObjects);
  const [relationships, setRelationships] = useState(initialRelationships);

  const createUser = (userData) => {
    const newUser = {
      id: `user-${Date.now()}`,
      ...userData,
      createdAt: new Date().toISOString()
    };
    setUsers(prev => [...prev, newUser]);
    return newUser;
  };

  const deleteUser = (userId) => {
    setUsers(prev => prev.filter(user => user.id !== userId));
  };

  const createObject = (objectData) => {
    const newObject = {
      id: `${objectData.type}-${Date.now()}`,
      ...objectData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    setObjects(prev => [...prev, newObject]);
    return newObject;
  };

  const updateObject = (objectId, updates) => {
    setObjects(prev => prev.map(obj => 
      obj.id === objectId 
        ? { ...obj, ...updates, updatedAt: new Date().toISOString() }
        : obj
    ));
  };

  const deleteObject = (objectId) => {
    setObjects(prev => prev.filter(obj => obj.id !== objectId));
    // Also remove related relationships
    setRelationships(prev => prev.filter(rel => 
      rel.fromObjectId !== objectId && rel.toObjectId !== objectId
    ));
  };

  const createRelationship = (relationshipData) => {
    const newRelationship = {
      id: `rel-${Date.now()}`,
      ...relationshipData,
      createdAt: new Date().toISOString()
    };
    setRelationships(prev => [...prev, newRelationship]);
    return newRelationship;
  };

  const deleteRelationship = (relationshipId) => {
    setRelationships(prev => prev.filter(rel => rel.id !== relationshipId));
  };

  return {
    users,
    objects,
    relationships,
    createUser,
    deleteUser,
    createObject,
    updateObject,
    deleteObject,
    createRelationship,
    deleteRelationship
  };
};