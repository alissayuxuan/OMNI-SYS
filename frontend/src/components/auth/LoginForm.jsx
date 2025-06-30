/**
 * LoginForm – React Component
 *
 * A reusable login form component for authenticating users into the OMNI-SYS system.
 * Supports both admin and agent login routes via a dynamic `route` prop.
 *
 * Features:
 * - Accepts username and password input with password visibility toggle.
 * - Sends login credentials to the backend and handles response tokens.
 * - Stores `access` and `refresh` tokens in localStorage.
 * - Redirects user to their respective dashboard based on role.
 * - Displays user feedback via toast notifications on success or failure.
 * - Shows loading state during authentication request.
 *
 * Props:
 * - `route` (string): The API endpoint to send login credentials to.
 *
 * Dependencies:
 * - `@/api`: Axios instance for making HTTP requests.
 * - `@/hooks/use-toast`: Custom hook for displaying toast notifications.
 * - `react-router-dom`: For navigation after successful login.
 * - `ACCESS_TOKEN`, `REFRESH_TOKEN` constants for localStorage keys.
 *
 * Example usage:
 * <LoginForm route="/api/auth/token/" />
 */


import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import api from "@/api"
import { useNavigate } from "react-router-dom"
import { ACCESS_TOKEN, REFRESH_TOKEN } from "@/constants"
import { Eye, EyeOff } from 'lucide-react';


function LoginForm({route}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    setIsLoading(true);
    e.preventDefault();

    try {
        const payload = { username, password };
        const res = await api.post(route, payload)

        if (res.status !== 200) {
            toast({
              title: 'Login Failed',
              description: 'Invalid email or password',
              variant: 'destructive'
            });
            return;
        } else {
            localStorage.setItem(ACCESS_TOKEN, res.data.access);
            localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
            if (res.data.role === "admin") {
              navigate("/admin-dashboard");
          } else {
              navigate("/agent-dashboard");
          }
        }

        
    } catch (error){
        toast({
            title: 'Error',
            description: error.message,
            variant: 'destructive'
          });
    } finally {
        setIsLoading(false)
    }
 }

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
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                required
              />
            </div>
            <div className="relative w-full space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative w-full">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign In'}
            </Button>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>Demo credentials:</p>
              <p>Admin: admin_user / admin-password</p>
              <p>Agent: agent_user / agent-password</p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default LoginForm;