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

import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/admin" element={<Navigate to="/admin/login" replace />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/admin/ventures" element={<ProtectedRoute><VentureList /></ProtectedRoute>} />
        <Route path="/admin/ventures/create" element={<ProtectedRoute><VentureCreate /></ProtectedRoute>} />
        <Route path="/admin/ventures/:slug/plots" element={<ProtectedRoute><VenturePlotUpload /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/login" replace />} />
        <Route
          path="/ventures"
          element={
            <ProtectedRoute>
              <VentureSelect />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App