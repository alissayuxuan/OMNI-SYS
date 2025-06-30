/**
 * AdminDashboard – React Component
 *
 * This is the main interface for admin users in the OMNI-SYS system.
 * It aggregates data from the backend, presents system statistics, and provides 
 * tabs for managing users, objects (agents, contexts, spaces), and relationships.
 *
 * Features:
 * - Fetches data on agents, contexts, spaces, and relationships using React Query.
 * - Displays system statistics (with periodic refresh every 60 seconds).
 * - Constructs a knowledge-graph-style view of all entities and their relationships.
 * 
 * Tabs:
 * - Object Management: CRUD interface for hospital entities.
 * - Relationship Management: Define how objects are connected.
 * - User Management: Administer agent and admin user accounts.
 * - Graph: Visualize the current system using a force-directed D3 graph.
 * - Settings: Update admin profile info and change password.
 *
 * Dependencies:
 * - React Query (data fetching and caching)
 * - Lucide Icons
 * - Custom components (Header, GraphVisualization, ObjectManagement, etc.)
 * - `manageHospitalData` hook for backend API functions
 */


import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/layout/Header';
import { UserManagement } from '@/components/admin/UserManagement';
import { ObjectManagement } from '@/components/admin/ObjectManagement';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { GraphVisualization } from '@/components/graph/GraphVisualization';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Database, Network, Building, CalendarDays} from 'lucide-react';
import { RelationshipManagement } from '@/components/admin/RelationshipManagement';
import { manageHospitalData } from '../hooks/manageHospitalData';

export const AdminDashboard = () => {
  const { getAgents, getSpaces, getContexts, getRelationships } = manageHospitalData();


  const queryClient = useQueryClient();
  const { data: agentsRes = { results: [] }, isLoading: loadingAgents } = useQuery({
    queryKey: ['agents'], 
    queryFn: getAgents,
    refetchInterval: 60 * 1000, // refresh every 60s
    refetchIntervalInBackground: false // no refresh in background
  });
  const { data: contextsRes = { results: [] }, isLoading: loadingContexts } = useQuery({ 
    queryKey: ['contexts'],
    queryFn: getContexts,
    refetchInterval: 60 * 1000, 
    refetchIntervalInBackground: false 
  });
  const { data: spacesRes = { results: [] }, isLoading: loadingSpaces } = useQuery({ 
    queryKey: ['spaces'], 
    queryFn: getSpaces,
    refetchInterval: 60 * 1000, 
    refetchIntervalInBackground: false 
  });
  const { data: relationshipsRes = { results: [] }, isLoading: loadingRelationships } = useQuery({ 
    queryKey: ['relationships'], 
    queryFn: getRelationships,
    refetchInterval: 60 * 1000,
    refetchIntervalInBackground: false
  });


  /* Stats */
  const stats = useMemo(() => {
    const agentCount = agentsRes?.results?.length || 0;
    const contextCount = contextsRes?.results?.length || 0;
    const spaceCount = spacesRes?.results?.length || 0;
    const relationshipCount = relationshipsRes?.results?.length || 0; // fallback if undefined
  
    return {
      agents: agentCount,
      contexts: contextCount,
      spaces: spaceCount,
      relationships: relationshipCount,
      totalObjects: agentCount + contextCount + spaceCount
    };
  }, [agentsRes, contextsRes, spacesRes, relationshipsRes]);


  /* Objects and Relationships for Graph Visualization */
  const agents = useMemo(() => agentsRes.results.map(agent => ({
    id: "agent-" + agent.id,
    name: agent.name,
    type: "agent",
    createdAt: agent.created_at,
    properties: {
      
    },
  })), [agentsRes]);

  const contexts = useMemo(() => contextsRes.results.map(context => ({
    id: "context-" + context.id,
    name: context.name,
    type: "context",
    createdAt : context.created_at,
    properties: {
      time: context.scheduled,
      paticipants: context.agents_detail.map(agent => agent.name),
      space: context.space_detail.name
    },
  })), [contextsRes]);

  
  const spaces = useMemo(() => spacesRes.results.map(space => ({
    id: "space-" + space.id,
    name: space.name,
    type: "space",
    createdAt: space.created_at,
    properties: {
      capacity: space.capacity,
    },
  })), [spacesRes]);

  const objects = useMemo(() => {
    return [
      ...agents,   
      ...contexts,
      ...spaces
    ];
  }, [agents, contexts, spaces]);


  const relationships = useMemo(() => {
    const rels = [];
  
    // Relationships from context → agents / spaces
    for (const context of contextsRes.results) {
      // Agent → Context
      for (const agentId of context.agents || []) {
        rels.push({
          fromObjectId: "agent-" + agentId,
          toObjectId: "context-" + context.id,
          relationshipType: "participates_in",
        });
      }
  
      // Space → Context
      if (context.space) {
        rels.push({
          fromObjectId: "space-" + context.space,
          toObjectId: "context-" + context.id,
          relationshipType: "assigned_space",
        });
      }
    }
  
    // Explicit agent ↔ agent relationships from backend
    const backendRelationships = (relationshipsRes?.results || []).map(rel => ({
      id: "relationship" + rel.id,
      fromObjectId: "agent-" + rel.agent_from,
      toObjectId: "agent-" + rel.agent_to,
      relationshipType: rel.description || 'related',
    }));
  
    return [...rels, ...backendRelationships];
  }, [contextsRes, relationshipsRes]);
  
  

  
  

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Administrator Dashboard</h2>
          <p className="text-gray-600">Manage users, objects, and system relationships</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Database className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Objects</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalObjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Agents</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.agents}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CalendarDays className="h-8 w-8 text-yellow-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Contexts</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.contexts}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Building className="h-8 w-8 text-orange-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Spaces</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.spaces}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Network className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Relationships</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.relationships}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="objects" className="space-y-6">
          <TabsList>
            <TabsTrigger value="objects">Object Management</TabsTrigger>
            <TabsTrigger value="relationships">Relationship Management</TabsTrigger>
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="graph">System Graph</TabsTrigger>
            <TabsTrigger value="settings">Profile Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="objects">
            <ObjectManagement/>
          </TabsContent>

          <TabsContent value="relationships">
            <RelationshipManagement />
          </TabsContent>

          <TabsContent value="users">
            <UserManagement />
          </TabsContent>

          <TabsContent value="graph">
            <Card>
              <CardHeader>
                <CardTitle>System Relationship Graph</CardTitle>
                <CardDescription>Visual representation of all objects and their relationships with filtering and search</CardDescription>
              </CardHeader>
              <CardContent>
                <GraphVisualization objects={objects} relationships={relationships} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <ProfileSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};