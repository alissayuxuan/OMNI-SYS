import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { manageHospitalData } from '@/hooks/manageHospitalData';

export const RelationshipForm = ({ isOpen, onClose, agents, refreshData, mode = 'create', initialData = {} }) => {
  const { createRelationship, updateRelationship } = manageHospitalData();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    agent1: '',
    agent2: '',
    description: '',
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        agent1: initialData.agent1 || '',
        agent2: initialData.agent2 || '',
        description: initialData.description || '',
      });
    }
  }, [mode, initialData]);

  const handleSave = async () => {
    if (!formData.agent1 || !formData.agent2 || !formData.description|| formData.agent1 === formData.agent2) {
      toast({
        title: 'Error',
        description: 'Please select two different agents.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (mode === 'create') {
        await createRelationship({
          agent1: formData.agent1,
          agent2: formData.agent2,
          description: formData.description,
        });
        toast({ title: 'Created', description: 'Relationship created successfully.' });
      } else {
        await updateRelationship(initialData.id, {
          agent1: formData.agent1,
          agent2: formData.agent2,
          description: formData.description,
        });
        toast({ title: 'Updated', description: 'Relationship updated successfully.' });
      }
      refreshData();
      onClose();
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to save relationship.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === 'edit' ? 'Edit Relationship' : 'Create Relationship'}</DialogTitle>
          <DialogDescription>
            {mode === 'edit' ? 'Modify the relationship between two agents' : 'Define a new relationship between two agents'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Agent 1</Label>
            <Select
              value={formData.agent1}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, agent1: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select first agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Agent 2</Label>
            <Select
              value={formData.agent2}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, agent2: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select second agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <Input
              value={formData.description}
              onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
              placeholder="Describe the relationship"
            />
          </div>

          <Button onClick={handleSave} className="w-full">
            {mode === 'edit' ? 'Save Changes' : 'Create Relationship'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
