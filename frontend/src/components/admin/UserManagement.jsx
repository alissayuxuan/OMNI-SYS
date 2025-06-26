import { useState, useCallback, useEffect } from 'react';
import { useHospitalData } from '@/hooks/useHospitalData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Users, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { manageHospitalData } from '@/hooks/manageHospitalData';

import { CreateUserForms } from './CreateUserForms';
import { EditUserForm } from './EditUserForm';

export const UserManagement = () => {
  const { createUser, deleteUser } = useHospitalData();
  const { getAgents, getAgentProfiles, getAdminProfiles } = manageHospitalData();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingObject, setEditingObject] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [users, setUsers] = useState([]); 
  const [loading, setLoading] = useState(false);

  
  const fetchHospitalUsers = useCallback(async () => {
      setLoading(true);
      
      try {
        const [agentsRes, adminsRes] = await Promise.all([
          getAgents(),
          getAdminProfiles()
        ]);

        console.log("UserManagement - users: \n", agentsRes, "\n", adminsRes);

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
        
        setUsers([...normalizedAdmins, ...normalizedAgents]);

      } catch (err) {
        console.error("Failed to load hospital users:", err);
      } finally {
        setLoading(false);
      }
    }, []);
  
    useEffect(() => {
      fetchHospitalUsers(); // fetch on mount
    }, [fetchHospitalUsers]);
  

    // TODO
  const handleDeleteUser = (userId) => {
    deleteUser(userId);
    toast({
      title: "Success",
      description: "User deleted successfully"
    });
  };

  const handleEditObject = (object) => {
    setEditingObject(object);
    setIsEditDialogOpen(true);
  };

  const filteredUsers = users.filter(obj => {
    const matchesType = filterType === 'all' || obj.role === filterType;
    const matchesSearch = obj.name.toLowerCase().includes(searchTerm.toLowerCase())
    return matchesType && matchesSearch;
  });


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
      {/* Filters */}
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
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditObject(user)}
                      >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteUser(user.id)}
                    >
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
        refreshData={fetchHospitalUsers} //alissa
      />

      <EditUserForm
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        object={editingObject}
        refreshData={fetchHospitalUsers} //alissa
      />
    </CardContent>
  </Card>
  );



  /*return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-5 w-5" />
            <span>User Management</span>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New User</DialogTitle>
                <DialogDescription>
                  Add a new user to the system
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="user-name">Name</Label>
                  <Input
                    id="user-name"
                    value={newUser.name}
                    onChange={(e) => setNewUser(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter user name"
                  />
                </div>
                <div>
                  <Label htmlFor="user-email">Email</Label>
                  <Input
                    id="user-email"
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="user-role">Role</Label>
                  <Select value={newUser.role} onValueChange={(value) => setNewUser(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="agent">Agent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleCreateUser} className="w-full">
                  Create User
                </Button>
              </div>
            </DialogContent>
          </Dialog> 
        </CardTitle>
        <CardDescription>Manage system users and their roles</CardDescription>
      </CardHeader>
      <CardContent>
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
            {users.map((user) => (
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
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteUser(user.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );*/
};