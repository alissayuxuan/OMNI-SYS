import { useState } from 'react';
//import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import api from "../../api"
import { useNavigate } from "react-router-dom"
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../../constants"

function LoginForm({route}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate()
  //const { login } = useAuth();

  const handleSubmit = async (e) => {
    setIsLoading(true);
    e.preventDefault();

    try {
        const payload = { username, password };
        console.log("LoginForm, payload: ", payload)
        const res = await api.post(route, payload)
        console.log("LoginForm, response: ", res)
        console.log("res.data.role: ", res.data.role)

        if (res.status !== 200) {
            toast({
              title: 'Login Failed',
              description: 'Invalid email or password',
              variant: 'destructive'
            });
            return;
        } else {
            if (res.data.role === "admin") {
              console.log("admin login")
              navigate("/admin-dashboard");
          } else {
              navigate("/agent-dashboard");
              console.log("agent login")
          }
        }

        
    } catch (error){
        toast({
            title: 'Error',
            description: 'An error occurred during login',
            variant: 'destructive'
          });
    } finally {
        setIsLoading(false)
    }
 }
  /*
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      if (!success) {
        toast({
          title: 'Login Failed',
          description: 'Invalid email or password',
          variant: 'destructive'
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred during login',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  */
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">OMNI-SYS</CardTitle>
          <CardDescription>Sign in to access the system</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="username"
                type="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Demo credentials:</p>
              <p>Admin: firstadmin / YourStrongPassword123</p>
              <p>Agent: alissa / alissa123</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginForm;