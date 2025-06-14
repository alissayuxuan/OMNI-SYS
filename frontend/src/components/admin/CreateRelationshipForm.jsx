import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { manageHospitalData } from '@/hooks/manageHospitalData';

export const CreateRelationshipForm = ({ isOpen, onClose, agents, refreshData }) => {
  const { toast } = useToast();
  const { createRelationship } = manageHospitalData();

  const [formData, setFormData] = useState({
    agent1: '',
    agent2: '',
    description: '',
  });

  const handleSave = async () => {
    if (formData.agent1 === formData.agent2) {
      toast({ title: "Invalid Selection", description: "An agent cannot have a relationship with themselves.", variant: "destructive" });
      return;
    }

    if (!formData.agent1 || !formData.agent2 || !formData.description) {
        toast({
          title: "Error",
          description: "Please enter all required fields.",
          variant: "destructive"
        });
        return;
      }

    try {
      await createRelationship({
        agent1: formData.agent1,
        agent2: formData.agent2,
        description: formData.description,
      });
      toast({ title: "Success", description: "Relationship created successfully." });
      refreshData();
      onClose();
    } catch (err) {
      console.error(err);
      toast({ title: "Error", description: "Failed to create relationship." });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Relationship</DialogTitle>
          <DialogDescription>Create a relationship between two agents and provide a description.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="agent1">Agent 1 *</Label>
            <Select
              value={formData.agent1}
              onValueChange={(value) => setFormData(prev => ({ ...prev, agent1: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select first agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="agent2">Agent 2 *</Label>
            <Select
              value={formData.agent2}
              onValueChange={(value) => setFormData(prev => ({ ...prev, agent2: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select second agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map(agent => (
                  <SelectItem key={agent.id} value={agent.id}>{agent.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Description *</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter relationship description"
            />
          </div>

          <Button onClick={handleSave} className="w-full">
            Create Relationship
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
