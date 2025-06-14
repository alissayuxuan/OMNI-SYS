import { useState, useCallback, useEffect } from 'react';
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
//import { EditUserForm } from './EditUserForm';

export const UserManagement = () => {
  const { getAgents, getAdminProfiles } = manageHospitalData();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  //const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  //const [editingObject, setEditingObject] = useState(null);
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
    //deleteUser(userId);
    toast({
      title: "Success",
      description: "User deleted successfully"
    });
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
    </CardContent>
  </Card>
  );
};