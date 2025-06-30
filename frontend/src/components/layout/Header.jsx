/**
 * Header – React Component
 *
 * A simple header bar for the Hospital Digital Twin system, displaying the user's name, role,
 * and a logout button.
 *
 * Features:
 * - Fetches the currently authenticated user's profile using React Query.
 * - Displays user's name and role (admin or agent).
 * - Provides a "Sign Out" button that clears localStorage, React Query cache, and redirects to the login page.
 *
 * Data Fetching:
 * - Uses `getProfile()` from `manageHospitalData()` to retrieve the user profile.
 * - React Query caches the profile using the `['profile']` query key.
 * 
 * Behavior:
 * - On logout, tokens are removed from `localStorage` and cache is cleared using `queryClient.clear()`.
 * - User is redirected to the root route (`/`) after logout.
 *
 * Dependencies:
 * - `react-router-dom` for navigation.
 * - `react-query` (`useQuery`, `useQueryClient`) for profile fetching and cache management.
 * - `lucide-react` icons for UI icons (User, LogOut).
 * - Custom UI components like `Button`.
 *
 * Example usage:
 * <Header />
 */


import { useNavigate } from "react-router-dom"
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';
import { manageHospitalData } from '@/hooks/manageHospitalData';
import { useMemo } from 'react';

export const Header = () => {
  const navigate = useNavigate()
  const queryClient = useQueryClient();
  const { getProfile } = manageHospitalData();

  const { data: user, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: getProfile,
  });

  const userInfo = useMemo(() => {
    if (!user) return null;
    if (user.user.role === 'admin') {
      return {
        name: `${user.first_name} ${user.last_name}`,
        role: 'admin',
      }
    } else {
      return {
        name: user.agent_object?.name,
        role: 'agent',
      }
    }
  }, [user]);



  const logout = () => {
    localStorage.clear() //deletes access and refresh token
    queryClient.clear();
    return navigate("/")
  }


  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Hospital Digital Twin</h1>
          <p className="text-sm text-gray-600">
            Welcome back, {userInfo?.name}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{userInfo?.role === 'admin' ? 'Admin' : 'Agent'}</span>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={logout}
            className="flex items-center space-x-2"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </Button>
        </div>
      </div>
    </header>
  );
};