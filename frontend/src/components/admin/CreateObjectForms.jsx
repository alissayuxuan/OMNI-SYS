import { useState } from 'react';
import { useHospitalData } from '@/hooks/useHospitalData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

export const CreateObjectForms = ({ isOpen, onClose }) => {
  const { createObject, objects } = useHospitalData();
  const { toast } = useToast();

  // Form states for different object types
  const [agentForm, setAgentForm] = useState({
    name: '',
    username: '',
    password: '',
    agentRole: '',
    category: 'doctor'
  });

  const [contextForm, setContextForm] = useState({
    name: '',
    description: '',
    time: '',
    spaceId: 'none',
    participantIds: [],
    category: 'surgery'
  });

  const [spaceForm, setSpaceForm] = useState({
    name: '',
    extraInfo: '',
    category: 'surgery-room'
  });

  const resetForms = () => {
    setAgentForm({ name: '', username: '', password: '', agentRole: '', category: 'doctor' });
    setContextForm({ name: '', description: '', time: '', spaceId: 'none', participantIds: [], category: 'surgery' });
    setSpaceForm({ name: '', extraInfo: '', category: 'surgery-room' });
  };

  const handleCreateAgent = () => {
    if (!agentForm.name || !agentForm.username || !agentForm.password || !agentForm.agentRole) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    createObject({
      name: agentForm.name,
      type: 'agent',
      category: agentForm.category,
      properties: {
        username: agentForm.username,
        password: agentForm.password,
        agentRole: agentForm.agentRole
      }
    });

    toast({
      title: "Success",
      description: "Agent created successfully"
    });

    resetForms();
    onClose();
  };

  const handleCreateContext = () => {
    if (!contextForm.name || !contextForm.description || !contextForm.time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    createObject({
      name: contextForm.name,
      type: 'context',
      category: contextForm.category,
      properties: {
        description: contextForm.description,
        time: contextForm.time,
        spaceId: contextForm.spaceId === 'none' ? undefined : contextForm.spaceId,
        participantIds: contextForm.participantIds
      }
    });

    toast({
      title: "Success",
      description: "Context created successfully"
    });

    resetForms();
    onClose();
  };

  const handleCreateSpace = () => {
    if (!spaceForm.name) {
      toast({
        title: "Error",
        description: "Please enter a space name",
        variant: "destructive"
      });
      return;
    }

    createObject({
      name: spaceForm.name,
      type: 'space',
      category: spaceForm.category,
      properties: {
        extraInfo: spaceForm.extraInfo
      }
    });

    toast({
      title: "Success",
      description: "Space created successfully"
    });

    resetForms();
    onClose();
  };

  const agents = objects.filter(obj => obj.type === 'agent');
  const spaces = objects.filter(obj => obj.type === 'space');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Object</DialogTitle>
          <DialogDescription>
            Create a new agent, context, or space in the hospital system
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="agent" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="agent">Agent</TabsTrigger>
            <TabsTrigger value="context">Context</TabsTrigger>
            <TabsTrigger value="space">Space</TabsTrigger>
          </TabsList>

          <TabsContent value="agent" className="space-y-4">
            <div>
              <Label htmlFor="agent-name">Name *</Label>
              <Input
                id="agent-name"
                value={agentForm.name}
                onChange={(e) => setAgentForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter agent name"
              />
            </div>
            <div>
              <Label htmlFor="agent-username">Username *</Label>
              <Input
                id="agent-username"
                value={agentForm.username}
                onChange={(e) => setAgentForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username"
              />
            </div>
            <div>
              <Label htmlFor="agent-password">Password *</Label>
              <Input
                id="agent-password"
                type="password"
                value={agentForm.password}
                onChange={(e) => setAgentForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
              />
            </div>
            <div>
              <Label htmlFor="agent-role">Agent Role *</Label>
              <Input
                id="agent-role"
                value={agentForm.agentRole}
                onChange={(e) => setAgentForm(prev => ({ ...prev, agentRole: e.target.value }))}
                placeholder="e.g., doctor, nurse, patient, device"
              />
            </div>
            <div>
              <Label htmlFor="agent-category">Category</Label>
              <Select value={agentForm.category} onValueChange={(value) => setAgentForm(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="doctor">Doctor</SelectItem>
                  <SelectItem value="nurse">Nurse</SelectItem>
                  <SelectItem value="patient">Patient</SelectItem>
                  <SelectItem value="device">Device</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateAgent} className="w-full">
              Create Agent
            </Button>
          </TabsContent>

          <TabsContent value="context" className="space-y-4">
            <div>
              <Label htmlFor="context-name">Name *</Label>
              <Input
                id="context-name"
                value={contextForm.name}
                onChange={(e) => setContextForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter context name"
              />
            </div>
            <div>
              <Label htmlFor="context-description">Description *</Label>
              <Textarea
                id="context-description"
                value={contextForm.description}
                onChange={(e) => setContextForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Describe the context"
              />
            </div>
            <div>
              <Label htmlFor="context-time">Time *</Label>
              <Input
                id="context-time"
                type="datetime-local"
                value={contextForm.time}
                onChange={(e) => setContextForm(prev => ({ ...prev, time: e.target.value }))}
              />
            </div>
            <div>
              <Label htmlFor="context-space">Space</Label>
              <Select value={contextForm.spaceId} onValueChange={(value) => setContextForm(prev => ({ ...prev, spaceId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a space" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No space selected</SelectItem>
                  {spaces.map(space => (
                    <SelectItem key={space.id} value={space.id}>{space.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="context-category">Category</Label>
              <Select value={contextForm.category} onValueChange={(value) => setContextForm(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="surgery">Surgery</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="diagnostic">Diagnostic</SelectItem>
                  <SelectItem value="treatment">Treatment</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateContext} className="w-full">
              Create Context
            </Button>
          </TabsContent>

          <TabsContent value="space" className="space-y-4">
            <div>
              <Label htmlFor="space-name">Name *</Label>
              <Input
                id="space-name"
                value={spaceForm.name}
                onChange={(e) => setSpaceForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Enter space name"
              />
            </div>
            <div>
              <Label htmlFor="space-extra-info">Extra Information</Label>
              <Textarea
                id="space-extra-info"
                value={spaceForm.extraInfo}
                onChange={(e) => setSpaceForm(prev => ({ ...prev, extraInfo: e.target.value }))}
                placeholder="Additional information about the space"
              />
            </div>
            <div>
              <Label htmlFor="space-category">Category</Label>
              <Select value={spaceForm.category} onValueChange={(value) => setSpaceForm(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="surgery-room">Surgery Room</SelectItem>
                  <SelectItem value="patient-room">Patient Room</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="diagnostic">Diagnostic</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="laboratory">Laboratory</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleCreateSpace} className="w-full">
              Create Space
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};