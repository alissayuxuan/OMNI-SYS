import { useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { manageHospitalData } from '@/hooks/manageHospitalData';
import { CreateUserForms } from './CreateUserForms';
import { Dialog, DialogContent, DialogHeader, DialogDescription, DialogTitle, DialogFooter } from '@/components/ui/dialog';


export const UserManagement = () => {
  const { getAgents, getAdminProfiles, deleteAgent, deleteAdminProfile } = manageHospitalData();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [confirmDialog, setConfirmDialog] = useState({ open: false, object: null });


  const { data: agentsRes = { results: [] }, isLoading: loadingAgents } = useQuery({ queryKey: ['agents'], queryFn: getAgents });
  const { data: adminsRes = [], isLoading: loadingAdmins } = useQuery({ queryKey: ['admins'], queryFn: getAdminProfiles });

  const users = useMemo(() => {
    const normalizedAdmins = adminsRes.map(admin => ({
      id: admin.id,
      name: admin.first_name + " " + admin.last_name,
      email: admin.email,
      role: "admin",
      createdAt: admin.user.date_joined,
    }));

    const normalizedAgents = agentsRes.results.map(agent => ({
      id: agent.id,
      name: agent.name,
      email: "-",
      role: "agent",
      createdAt: agent.created_at,
    }));

    return [...normalizedAdmins, ...normalizedAgents];
  }, [agentsRes, adminsRes]);

  const handleDeleteUser = async (user) => {
    try {
      if (user.role === 'admin') {
        await deleteAdminProfile(user.id);
      } else {
        await deleteAgent(user.id);
      }
      toast({ title: "Success", description: "User deleted successfully" });
      queryClient.invalidateQueries({queryKey: ['agents']});
      queryClient.invalidateQueries({queryKey: ['admins']});
    } catch (error) {
      toast({ title: "Error", description: error.message || "Failed to delete user", variant: "destructive" });
    }
  };

  const handleConfirm = async () => {
    await handleDeleteUser(confirmDialog.object);
    setConfirmDialog({ open: false, object: null });
  };

  const filteredUsers = users.filter(obj => {
    const matchesType = filterType === 'all' || obj.role === filterType;
    const matchesSearch = obj.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });


  if (loadingAgents || loadingAdmins) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground text-sm">Loading hospital user...</span>
      </div>
    );
  } else {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>User Management</span>
            </div>
            <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </CardTitle>
          <CardDescription>Manage system users and their roles</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-4 mb-6">
            <div className="flex-1">
              <Input
                placeholder="Search user..."
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
                <SelectItem value="admin">Admins</SelectItem>
                <SelectItem value="agent">Agents</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={`${user.role}-${user.id}`}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                      {user.role}
                    </Badge>
                  </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button variant="destructive" size="sm" onClick={() => setConfirmDialog({ open: true, object: user })}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <CreateUserForms
            isOpen={isCreateDialogOpen}
            onClose={() => setIsCreateDialogOpen(false)}
            refreshData={() => {
              queryClient.invalidateQueries({queryKey: ['agents']});
              queryClient.invalidateQueries({queryKey: ['admins']});
            }}
          />

          <Dialog open={confirmDialog.open} onOpenChange={() => setConfirmDialog({ open: false, object: null })}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{'Delete User'}</DialogTitle>
              </DialogHeader>
              <DialogDescription>Are you sure you want to delete this User?</DialogDescription>
              <DialogFooter className="flex justify-end space-x-2 mt-4">
                <Button variant="outline" onClick={() => setConfirmDialog({ open: false, object: null })}>Cancel</Button>
                <Button variant='destructive' onClick={handleConfirm}>Confirm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>


        </CardContent>
      </Card>
    );
  };
};