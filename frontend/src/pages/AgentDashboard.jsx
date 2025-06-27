import { Header } from '@/components/layout/Header';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { GraphVisualization } from '@/components/graph/GraphVisualization';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Database, Network, CalendarDays, Building } from 'lucide-react';
import { manageHospitalData } from '../hooks/manageHospitalData';
import { useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export const AgentDashboard = () => {

  const { getProfile, getAgents, getSpaces, getContexts, getRelationships } = manageHospitalData();

  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

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
  //filter for connectong objects of certain agent
  const getConnectedObjects = (targetAgentId, allRelationships) => {
    const connectedObjectIds = new Set([`agent-${targetAgentId}`]);
    const processedRelationships = new Set();
    
    let foundNew = true;
    while (foundNew) {
      foundNew = false;
      
      for (const rel of allRelationships) {
        const relKey = `${rel.fromObjectId}-${rel.toObjectId}-${rel.relationshipType}`;
        if (processedRelationships.has(relKey)) continue;
        
        if (connectedObjectIds.has(rel.fromObjectId)) {
          if (!connectedObjectIds.has(rel.toObjectId)) {
            connectedObjectIds.add(rel.toObjectId);
            foundNew = true;
          }
          processedRelationships.add(relKey);
        }
        
        if (connectedObjectIds.has(rel.toObjectId)) {
          if (!connectedObjectIds.has(rel.fromObjectId)) {
            connectedObjectIds.add(rel.fromObjectId);
            foundNew = true;
          }
          processedRelationships.add(relKey);
        }
      }
    }
    
    return connectedObjectIds;
  };

  const agents = useMemo(() => agentsRes.results.map(agent => ({
    id: "agent-" + agent.id,
    name: agent.name,
    type: "agent",
    createdAt: agent.created_at,
    properties: {},
  })), [agentsRes]);

  const contexts = useMemo(() => contextsRes.results.map(context => ({
    id: "context-" + context.id,
    name: context.name,
    type: "context",
    createdAt: context.created_at,
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

  const allRelationships = useMemo(() => {
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

  // filtered Obejcts and Relationships
  const getFilteredData = (targetAgentId) => {
    if (!targetAgentId) {
      return {
        objects: [...agents, ...contexts, ...spaces],
        relationships: allRelationships
      };
    }

    const connectedObjectIds = getConnectedObjects(targetAgentId, allRelationships);
    
    const filteredObjects = [
      ...agents.filter(agent => connectedObjectIds.has(agent.id)),
      ...contexts.filter(context => connectedObjectIds.has(context.id)),
      ...spaces.filter(space => connectedObjectIds.has(space.id))
    ];
    
    const filteredRelationships = allRelationships.filter(rel => 
      connectedObjectIds.has(rel.fromObjectId) && 
      connectedObjectIds.has(rel.toObjectId)
    );
    
    return {
      objects: filteredObjects,
      relationships: filteredRelationships
    };
  };


  const targetAgentId = profile?.agent_object?.id;
  const { objects: filteredObjects, relationships: filteredRelationships } = useMemo(() => 
    getFilteredData(targetAgentId), 
    [targetAgentId, agents, contexts, spaces, allRelationships]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Agent Dashboard</h2>
          <p className="text-gray-600">View system relationships and manage your profile</p>
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
        <Tabs defaultValue="graph" className="space-y-6">
          <TabsList>
            <TabsTrigger value="graph">System Graph</TabsTrigger>
            <TabsTrigger value="settings">Profile Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="graph">
            <Card>
              <CardHeader>
                <CardTitle>System Relationship Graph</CardTitle>
                <CardDescription>Visual representation of all objects and their relationships with filtering and search</CardDescription>
              </CardHeader>
              <CardContent>
                <GraphVisualization objects={filteredObjects} relationships={filteredRelationships} />
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