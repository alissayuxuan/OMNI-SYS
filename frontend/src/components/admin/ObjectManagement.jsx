import { useState } from 'react';
import { useHospitalData } from '@/hooks/useHospitalData';
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

export const ObjectManagement = () => {
  const { objects, deleteObject } = useHospitalData();
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingObject, setEditingObject] = useState(null);
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const handleDeleteObject = (objectId) => {
    deleteObject(objectId);
    toast({
      title: "Success",
      description: "Object deleted successfully"
    });
  };

  const handleEditObject = (object) => {
    setEditingObject(object);
    setIsEditDialogOpen(true);
  };

  const filteredObjects = objects.filter(obj => {
    const matchesType = filterType === 'all' || obj.type === filterType;
    const matchesSearch = obj.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         obj.category.toLowerCase().includes(searchTerm.toLowerCase());
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
              <TableRow key={object.id}>
                <TableCell className="font-medium">{object.name}</TableCell>
                <TableCell>
                  <Badge className={getObjectTypeColor(object.type)}>
                    {object.type}
                  </Badge>
                </TableCell>
                <TableCell>{object.category}</TableCell>
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
                      onClick={() => handleDeleteObject(object.id)}
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
        />

        <EditObjectForm
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          object={editingObject}
        />
      </CardContent>
    </Card>
  );
};