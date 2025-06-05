import { useHospitalData } from '@/hooks/useHospitalData';
//import { Header } from '@/components/layout/Header';
import { UserManagement } from '@/components/admin/UserManagement';
import { ObjectManagement } from '@/components/admin/ObjectManagement';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { GraphVisualization } from '@/components/graph/GraphVisualization';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Database, Network, BarChart3 } from 'lucide-react';

import { useContext } from "react";
import { UserContext } from "@/components/auth/ProtectedRoute";

export const AdminDashboard = () => {
  const { objects, relationships } = useHospitalData();

  const user = useContext(UserContext);


  const stats = {
    totalObjects: objects.length,
    agents: objects.filter(obj => obj.type === 'agent').length,
    contexts: objects.filter(obj => obj.type === 'context').length,
    spaces: objects.filter(obj => obj.type === 'space').length,
    relationships: relationships.length
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <h1>Welcome, {user?.role}</h1>
      {/*<Header />*/}
      <div className="container mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Administrator Dashboard</h2>
          <p className="text-gray-600">Manage users, objects, and system relationships</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                <BarChart3 className="h-8 w-8 text-yellow-600" />
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
            <TabsTrigger value="users">User Management</TabsTrigger>
            <TabsTrigger value="graph">System Graph</TabsTrigger>
            <TabsTrigger value="settings">Profile Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="objects">
            <ObjectManagement />
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