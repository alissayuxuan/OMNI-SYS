import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { manageHospitalData } from '@/hooks/manageHospitalData';

export const EditObjectForm = ({ isOpen, onClose, object, refreshData, agents, spaces }) => {
  const { toast } = useToast();
  const { updateAgent, updateContext, updateSpace } = manageHospitalData();
  const [ isSaving, setIsSaving ] = useState(false);
  const [agentForm, setAgentForm] = useState({ name: '' });
  const [contextForm, setContextForm] = useState({
    name: '',
    time: '',
    spaceId: 'none',
    participantIds: [],
  });
  const [spaceForm, setSpaceForm] = useState({ name: '', capacity: 1 });

  useEffect(() => {
    console.log("object: ", object)
    if (object) {
      if (object.type === "agent") {
        setAgentForm({ name: object.name });
      } else if (object.type === "context") {
        const date = new Date(object.time);
        const pad = (n) => String(n).padStart(2, '0');
        const time = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
        
        setContextForm({
          name: object.name,
          time,
          spaceId: object.spaceId,
          participantIds: object.participantIds || [],
        });
      } else if (object.type === "space") {
        setSpaceForm({
          name: object.name,
          capacity: object.capacity,
        });
      }
    }
  }, [object]);

  if (!object) return null;

  const handleSave = async () => {
    setIsSaving(true);
    try {

      if (object.type === "agent") {
        await updateAgent(object.id, { name: agentForm.name });
      } else if (object.type === "context") {
        console.log("contextForm.time:", contextForm.time);
        console.log("Parsed date:", new Date(contextForm.time));

        const scheduled = new Date(contextForm.time).toISOString().split('.')[0] + 'Z';
        const payload = {
          name: contextForm.name,
          scheduled,
          agents: contextForm.participantIds,
          space_id: contextForm.spaceId,
          agent_ids: contextForm.participantIds,
        }
        console.log("UPDATE CONTEXT: \n", payload)

        await updateContext(object.id, payload);
      } else if (object.type === "space") {
        await updateSpace(object.id, {
          name: spaceForm.name,
          capacity: spaceForm.capacity,
        });
      }

      toast({ title: "Success", description: "Object updated successfully" });
    } catch (err) {
      toast({ title: "Error", description: err.message , variant: 'destructive' });
    } finally {
      onClose();
      refreshData();
      setIsSaving(false);
    }
  };

  const availableParticipants = agents.filter(agent => !contextForm.participantIds.includes(agent.id));

  const addParticipant = (participantId) => {
    if (participantId && !contextForm.participantIds.includes(participantId)) {
      setContextForm(prev => ({ ...prev, participantIds: [...prev.participantIds, participantId] }));
    }
  };

  const removeParticipant = (participantId) => {
    setContextForm(prev => ({
      ...prev,
      participantIds: prev.participantIds.filter(id => id !== participantId),
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit {object.type}</DialogTitle>
          <DialogDescription>
            Modify the properties of {object.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {object.type === 'agent' && (
            <div>
              <Label htmlFor="edit-name">Name</Label>
              <Input
                id="edit-name"
                value={agentForm.name || ''}
                onChange={(e) => setAgentForm(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
          )}

          {object.type === 'context' && (
            <>
              <div>
                <Label htmlFor="edit-name">Name</Label>
                <Input
                  id="edit-name"
                  value={contextForm.name || ''}
                  onChange={(e) => setContextForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-time">Start Time</Label>
                <Input
                  id="edit-time"
                  type="datetime-local"
                  value={contextForm.time}
                  onChange={(e) => setContextForm(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="edit-space">Space</Label>
                <Select
                  value={contextForm.spaceId || 'none'}
                  onValueChange={(value) => setContextForm(prev => ({ ...prev, spaceId: value === 'none' ? undefined : value }))}
                >
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
                <Label htmlFor="context-participants">Participants</Label>
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
            </>
          )}

          {object.type === 'space' && (
            <>
              <div>
                <Label htmlFor="space-name">Name</Label>
                <Input
                  id="space-name"
                  value={spaceForm.name || ''}
                  onChange={(e) => setSpaceForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="space-capacity">Capacity</Label>
                <Input
                  id="space-capacity"
                  type="number"
                  min="1"
                  max="1000"
                  value={spaceForm.capacity}
                  onChange={(e) => {
                    const value = e.target.value;
                    setSpaceForm(prev => ({ ...prev, capacity: value === '' ? '' : parseInt(value) }))}
                  }
                  placeholder="Enter space capacity"
                />
              </div>
            </>
          )}

          <Button onClick={handleSave} disabled={isSaving}>
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};