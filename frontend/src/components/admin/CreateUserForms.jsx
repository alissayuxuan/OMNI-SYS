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

export const CreateUserForms = ({ isOpen, onClose, refreshData }) => {
  const {createAgent, createAdmin } = manageHospitalData();
  const { toast } = useToast();

  //const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(false); // TODO


  // Form states for different object types
  const [agentForm, setAgentForm] = useState({
    agent_name: '',
    username: '',
    password: '',
    role: 'agent'
  });

  const [adminForm, setAdminForm] = useState({
    username: '',
    password: '',
    first_name: '',
    last_name: '',
    email: '',
    role: 'admin'
  });

  
  const resetForms = () => {
    setAgentForm({ agent_name: '', username: '', password: '', role: 'agent'});
    setAdminForm({ username: '', password: '', first_name: '', last_name: '', email: '', role: 'admin'});
  };

  const [nameError, setNameError] = useState("")


  /* Create Objects */

  const handleCreateAgent = async (e) => {
    setLoading(true);
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

      alert(`agent '${createdAgent.name}' created!`)
      toast({
        title: "Successful",
        description: `Context '${createdAgent.name}' created.`,
      });
      console.log("Context created:", createdAgent)
      refreshData(); //refresh Hospital Page

    } catch (error){
      alert(error)
    } finally {
      setLoading(false)
      resetForms();
      onClose();
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    setLoading(true);
    e.preventDefault();
    // TODO: name requirements check
    console.log("handleCreateAdmin")
    if (!adminForm.username || !adminForm.password || !adminForm.first_name || !adminForm.last_name || !adminForm.email) {

      console.log("Error: Please fill in all required fields")
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      console.log("creating admin")
      const createdAdmin = await createAdmin(adminForm);

      alert(`admin '${createdAdmin}' created!`)
      toast({
        title: "Successful",
        description: `admin '${createdAdmin}' created.`,
      });
      console.log("admin created:", createdAdmin)
      refreshData(); //refresh User Page

    } catch (error){
      alert(error)
    } finally {
      setLoading(false)
      resetForms();
      onClose();
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New User</DialogTitle>
          <DialogDescription>
            Create a new admins, or agents in the hospital system
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="admin" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="admin">Admin</TabsTrigger>
            <TabsTrigger value="agent">Agent</TabsTrigger>
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
            
            <Button onClick={handleCreateAgent} className="w-full">
              Create Agent
            </Button>
          </TabsContent>

          {/* Admin Form */}
          <TabsContent value="admin" className="space-y-4">
            <div>
              <Label htmlFor="admin-first_name">First Name *</Label>
              <Input
                id="admin-first_name"
                value={adminForm.first_name}
                onChange={(e) => {
                  const value = e.target.value;
                  const isValid = /^[a-zA-Z]{2,100}$/.test(value);
                  
                  if (value !== "" && !isValid) {
                    setNameError(
                      "Name must be 2–100 characters and contain only letters."
                    );
                  } else {
                    setNameError("");
                  }
                  setAdminForm(prev => ({ ...prev, first_name: e.target.value }))
                }}
                placeholder="Enter first name"
              />
              {nameError && <p className="text-red-500 text-sm">{nameError}</p>}
            </div>
            <div>
              <Label htmlFor="admin-last_name">Last Name *</Label>
              <Input
                id="admin-last_name"
                value={adminForm.last_name}
                onChange={(e) => {
                  const value = e.target.value;
                  const isValid = /^[a-zA-Z]{2,100}$/.test(value);
                  
                  if (value !== "" && !isValid) {
                    setNameError(
                      "Name must be 2–100 characters and contain only letters."
                    );
                  } else {
                    setNameError("");
                  }
                  setAdminForm(prev => ({ ...prev, last_name: e.target.value }))
                }}
                placeholder="Enter last name"
              />
              {nameError && <p className="text-red-500 text-sm">{nameError}</p>}
            </div>
            <div>
              {/* TODO: generate password function */}
              <Label htmlFor="admin-email">E-Mail *</Label>
              <Input
                id="admin-email"
                type="email"
                value={adminForm.email}
                onChange={(e) => setAdminForm(prev => ({ ...prev, email: e.target.value }))}
                placeholder="Enter email"
              />
            </div>
            <div>
              <Label htmlFor="admin-username">Username *</Label>
              <Input
                id="admin-username"
                value={adminForm.username}
                onChange={(e) => setAdminForm(prev => ({ ...prev, username: e.target.value }))}
                placeholder="Enter username"
              />
            </div>
            <div>
              {/* TODO: generate password function */}
              <Label htmlFor="admin-password">Password *</Label>
              <Input
                id="admin-password"
                type="password"
                value={adminForm.password}
                onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
                placeholder="Enter password"
              />
            </div>
            
            <Button onClick={handleCreateAdmin} className="w-full">
              Create Admin
            </Button>
          </TabsContent>
          
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};