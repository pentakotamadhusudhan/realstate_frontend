import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegistrationPage'
import Dashboard from './pages/Dashboard'
import AdminLogin from './pages/admin/AdminLogin'
import VentureList from './pages/admin/VentureList'
import VentureCreate from './pages/admin/VentureCreate'
import VenturePlotUpload from './pages/admin/VenturePlotUpload'
import ProtectedRoute from './components/ProtectedRoute'
import VentureSelect from './pages/VentureSelect'
import MyHolds from './pages/myholds'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Root */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Customer public */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Customer protected */}
        <Route path="/ventures" element={<ProtectedRoute><VentureSelect /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/my-holds" element={<ProtectedRoute><MyHolds /></ProtectedRoute>} />

        {/* Admin */}
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/ventures" element={<ProtectedRoute><VentureList /></ProtectedRoute>} />
        <Route path="/admin/ventures/create" element={<ProtectedRoute><VentureCreate /></ProtectedRoute>} />
        <Route path="/admin/ventures/:slug/plots" element={<ProtectedRoute><VenturePlotUpload /></ProtectedRoute>} />

        {/* Catch all — must be last */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App