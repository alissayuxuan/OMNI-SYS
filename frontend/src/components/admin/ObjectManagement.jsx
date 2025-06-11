import { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Database } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CreateObjectForms } from './CreateObjectForms';
import { EditObjectForm } from './EditObjectForm';

import { manageHospitalData } from "@/hooks/manageHospitalData";


export const ObjectManagement = () => {
  //const { objects, deleteObject } = useHospitalData();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingObject, setEditingObject] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  //alissa
  const [loading, setLoading] = useState(false)
  const {getAgents, getContexts, getSpaces, deleteAgent, deleteContext, deleteSpace} = manageHospitalData();
  const [agents, setAgents] = useState([]);
  const [contexts, setContexts] = useState([]);
  const [spaces, setSpaces] = useState([]);

  const [allObjects, setAllObjects] = useState([]);

  
  const fetchHospitalData = useCallback(async () => {
    setLoading(true);
    
    try {
      const [agentsRes, contextsRes, spacesRes] = await Promise.all([
        getAgents(),
        getContexts(),
        getSpaces()
      ]);
      //console.log("agentsRes: \n", agentsRes)
      //console.log("contextsRes: \n", contextsRes)
      //console.log("spacesRes: \n", spacesRes)      

      const normalizedAgents = agentsRes.results.map(agent => ({
        id: agent.id,
        name: agent.name,
        type: "agent",
        createdAt: agent.created_at,
      }));

      const normalizedContexts = contextsRes.results.map(context => ({
        id: context.id,
        name: context.name,
        type: "context",
        createdAt: context.created_at,
      }));
  
      const normalizedSpaces = spacesRes.results.map(space => ({
        id: space.id,
        name: space.name,
        type: "space",
        createdAt: space.created_at,
      }));
      setAgents(normalizedAgents);
      setContexts(normalizedContexts);
      setSpaces(normalizedSpaces);

      setAllObjects([...normalizedAgents, ...normalizedContexts, ...normalizedSpaces]);

    } catch (err) {
      console.error("Failed to load hospital data:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHospitalData(); // fetch on mount
  }, [fetchHospitalData]);
  

  const handleDeleteObject = async(object) => {
    console.log("delete - object: ", object)

    try {
      let deletedObj = null;

      if (object.type === "agent") {
        console.log("delete agent")
        deletedObj = await deleteAgent(object.id);
      } 
      else if (object.type === "context") {
        deletedObj = await deleteContext(object.id);
      }
      else if (object.type === "space") {
        deletedObj = await deleteSpace(object.id);
      }

      toast({
        title: "Success",
        description: "Object deleted successfully"
      });
      
      console.log("Object deleted:", deletedObj);
      fetchHospitalData();

    } catch(err) {
      console.error("Error:", err);
      alert("An error occured");
      toast({
        title: "Error",
        description: "An error occured"
      });
    } 
    
  };

  const handleEditObject = (object) => {
    setEditingObject(object);
    setIsEditDialogOpen(true);
  };

  const filteredObjects = allObjects.filter(obj => {
    const matchesType = filterType === 'all' || obj.type === filterType;
    const matchesSearch = obj.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch;
  });

  const getObjectTypeColor = (type) => {
    switch (type) {
      case 'agent': return 'bg-blue-100 text-blue-800';
      case 'context': return 'bg-green-100 text-green-800';
      case 'space': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Database className="h-5 w-5" />
            <span>Object Management</span>
          </div>
          <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Object
          </Button>
        </CardTitle>
        <CardDescription>Manage hospital objects (agents, contexts, spaces)</CardDescription>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        <div className="flex space-x-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search objects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="agent">Agents</SelectItem>
              <SelectItem value="context">Contexts</SelectItem>
              <SelectItem value="space">Spaces</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredObjects.map((object) => (
              <TableRow key={`${object.type}-${object.id}`}>
                <TableCell className="font-medium">{object.name}</TableCell>
                <TableCell>
                  <Badge className={getObjectTypeColor(object.type)}>
                    {object.type}
                  </Badge>
                </TableCell>
                <TableCell>{object.id}</TableCell>
                <TableCell>{new Date(object.createdAt).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditObject(object)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteObject(object)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <CreateObjectForms 
          isOpen={isCreateDialogOpen}
          onClose={() => setIsCreateDialogOpen(false)}
          refreshData={fetchHospitalData} //alissa
          agents={agents}
          spaces={spaces}
        />

        <EditObjectForm
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          object={editingObject}
          refreshData={fetchHospitalData} //alissa
        />
      </CardContent>
    </Card>
  );
};