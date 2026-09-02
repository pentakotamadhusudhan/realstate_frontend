import React from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'

import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegistrationPage'
import Dashboard from './pages/Dashboard'
import AdminLogin from './pages/admin/AdminLogin'
import VentureCreate from './pages/admin/VentureCreate'

import ProtectedRoute from './components/ProtectedRoute'

import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root to login */}
        <Route
          path="/"
          element={<Navigate to="/login" replace />}
        />

        {/* Customer public routes */}
        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        {/* Customer protected routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Admin routes */}
        <Route
          path="/admin"
          element={<Navigate to="/admin/login" replace />}
        />

        <Route
          path="/admin/login"
          element={<AdminLogin />}
        />

        {/* Admin Ventures */}
        <Route
          path="/admin/ventures"
          element={
            <ProtectedRoute>
              <div className="min-h-screen bg-gray-950 text-white flex flex-col items-center justify-center gap-6">
                <h1 className="text-2xl font-bold">
                  Admin — Ventures
                </h1>

                <Link
                  to="/admin/ventures/create"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-semibold transition"
                >
                  + Create New Venture
                </Link>
              </div>
            </ProtectedRoute>
          }
        />

        {/* Create Venture */}
        <Route
          path="/admin/ventures/create"
          element={
            <ProtectedRoute>
              <VentureCreate />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route */}
        <Route
          path="*"
          element={<Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
