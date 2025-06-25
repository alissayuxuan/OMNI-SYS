import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { manageHospitalData } from '@/hooks/manageHospitalData'
import { Eye, EyeOff } from 'lucide-react';

export const CreateUserForms = ({ isOpen, onClose, refreshData }) => {
  const {createAgent, createAdmin } = manageHospitalData();
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
      const createdAgent = await createAgent(agentForm);

      toast({
        title: "Successful",
        description: `Agent was successfully created.`,
      });

    } catch (error){
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsCreating(false)
      resetForms();
      onClose();
      refreshData(); //refresh Hospital Page
    }
  };

  const handleCreateAdmin = async (e) => {
    setIsCreating(true);
    e.preventDefault();
    // TODO: name requirements check
    if (!adminForm.username || !adminForm.password || !adminForm.first_name || !adminForm.last_name || !adminForm.email) {

      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      await createAdmin(adminForm);

      toast({
        title: "Successful",
        description: `Admin was successfully created.`,
      });
    } catch (error){
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      resetForms();
      onClose();
      setIsCreating(false);
      refreshData(); //refresh User Page

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
                    for (let i = 0; i < 10; i++) {
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
              {isCreating ? "Creating..." : "Create Agent"}
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
              <Label htmlFor="agent-password">Password *</Label>
              <div className="flex items-center gap-2">
                {/* Password input with eye icon */}
                <div className="relative w-full">
                  <Input
                    id="agent-password"
                    type={showPassword ? 'text' : 'password'}
                    value={adminForm.password}
                    onChange={(e) => setAdminForm(prev => ({ ...prev, password: e.target.value }))}
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
                    for (let i = 0; i < 10; i++) {
                      generated += characters.charAt(Math.floor(Math.random() * characters.length));
                    }
                    setAdminForm(prev => ({ ...prev, password: generated }));
                  }}
                >
                  Generate
                </Button>
              </div>

              {/* Warning message */}
              {adminForm.password && (
                <p className="text-sm text-blue-600 mt-1">
                  Please save the password securely, it will not be shown again.
                </p>
              )}
            </div>
            
            <Button onClick={handleCreateAdmin} disabled={isCreating} className="w-full">
              {isCreating ? "Creating..." : "Create Admin"}
            </Button>
          </TabsContent>
          
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};