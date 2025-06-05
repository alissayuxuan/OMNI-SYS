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
        /> {/* What happens aber a registration? */}

        <Route path="*" element={<NotFound />}/>
        {/*<Route path="/login" element={<Login />}/>
        <Route path="/logout" element={<Logout />}/>
        <Route path="/register" element={<RegisterAndLogout />}/>
        <Route path="*" element={<NotFound />}/>*/}

      </Routes>
    </BrowserRouter>
  )
}

export default App
