/**
 * RelationshipForm – React Component
 *
 * A modal dialog used to create or edit relationships between two agents in the hospital system.
 * It supports both creation and update modes, with dynamic form initialization and validation.
 *
 * Features:
 * - Select two different agents and describe their relationship.
 * - Prevents selection of the same agent for both roles.
 * - Uses toast notifications for success and error feedback.
 * - Calls corresponding backend functions (`createRelationship`, `updateRelationship`) via `manageHospitalData`.
 *
 * Props:
 * - `isOpen` (boolean): Whether the dialog is currently open.
 * - `onClose` (function): Callback to close the dialog.
 * - `agents` (array): List of available agents to populate the dropdowns.
 * - `refreshData` (function): Callback to refresh data after submission.
 * - `mode` (string): Either `"create"` or `"edit"` to determine behavior and initial state.
 * - `initialData` (object): Relationship data to pre-fill the form in edit mode.
 *
 * Example usage:
 * <RelationshipForm
 *   isOpen={modalOpen}
 *   onClose={() => setModalOpen(false)}
 *   agents={agentList}
 *   refreshData={fetchRelationships}
 *   mode="edit"
 *   initialData={selectedRelationship}
 * />
 */


import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { manageHospitalData } from '@/hooks/manageHospitalData';

export const RelationshipForm = ({ isOpen, onClose, agents, refreshData, mode = 'create', initialData }) => {
  const { createRelationship, updateRelationship } = manageHospitalData();
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    agent_from: '',
    agent_to: '',
    description: '',
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData({
        agent_from: initialData.agentFrom,
        agent_to: initialData.agentTo,
        description: initialData.description,
      });
    }
  }, [mode, initialData]);

  const handleSave = async () => {
    if (!formData.agent_from || !formData.agent_to || !formData.description|| formData.agent_from === formData.agent_to) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields and select two different agents.',
        variant: 'destructive',
      });
      return;
    }

    try {
      if (mode === 'create') {
        await createRelationship({
          agent_from: formData.agent_from,
          agent_to: formData.agent_to,
          description: formData.description,
        });
        toast({ title: 'Created', description: 'Relationship created successfully.' });
      } else {
        await updateRelationship(initialData.id, {
          agent_from: formData.agent_from,
          agent_to: formData.agent_to,
          description: formData.description,
        });
        toast({ title: 'Updated', description: 'Relationship updated successfully.' });
      }
      refreshData();
      onClose();
    } catch (err) {
      toast({
        title: 'Error',
        description: err.message,
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
            <Label>Agent From</Label>
            <Select
              value={formData.agent_from}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, agent_from: value }))}
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
            <Label>Agent To</Label>
            <Select
              value={formData.agent_to}
              onValueChange={(value) => setFormData((prev) => ({ ...prev, agent_to: value }))}
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
