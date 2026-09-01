import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegistrationPage'; // Import your new page here
import './App.css';
import Dashboard from './pages/Dashboard';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root path straight to login */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* Dedicated Route for Logging In */}
        <Route path="/login" element={<LoginPage />} />

        {/* Dedicated Route for Customer Registration */}
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
