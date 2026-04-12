import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LeaderboardPage from './pages/LeaderboardPage';
import ProfileSetup from './pages/ProfileSetup';
import Profile from './pages/Profile';
import AdminPage from './pages/AdminPage';
import AdminRoute from './components/AdminRoute';
import HomePage from './pages/HomePage';
const navLinks = [
  { path: '/', label: 'Home', icon: '🏠' },
  { path: '/dashboard', label: 'Dashboard', icon: '📊', private: true },
  { path: '/leaderboard', label: 'Leaderboard', icon: '🏆' },
  { path: '/admin', label: 'Admin', icon: '🛡️', adminOnly: true }
];

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/login" element={<LoginPage />} />

        {/* Public Routes */}
        <Route path="/" element={<Layout><HomePage /></Layout>} />
        {/* <Route path="/" element={<Home />} /> */}
        <Route path="/leaderboard" element={<Layout><LeaderboardPage /></Layout>} />
        <Route path="/profile-setup" element={<Layout><ProfileSetup /></Layout>} />

        {/* Protected Routes */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <Layout><Profile /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Layout><DashboardPage /></Layout>
          </ProtectedRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute>
            <Layout><AdminPage /></Layout>
          </AdminRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

export default App;
