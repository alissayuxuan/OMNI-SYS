import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

import Login from "@/pages/Login";
import Register from "@/pages/Register";
import NotFound from "@/pages/NotFound";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AgentDashboard } from "@/pages/AgentDashboard";
import { AdminDashboard } from "@/pages/AdminDashboard";
import Home from "@/pages/Home";

import "@/index.css";

const queryClient = new QueryClient();

function Logout() {
  localStorage.clear();
  return <Navigate to="/login" />;
}


function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />

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
      <Route path="/logout" element={<Logout />} />

      <Route
        path="/register"
        element={
          <ProtectedRoute role="admin">
            <Register />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;







/*
//current App.jsx file (by Alissa) -> need to be adapted to use Toasts
import React from "react"
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom"
import Login from "@/pages/Login"
import Register from "@/pages/Register"
import NotFound from "@/pages/NotFound"
import { ProtectedRoute } from "@/components/auth/ProtectedRoute"
import { AgentDashboard } from "@/pages/AgentDashboard"
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

export default App*/
