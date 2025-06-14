import { useContext } from "react";
import { UserContext } from "@/components/auth/ProtectedRoute";
import { useNavigate } from "react-router-dom"

import { Button } from '@/components/ui/button';
import { LogOut, User } from 'lucide-react';

export const Header = () => {
  const navigate = useNavigate()

  const logout = () => {
    console.log("logout")
    localStorage.clear() //deletes access and refresh token
    return navigate("/login")
  }

  const { user } = useContext(UserContext);

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Hospital Digital Twin</h1>
          <p className="text-sm text-gray-600">
            Welcome back, {user?.role}
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <User className="h-4 w-4" />
            <span>{user?.role === 'admin' ? 'Administrator' : 'Agent'}</span>
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