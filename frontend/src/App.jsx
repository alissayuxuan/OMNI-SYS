/*import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip"; //TODO
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"; //TODO
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
//import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminDashboard } from "@/pages/AdminDashboard";
import AgentDashboard from "@/pages/AgentDashboard";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/NotFound";
import '@/index.css';

const queryClient = new QueryClient();

const AppContent = () => {

  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Home/>} />

        <Route
          path="/agent-dashboard"
          element={
            <ProtectedRoute role="agent">
              <AgentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        <Route path="/login" element={<Login />} />
        
        <Route 
          path="/register" 
          element={
            <ProtectedRoute role="admin">
              <Register />
            </ProtectedRoute>
          } 
        /> 

        <Route path="*" element={<NotFound />}/>
      </Routes>
    </div>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

*/



















import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import NotFound from "@/pages/NotFound"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import AgentDashboard from "@/pages/AgentDashboard"
import { AdminDashboard } from "@/pages/AdminDashboard"
import Home from "@/pages/Home"
import '@/index.css';

function Logout() {
  localStorage.clear() //deletes access and refresh token
  return <Navigate to="/login"/>
}

function RegisterAndLogout() {
  localStorage.clear() //clear localStorage before another registration to avoid wrong tokens
  return <Register />
}

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home/>} />
        <Route
          path="/agent-dashboard"
          element={
            <ProtectedRoute role="agent">
              <AgentDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />}/>
        
        <Route 
          path="/register" 
          element={
            <ProtectedRoute role="admin">
              <Register />
            </ProtectedRoute>
          } 
        /> 

        <Route path="*" element={<NotFound />}/>
        

      </Routes>
    </BrowserRouter>
  )
}

export default App
