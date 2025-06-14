import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users, Edit, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { manageHospitalData } from '@/hooks/manageHospitalData';
import { CreateRelationshipForm } from './CreateRelationshipForm';
import { RelationshipForm } from './RelationshipForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export const RelationshipManagement = () => {
  const { getRelationships, deleteRelationship, getAgents } = manageHospitalData();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [searchTerm, setSearchTerm] = useState('');
  const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null, type: null });
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingObject, setEditingObject] = useState(null);
  const [actionMode, setActionMode] = useState(null); // 'create' or 'edit'

  const { data: relationshipsRes = [], isLoading: loadingRelationships } = useQuery({ queryKey: ['relationships'], queryFn: getRelationships });
  const { data: agentList = { results: [] }, isLoading: loadingAgents } = useQuery({ queryKey: ['agents'], queryFn: getAgents });

  const agentMap = useMemo(() => {
    return new Map(agentList.results.map(a => [a.id, a.name]));
  }, [agentList]);

  const relationships = useMemo(() => {
    return relationshipsRes.map(rel => ({
      id: rel.id,
      agent1: agentMap.get(rel.agent1) || rel.agent1,
      agent2: agentMap.get(rel.agent2) || rel.agent2,
      description: rel.description,
      createdAt: rel.created_at
    }));
  }, [relationshipsRes, agentMap]);

  const handleCreateObject = () => {
    setEditingObject(null);
    setActionMode('create');
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    try {
      await deleteRelationship(id);
      toast({ title: "Deleted", description: "Relationship deleted successfully" });
      queryClient.invalidateQueries(['relationships']);
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete relationship" });
    }
  };

  const handleConfirm = async () => {
    if (confirmDialog.type === 'delete') {
      await handleDelete(confirmDialog.id);
    } 
    setConfirmDialog({ open: false, id: null, type: null });
  };

  const handleEditObject = (object) => {
    setEditingObject(object);
    setActionMode('edit');
    setIsFormOpen(true);
  };

  const filtered = relationships.filter(r => {
    return (
      r.agent1.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.agent2.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });


  if (loadingAgents || loadingRelationships) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground text-sm">Loading hospital relationships...</span>
      </div>
    );
  } else {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>Relationship Management</span>
            </div>
            <Button size="sm" onClick={handleCreateObject}> 
              <Plus className="h-4 w-4 mr-2" />
              Add Relationship
            </Button>
          </CardTitle>
          <CardDescription>View and manage relationships between agents</CardDescription>
        </CardHeader>

        <CardContent>
          <div className="flex space-x-4 mb-6">
            <Input
              placeholder="Search relationships..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Agent From</TableHead>
                <TableHead>Agent To</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(rel => (
                <TableRow key={rel.id}>
                  <TableCell>{rel.agent1}</TableCell>
                  <TableCell>{rel.agent2}</TableCell>
                  <TableCell>{rel.description}</TableCell>
                  <TableCell>{new Date(rel.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditObject(rel)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setConfirmDialog({ open: true, id: rel.id, type: 'delete' })}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <RelationshipForm
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
            agents={agentList.results}
            refreshData={() => queryClient.invalidateQueries(['relationships'])}
            mode={actionMode}
            initialData={editingObject}
          />

          <Dialog open={confirmDialog.open} onOpenChange={() => setConfirmDialog({ open: false, object: null, type: null })}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{`Delete Relationship`}</DialogTitle>
              </DialogHeader>
              <p>Are you sure you want to {confirmDialog.type} this relationship?</p>
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
};









/*import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Users, Edit, Archive } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { manageHospitalData } from '@/hooks/manageHospitalData';
import { CreateRelationshipForm } from './CreateRelationshipForm';
import { RelationshipForm } from './RelationshipForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';

export const RelationshipManagement = () => {
  const { getRelationships, deleteRelationship, getAgents } = manageHospitalData();
  const { toast } = useToast();

  const [relationships, setRelationships] = useState([]);
  const [agents, setAgents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  //const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState({ open: false, id: null, type: null });

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingObject, setEditingObject] = useState(null);
  const [actionMode, setActionMode] = useState(null); // 'create' or 'edit'

  const fetchRelationships = useCallback(async () => {
    try {
      const rels = await getRelationships();
      const agentList = await getAgents();
      const agentMap = new Map(agentList.results.map(a => [a.id, a.name]));

      const normalized = rels.map(rel => ({
        id: rel.id,
        agent1: agentMap.get(rel.agent1) || rel.agent1,
        agent2: agentMap.get(rel.agent2) || rel.agent2,
        description: rel.description,
        createdAt: rel.created_at
      }));

      setRelationships(normalized);
      setAgents(agentList.results);
    } catch (err) {
      console.error("Failed to load relationships:", err);
    }
  }, []);

  useEffect(() => {
    fetchRelationships();
  }, [fetchRelationships]);

  const handleCreateObject = () => {
    setEditingObject(null);
    setActionMode('create');
    setIsFormOpen(true);
  }

  const handleDelete = async (id) => {
    try {
      await deleteRelationship(id);
      toast({ title: "Deleted", description: "Relationship deleted successfully" });
      fetchRelationships();
    } catch (err) {
      toast({ title: "Error", description: "Failed to delete relationship" });
    }
  };

  const handleConfirm = async () => {
    if (confirmDialog.type === 'delete') {
      await handleDelete(confirmDialog.id);
    } else if (confirmDialog.type === 'archive') {
      // archive logic placeholder
      toast({ title: "Archived", description: "Relationship archived (not implemented)" });
    }
    setConfirmDialog({ open: false, id: null, type: null });
  };

  const handleEditObject = (object) => {
    setEditingObject(object);
    setActionMode('edit');
    setIsFormOpen(true);
  };

  const filtered = relationships.filter(r => {
    return (
      r.agent1.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.agent2.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.description.toLowerCase().includes(searchTerm.toLowerCase())
    );
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>Relationship Management</span>
          </div>
          <Button size="sm" onClick={() => handleCreateObject()  /*setIsCreateDialogOpen(true)/  }> 
            <Plus className="h-4 w-4 mr-2" />
            Add Relationship
          </Button>
        </CardTitle>
        <CardDescription>View and manage relationships between agents</CardDescription>
      </CardHeader>

      <CardContent>
        <div className="flex space-x-4 mb-6">
          <Input
            placeholder="Search relationships..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Agent From</TableHead>
              <TableHead>Agent To</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(rel => (
              <TableRow key={rel.id}>
                <TableCell>{rel.agent1}</TableCell>
                <TableCell>{rel.agent2}</TableCell>
                <TableCell>{rel.description}</TableCell>
                <TableCell>{new Date(rel.createdAt).toLocaleDateString()}</TableCell>
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
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDialog({ open: true, id: rel.id, type: 'archive' })}
                    >
                      <Archive className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setConfirmDialog({ open: true, id: rel.id, type: 'delete' })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <RelationshipForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        agents={agents}
        refreshData={fetchRelationships}
        mode={actionMode}
        initialData={editingObject}
        />

        <Dialog open={confirmDialog.open} onOpenChange={() => setConfirmDialog({ open: false, id: null, type: null })}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{confirmDialog.type === 'delete' ? 'Delete Relationship' : 'Archive Relationship'}</DialogTitle>
            </DialogHeader>
            <p>Are you sure you want to {confirmDialog.type} this relationship?</p>
            <DialogFooter className="flex justify-end space-x-2 mt-4">
              <Button variant="outline" onClick={() => setConfirmDialog({ open: false, id: null, type: null })}>Cancel</Button>
              <Button variant={confirmDialog.type === 'delete' ? 'destructive' : 'default'} onClick={handleConfirm}>Confirm</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};*/