import { useState, useEffect } from 'react';
import { useHospitalData } from '@/hooks/useHospitalData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

export const EditUserForm = ({ isOpen, onClose, object }) => {
  const { updateObject, objects } = useHospitalData();
  const { toast } = useToast();
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (object) {
      setFormData({
        name: object.name,
        ...object.properties
      });
    }
  }, [object]);

  const handleSave = () => {
    if (!object) return;

    const { name, ...properties } = formData;
    
    updateObject(object.id, {
      name,
      properties
    });

    toast({
      title: "Success",
      description: "Object updated successfully"
    });

    onClose();
  };

  if (!object) return null;

  const spaces = objects.filter(obj => obj.type === 'space');

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
          <div>
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              value={formData.name || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={object.name}
            />
          </div>

          {/* Agent-specific fields */}
          {object.type === 'agent' && (
            <>
              <div>
                <Label htmlFor="edit-username">Username</Label>
                <Input
                  id="edit-username"
                  value={formData.username || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                />
              </div>
              
            </>
          )}

          {/* Context-specific fields */}
          {object.type === 'context' && (
            <>
              
              <div>
                <Label htmlFor="edit-time">Time</Label>
                <Input
                  id="edit-time"
                  type="datetime-local"
                  value={formData.time ? new Date(formData.time).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="edit-space">Space</Label>
                <Select 
                  value={formData.spaceId || 'none'} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, spaceId: value === 'none' ? undefined : value }))}
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
            </>
          )}

          {/* Space-specific fields */}
          {object.type === 'space' && (
            <div>
              <Label htmlFor="edit-extra-info">Extra Information</Label>
              <Textarea
                id="edit-extra-info"
                value={formData.extraInfo || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, extraInfo: e.target.value }))}
              />
            </div>
          )}

          {/* Additional properties */}
          {Object.entries(formData).map(([key, value]) => {
            if (['name', 'category', 'username', 'password', 'agentRole', 'description', 'time', 'spaceId', 'extraInfo', 'participantIds'].includes(key)) {
              return null;
            }
            return (
              <div key={key}>
                <Label htmlFor={`edit-${key}`}>{key}</Label>
                <Input
                  id={`edit-${key}`}
                  value={String(value) || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, [key]: e.target.value }))}
                />
              </div>
            );
          })}

          <Button onClick={handleSave} className="w-full">
            Save Changes
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};