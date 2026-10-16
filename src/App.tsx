import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegistrationPage'
import AuthCallback from './pages/AuthCallback'
import Dashboard from './pages/Dashboard'
import AdminLogin from './pages/admin/AdminLogin'
import VentureList from './pages/admin/VentureList'
import VentureCreate from './pages/admin/VentureCreate'
import VenturePlotUpload from './pages/admin/VenturePlotUpload'
import ProtectedRoute from './components/ProtectedRoute'
import VentureSelect from './pages/VentureSelect'
import MyHolds from './pages/MyHolds'
import './App.css'
import AgentRegisterPage from './pages/admin/AgentRegistrationPage'
import Unverifiedagent from './pages/admin/UnverifiedScreen'
import AdminAgentsPage from './pages/admin/AdminAgentsPage'
import AdminMembershipsPage from './pages/admin/AdminMembershipsPage'
import AdminPlotApprovalsPage from './pages/admin/AdminPlotApprovalsPage'
import AdminCallQueriesPage from './pages/admin/AdminCallQueriesPage'
import GlobalApiErrorContainer from './components/alter_box/GlobalApiErrorContainer'

function App() {
  return (
    <BrowserRouter>
      <GlobalApiErrorContainer />
      <Routes>
        {/* Root */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Customer public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/auth/callback" element={<AuthCallback />} />

        {/* Customer protected */}
        <Route path="/ventures" element={<ProtectedRoute><VentureSelect /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/my-holds" element={<ProtectedRoute><MyHolds /></ProtectedRoute>} />

        {/* Admin & Agent Hub */}
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/ventures" element={<ProtectedRoute><VentureList /></ProtectedRoute>} />
        <Route path="/admin/ventures/create" element={<ProtectedRoute><VentureCreate /></ProtectedRoute>} />
        <Route path="/admin/ventures/:slug/plots" element={<ProtectedRoute><VenturePlotUpload /></ProtectedRoute>} />
        <Route path="/admin/agents" element={<ProtectedRoute><AdminAgentsPage /></ProtectedRoute>} />
        <Route path="/admin/memberships" element={<ProtectedRoute><AdminMembershipsPage /></ProtectedRoute>} />
        <Route path="/admin/approvals" element={<ProtectedRoute><AdminPlotApprovalsPage /></ProtectedRoute>} />
        <Route path="/admin/queries" element={<ProtectedRoute><AdminCallQueriesPage /></ProtectedRoute>} />

        {/* Agent Registration & Verification Status */}
        <Route path="/agent-register" element={<AgentRegisterPage />} />
        <Route path="/unverified" element={<Unverifiedagent />} />

        {/* Catch all — must be last */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App