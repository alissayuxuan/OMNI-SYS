import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
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
      <Route path="/" element={<Login />} />

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
        <ReactQueryDevtools initialIsOpen={false} />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

