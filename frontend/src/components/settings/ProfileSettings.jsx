import { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Lock, Settings, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { manageHospitalData } from '@/hooks/manageHospitalData';

export const ProfileSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { getProfile, updateProfile, changePassword } = manageHospitalData();

  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const formData = useMemo(() => {
    if (!profile) return {};
    const { user } = profile;
    if (user.role === 'admin') {
      return {
        username: user.username,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: profile.email,
      };
    } else if (user.role === 'agent') {
      return {
        username: user.username,
        name: profile.agent_object?.name || '',
        agentId: profile.agent_object?.id,
      };
    }
    return {};
  }, [profile]);

  const [localFormData, setLocalFormData] = useState({});

  const updateMutation = useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      toast({ title: 'Profile Updated', description: 'Successfully updated your profile.' });
      queryClient.invalidateQueries(['profile']);
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  });

  const handleSave = () => {
    updateMutation.mutate({
      username: localFormData.username,
      ...(profile.user.role === 'admin' && {
        first_name: localFormData.first_name,
        last_name: localFormData.last_name,
        email: localFormData.email,
      }),
      ...(profile.user.role === 'agent' && {
        name: localFormData.name,
      }),
    });
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: 'Error', description: 'New passwords do not match.', variant: 'destructive' });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast({ title: 'Error', description: 'Password must be at least 8 characters.', variant: 'destructive' });
      return;
    }

    setPasswordSaving(true);
    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast({ title: 'Password Changed', description: 'Successfully updated your password.' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordDialog(false);
    } catch (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (isLoading || !profile) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-3 text-muted-foreground text-sm">Loading hospital user...</span>
      </div>
    );
  }

  const user = profile.user;
  const isAdmin = user.role === 'admin';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-xl font-semibold">
            <Settings className="h-5 w-5" />
            <span>Profile Settings</span>
          </CardTitle>
          <CardDescription>Manage your account settings and preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isAdmin ? (
              <>
                <div>
                  <Label>First Name</Label>
                  <Input
                    defaultValue={formData.first_name}
                    onChange={(e) => setLocalFormData({ ...localFormData, first_name: e.target.value })}
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div>
                  <Label>Last Name</Label>
                  <Input
                    defaultValue={formData.last_name}
                    onChange={(e) => setLocalFormData({ ...localFormData, last_name: e.target.value })}
                    disabled={updateMutation.isPending}
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    defaultValue={formData.email}
                    onChange={(e) => setLocalFormData({ ...localFormData, email: e.target.value })}
                    disabled={updateMutation.isPending}
                  />
                </div>
              </>
            ) : (
              <div>
                <Label>Name</Label>
                <Input
                  defaultValue={formData.name}
                  onChange={(e) => setLocalFormData({ ...localFormData, name: e.target.value })}
                  disabled={updateMutation.isPending}
                />
              </div>
            )}

            <div>
              <Label>Username</Label>
              <Input
                defaultValue={formData.username}
                onChange={(e) => setLocalFormData({ ...localFormData, username: e.target.value })}
                disabled={updateMutation.isPending}
              />
            </div>
            <div>
              <Label>Role</Label>
              <Input value={user.role} disabled readOnly />
            </div>
            <div>
              <Label>Account Created</Label>
              <Input value={new Date(user.date_joined).toLocaleDateString()} disabled readOnly />
            </div>
          </div>

          <div className="pt-4">
            <Button onClick={handleSave} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Security</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button variant="outline" onClick={() => setShowPasswordDialog(true)}>
            <Lock className="h-4 w-4 mr-2" />
            Change Password
          </Button>
        </CardContent>
      </Card>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>Enter your current password and choose a new one</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Current Password</Label>
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />
            </div>
            <div>
              <Label>New Password</Label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
            </div>
            <div>
              <Label>Confirm New Password</Label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>
            <Button onClick={handleChangePassword} disabled={passwordSaving} className="w-full">
              {passwordSaving ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
