import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.tsx';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginForm } from './components/Auth/LoginForm';
import { SignUpForm } from './components/Auth/SignUpForm';
import { Dashboard } from './pages/Dashboard';
import { Teams } from './pages/Teams';
import { Players } from './pages/Players';
import { Games } from './pages/Games';
import { Profile } from './pages/Profile';
import { Ranking } from './pages/Ranking';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { UserManagement } from './pages/Admin/UserManagement';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route path="/signup" element={<SignUpForm />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={
              <ProtectedRoute requiredPermission="VIEW_DASHBOARD">
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="teams" element={
              <ProtectedRoute requiredPermission="VIEW_STATS">
                <Teams />
              </ProtectedRoute>
            } />
            <Route path="players" element={
              <ProtectedRoute requiredPermission="VIEW_STATS">
                <Players />
              </ProtectedRoute>
            } />
            <Route path="games" element={
              <ProtectedRoute requiredPermission="VIEW_STATS">
                <Games />
              </ProtectedRoute>
            } />
            <Route path="profile" element={<Profile />} />
            <Route path="ranking" element={
              <ProtectedRoute requiredPermission="VIEW_STATS">
                <Ranking />
              </ProtectedRoute>
            } />
            <Route path="admin" element={
              <ProtectedRoute requiredPermission="ACCESS_ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            } />
            <Route path="admin/users" element={
              <ProtectedRoute requiredPermission="CHANGE_ROLES">
                <UserManagement />
              </ProtectedRoute>
            } />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;