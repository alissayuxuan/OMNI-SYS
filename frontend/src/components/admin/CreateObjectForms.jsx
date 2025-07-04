/**
 * CreateObjectForms – React Component
 *
 * A dynamic modal component for creating new entities in a hospital system:
 * - Agents (users with authentication)
 * - Contexts (scheduled events with participants and optional space)
 * - Spaces (rooms with a capacity)
 *
 * Features:
 * - Uses tabs to switch between different creation forms (Agent, Context, Space).
 * - Handles input validation, submission feedback, and error handling via toasts.
 * - Generates secure random passwords for agents (optional).
 * - Uses controlled form states and resets on close or after creation.
 * - Provides inline form validation and user feedback.
 *
 * Props:
 * - `isOpen` (boolean): Whether the dialog is open.
 * - `onClose` (function): Function to close the dialog.
 * - `refreshData` (function): Callback to trigger a data refresh after successful creation.
 * - `agents` (array): List of available agents (used in context participant selection).
 * - `spaces` (array): List of available spaces (used in context form).
 *
 * Dependencies:
 * - `manageHospitalData()` for API interaction (createAgent, createContext, createSpace)
 * - `useToast()` for toast notifications
 * - Custom UI components (Dialog, Tabs, Input, Button, etc.)
 *
 * Example:
 * <CreateObjectForms
 *   isOpen={modalOpen}
 *   onClose={() => setModalOpen(false)}
 *   refreshData={loadData}
 *   agents={agentList}
 *   spaces={spaceList}
 * />
 */



import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { X, Eye, EyeOff } from 'lucide-react';
import { manageHospitalData } from '@/hooks/manageHospitalData'

export const CreateObjectForms = ({ isOpen, onClose, refreshData, agents, spaces }) => {
  const {createAgent, createContext, createSpace } = manageHospitalData();
  const { toast } = useToast();

  const [isCreating, setIsCreating] = useState(false); 
  const [showPassword, setShowPassword] = useState(false);

  // Form states for different object types
  const [agentForm, setAgentForm] = useState({
    agent_name: '',
    username: '',
    password: '',
    role: 'agent'
  });

  const [contextForm, setContextForm] = useState({
    name: '',
    time: '',
    spaceId: 'none',
    participantIds: [],
  });

  const [spaceForm, setSpaceForm] = useState({
    name: '',
    capacity: 1
  });

  const resetForms = () => {
    setAgentForm({ agent_name: '', username: '', password: '', role: 'agent'});
    setContextForm({ name: '', time: '', spaceId: 'none', participantIds: []});
    setSpaceForm({ name: '', capacity: 1 });
  };

  const [nameError, setNameError] = useState("")


  /* Create Objects */

  const handleCreateAgent = async (e) => {
    setIsCreating(true);
    e.preventDefault();
    // TODO: name requirements check
    if (!agentForm.agent_name || !agentForm.username || !agentForm.password) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      await createAgent(agentForm);

      toast({
        title: "Successful",
        description: `Agent sucessfully created.`,
      });
      refreshData(); //refresh Hospital Page

    } catch (error){
      toast({
        title: "Error",
        description: error.message || "An error occurred while creating the agent",
        variant: "destructive"
      });      
    } finally {
      resetForms();
      onClose();
      setIsCreating(false);
    }
  };

  const handleCreateContext = async (e) => {
    setIsCreating(true);
    e.preventDefault();
    
    if (!contextForm.name || !contextForm.time || !contextForm.participantIds) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      setIsCreating(false);
      return;
    }

    try {  
      // Transform datetime-local in ISO string with 'Z'
      const scheduled = new Date(contextForm.time).toISOString().split('.')[0] + 'Z';

      const payload = {
        name: contextForm.name.trim(),
        scheduled,
        agents:  contextForm.participantIds.map(id => Number(id)),
        agent_ids: contextForm.participantIds.map(id => Number(id)),
        ...(contextForm.spaceId !== 'none' && { space_id: Number(contextForm.spaceId) })
      };

      const createdContext = await createContext(payload);

      toast({
        title: "Successful",
        description: `Context successfully created.`,
      });
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "An error occurred while creating the context",
        variant: "destructive"
      });
    } finally {
      refreshData();
      resetForms();
      onClose();
      setIsCreating(false);
    }
  };

  const handleCreateSpace = async(e) => {
    setIsCreating(true);
    e.preventDefault();

    if (!spaceForm.name || !spaceForm.capacity) {
      toast({
        title: "Error",
        description: "Please enter all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      await createSpace(spaceForm);

      toast({
        title: "Successful",
        description: `Space sucessfully created.`,
      });
  
    } catch (err) {
      toast({
        title: "Error",
        description: err.message || "An error occurred while creating the space",
        variant: "destructive"
      });
    } finally {
      refreshData();
      resetForms();
      onClose();
      setIsCreating(false);
    }
  };

  const availableParticipants = agents.filter(agent => !contextForm.participantIds.includes(agent.id));

  const addParticipant = (participantId) => {
    if (participantId && !contextForm.participantIds.includes(participantId)) {
      setContextForm(prev => ({
        ...prev,
        participantIds: [...prev.participantIds, participantId]
      }));
    }
  };

  const removeParticipant = (participantId) => {
    setContextForm(prev => ({
      ...prev,
      participantIds: prev.participantIds.filter(id => id !== participantId)
    }));
  };



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

          {/* Agent Form */}
          <TabsContent value="agent" className="space-y-4">
            <div>
              <Label htmlFor="agent-name">Name *</Label>
              <Input
                id="agent-name"
                value={agentForm.agent_name}
                onChange={(e) => {
                  const value = e.target.value;
                  const isValid = /^[a-zA-Z0-9 .'-]{2,100}$/.test(value);
                  
                  if (value !== "" && !isValid) {
                    setNameError(
                      "Name must be 2–100 characters and contain only letters, numbers, spaces, hyphens, periods, or apostrophes."
                    );
                  } else {
                    setNameError("");
                  }
                  setAgentForm(prev => ({ ...prev, agent_name: e.target.value }))
                }}
                placeholder="Enter agent name"
              />
              {nameError && <p className="text-red-500 text-sm">{nameError}</p>}
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
              <div className="flex items-center gap-2">
                {/* Password input with eye icon */}
                <div className="relative w-full">
                  <Input
                    id="agent-password"
                    type={showPassword ? 'text' : 'password'}
                    value={agentForm.password}
                    onChange={(e) => setAgentForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter or generate password"
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                    tabIndex={-1} // avoid accidentally focusing
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {/* Generate button */}
                <Button
                  type="button"
                  onClick={() => {
                    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
                    let generated = '';
                    for (let i = 0; i < 15; i++) {
                      generated += characters.charAt(Math.floor(Math.random() * characters.length));
                    }
                    setAgentForm(prev => ({ ...prev, password: generated }));
                  }}
                >
                  Generate
                </Button>
              </div>

              {/* Warning message */}
              {agentForm.password && (
                <p className="text-sm text-blue-600 mt-1">
                  Please save the password securely, it will not be shown again.
                </p>
              )}
            </div>            
            <Button onClick={handleCreateAgent} disabled={isCreating} className="w-full">
              {isCreating ? 'Creating...' : 'Create Agent'}
            </Button>
          </TabsContent>

          {/* Context Form */}
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
              <Label htmlFor="context-time">Start Time *</Label>
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
              <Label htmlFor="context-participants">Participants *</Label>
              <div className="space-y-2">
                <Select onValueChange={addParticipant}>
                  <SelectTrigger>
                    <SelectValue placeholder="Add participants" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableParticipants.map(participant => (
                      <SelectItem key={participant.id} value={participant.id}>
                        {participant.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex flex-wrap gap-2">
                  {contextForm.participantIds.map(participantId => {
                    const participant = agents.find(agent => agent.id === participantId);
                    return participant ? (
                      <Badge key={participantId} variant="secondary" className="flex items-center gap-1">
                        {participant.name}
                        <X 
                          className="h-3 w-3 cursor-pointer" 
                          onClick={() => removeParticipant(participantId)}
                        />
                      </Badge>
                    ) : null;
                  })}
                </div>
                {contextForm.participantIds.length === 0 && (
                  <p className="text-sm text-muted-foreground">At least one participant is required</p>
                )}
              </div>
            </div>

            <Button onClick={handleCreateContext} disabled={isCreating} className="w-full">
              {isCreating ? 'Creating...' : 'Create Context'}
            </Button>
          </TabsContent>

          {/* Space Form */}
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

            {/* TODO: name: min 3, unique; capacity: min 1, max 1000 */}
            <div>
              <Label htmlFor="space-capacity">Capacity</Label>
              <Input
                id="space-capacity"
                type="number"
                min="1"
                max="1000"
                value={spaceForm.capacity}
                onChange={(e) => setSpaceForm(prev => ({ ...prev, capacity: e.target.value }))}
                placeholder="Enter space capacity"
              />
            </div>
            <Button onClick={handleCreateSpace} disabled={isCreating} className="w-full">
              {isCreating ? 'Creating...' : 'Create Space'}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};