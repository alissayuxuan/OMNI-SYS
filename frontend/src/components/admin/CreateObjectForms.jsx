import { useState } from 'react';
import { useHospitalData } from '@/hooks/useHospitalData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { X } from 'lucide-react';
import { manageHospitalData } from '@/hooks/manageHospitalData'

export const CreateObjectForms = ({ isOpen, onClose, refreshData, agents, spaces }) => {
  const {createAgent, createContext, createSpace } = manageHospitalData();
  const { toast } = useToast();

  const [isCreating, setIsCreating] = useState(false); // TODO


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
    console.log("handleCreateAgent")
    if (!agentForm.agent_name || !agentForm.username || !agentForm.password) {
      console.log("agent_name: ", !agentForm.agent_name, "username: ", !agentForm.username, "password: ", !agentForm.password)
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log("creating agent")
      const createdAgent = await createAgent(agentForm);

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
    console.log("contextForm: ", contextForm)
    console.log("spaceID: ", contextForm.spaceId)
    console.log("participants: ", contextForm.participantIds)
    
    if (!contextForm.name || !contextForm.time || !contextForm.spaceId || !contextForm.participantIds) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {  
      // Umwandlung datetime-local in ISO string mit 'Z'
      const scheduled = new Date(contextForm.time).toISOString().split('.')[0] + 'Z';//new Date(contextForm.time).toISOString();
  
      const payload = {
        name: contextForm.name.trim(),
        scheduled,
        space_id: Number(contextForm.spaceId),
        agent_ids: contextForm.participantIds.map(id => Number(id)),
      };

      console.log("payload: \n", payload)
  
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
    console.log("handleCreateSpace")
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
      const createdSpace = await createSpace(spaceForm);

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
              {/* TODO: generate password function */}
              <Label htmlFor="agent-password">Password *</Label>
              <Input
                id="agent-password"
                type="password"
                value={agentForm.password}
                onChange={(e) => setAgentForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
              />
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