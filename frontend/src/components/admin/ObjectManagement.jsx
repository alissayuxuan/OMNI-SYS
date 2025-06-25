import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Database, Archive, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { CreateObjectForms } from './CreateObjectForms';
import { EditObjectForm } from './EditObjectForm';
import { manageHospitalData } from '@/hooks/manageHospitalData';
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export const ObjectManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingObject, setEditingObject] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, object: null, type: null });

  const { getAgents, getContexts, getSpaces, /*getAllAgents, getAllContexts, getAllSpaces,*/ deleteAgent, deleteContext, deleteSpace, archive, unarchive } = manageHospitalData();

  const { data: agentsRes = { results: [] }, isLoading: loadingAgents } = useQuery({
    queryKey: ['agents', showAll],
    queryFn: () => (showAll ? getAgents({ archived: 'true' }) : getAgents({ archived: 'false' })),
  });    

  const { data: contextsRes = { results: [] }, isLoading: loadingContexts } = useQuery({
    queryKey: ['contexts', showAll],
    queryFn: () => (showAll ? getContexts({ archived: 'true' }) : getContexts({ archived: 'false' })),
  });
  
  const { data: spacesRes = { results: [] }, isLoading: loadingSpaces } = useQuery({
    queryKey: ['spaces', showAll],
    queryFn: () => (showAll ? getSpaces({ archived: 'true' }) : getSpaces({ archived: 'false' })),
  });


  const agents = useMemo(() => agentsRes.results.map(agent => ({
    id: agent.id,
    name: agent.name,
    type: "agent",
    createdAt: agent.created_at,
    archived: agent.is_archived,
  })), [agentsRes]);

  const contexts = useMemo(() => contextsRes.results.map(context => ({
    id: context.id,
    name: context.name,
    type: "context",
    createdAt: context.created_at,
    time: context.time,
    spaceId: context.space_id,
    participantIds: context.agent_ids,
    archived: context.is_archived,
  })), [contextsRes]);

  const spaces = useMemo(() => spacesRes.results.map(space => ({
    id: space.id,
    name: space.name,
    type: "space",
    createdAt: space.created_at,
    capacity: space.capacity,
    archived: space.is_archived,
  })), [spacesRes]);

  const allObjects = [...agents, ...contexts, ...spaces];

  const handleDeleteObject = async (object) => {
    try {
      if (object.type === "agent") await deleteAgent(object.id);
      else if (object.type === "context") await deleteContext(object.id);
      else if (object.type === "space") await deleteSpace(object.id);

      toast({ title: "Success", description: "Object successfully deleted" });

      queryClient.invalidateQueries({queryKey: ['agents']});
      queryClient.invalidateQueries({queryKey: ['contexts']});
      queryClient.invalidateQueries({queryKey: ['spaces']});
    } catch (err) {
      console.error("Error:", err);
      toast({ title: "Error", description: err.message, variant: 'destructive'  });
    }
  };

  const handleEditObject = (object) => {
    setEditingObject(object);
    setIsEditDialogOpen(true);
  };

  const handleArchiveObject = async (object) => {
    try {
      if (object.archived) {
        await unarchive(object.type + "s", object.id);
      } else {
        await archive(object.type + "s", object.id);
      }
  
      toast({
        title: "Success",
        description: `Object successfully ${object.archived ? 'unarchived' : 'archived'}`
      });
  
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      queryClient.invalidateQueries({ queryKey: ['contexts'] });
      queryClient.invalidateQueries({ queryKey: ['spaces'] });
    } catch (err) {
      console.error("Error:", err);
      toast({ title: "Error", description: err.message, variant: 'destructive' });
    }
  };
  

  const handleConfirm = async () => {
    if (confirmDialog.type === 'delete') await handleDeleteObject(confirmDialog.object);
    else if (confirmDialog.type === 'archive') await handleArchiveObject(confirmDialog.object);
    setConfirmDialog({ open: false, object: null, type: null });
  };

  const filteredObjects = allObjects.filter(obj => {
    const matchesType = filterType === 'all' || obj.type === filterType;
    const matchesSearch = obj.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  const getObjectTypeColor = (object) => {
    if (object.archived) {
      return 'bg-gray-100 text-gray-800'
    }
    switch (object.type) {
      case 'agent': return 'bg-blue-100 text-blue-800';
      case 'context': return 'bg-green-100 text-green-800';
      case 'space': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loadingAgents || loadingContexts || loadingSpaces) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground text-sm">Loading hospital data...</span>
      </div>
    );
  } else {
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
                <TableHead>Id</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredObjects.map((object) => (
                <TableRow key={`${object.type}-${object.id}`}>
                  <TableCell className="font-medium">{object.name}</TableCell>
                  <TableCell>
                    <Badge className={getObjectTypeColor(object)}>
                      {object.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{object.id}</TableCell>
                  <TableCell>{new Date(object.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleEditObject(object)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      {/*<Button variant="outline" size="sm" onClick={() => setConfirmDialog({ open: true, object, type: 'archive' })}>
                        <Archive className="h-4 w-4" />
                      </Button>*/}
                      <Button variant="outline" size="sm" onClick={() => setConfirmDialog({ open: true, object, type: 'archive' })}
                      >
                        {object.archived ? <Archive className="h-4 w-4 text-yellow-600" /> : <Archive className="h-4 w-4" />}
                      </Button>

                      <Button variant="destructive" size="sm" onClick={() => setConfirmDialog({ open: true, object, type: 'delete' })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="mt-6 text-center">
            <Button onClick={() => setShowAll(prev => !prev)} variant="ghost">
              {showAll ? "Show relevant objects" : "Show all objects"}
            </Button>
          </div>

          <CreateObjectForms 
            isOpen={isCreateDialogOpen}
            onClose={() => setIsCreateDialogOpen(false)}
            refreshData={() => {
              queryClient.invalidateQueries({queryKey: ['agents']});
              queryClient.invalidateQueries({queryKey: ['contexts']});
              queryClient.invalidateQueries({queryKey: ['spaces']});
            }}
            agents={agents}
            spaces={spaces}
          />

          <EditObjectForm
            isOpen={isEditDialogOpen}
            onClose={() => setIsEditDialogOpen(false)}
            object={editingObject}
            refreshData={() => {
              queryClient.invalidateQueries({queryKey: ['agents']});
              queryClient.invalidateQueries({queryKey: ['contexts']});
              queryClient.invalidateQueries({queryKey: ['spaces']});
            }}
            agents={agents}
            spaces={spaces}
          />

          <Dialog open={confirmDialog.open} onOpenChange={() => setConfirmDialog({ open: false, object: null, type: null })}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{confirmDialog.type === 'delete' ? 'Delete Object' : 'Archive Object'}</DialogTitle>
              </DialogHeader>
              <DialogDescription>Are you sure you want to {confirmDialog.type} this object?</DialogDescription>
              <DialogFooter className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setConfirmDialog({ open: false, id: null, type: null })}>Cancel</Button>
                <Button variant={confirmDialog.type === 'delete' ? 'destructive' : 'default'} onClick={handleConfirm}>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    );
  };
}