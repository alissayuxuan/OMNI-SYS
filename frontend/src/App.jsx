/**
 * App – Main Application Entry Point
 *
 * This component sets up the global application structure, including routing, state management,
 * and UI providers.
 *
 * Key Features:
 * - React Router is used to handle client-side routing.
 * - React Query is used for data fetching, caching, and state management.
 * - ProtectedRoute components wrap routes that require authentication and role-based access.
 * - TooltipProvider enables tooltips throughout the UI.
 * - Toaster is used to display toast notifications globally.
 * - ReactQueryDevtools is included for development-time debugging of queries and mutations.
 *
 * Routes:
 * - "/" → Login page.
 * - "/agent-dashboard" → Protected route accessible only by authenticated agents.
 * - "/admin-dashboard" → Protected route accessible only by authenticated admins.
 * - "*" → Catch-all for undefined routes; renders NotFound page.
 *
 * Components:
 * - `AppContent`: Encapsulates route definitions.
 * - `App`: Wraps the application with necessary providers.
 */



import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";

import Login from "@/pages/Login";
import NotFound from "@/pages/NotFound";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AgentDashboard } from "@/pages/AgentDashboard";
import { AdminDashboard } from "@/pages/AdminDashboard";

import "@/index.css";

const queryClient = new QueryClient();



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

