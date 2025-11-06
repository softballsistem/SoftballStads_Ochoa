import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.tsx';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';

// Lazy-loaded components
const LoginForm = lazy(() => import('./components/Auth/LoginForm'));
const SignUpForm = lazy(() => import('./components/Auth/SignUpForm'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Teams = lazy(() => import('./pages/Teams'));
const Players = lazy(() => import('./pages/Players'));
const Games = lazy(() => import('./pages/Games'));
const Profile = lazy(() => import('./pages/Profile'));
const Ranking = lazy(() => import('./pages/Ranking'));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard'));
// const UserManagement = lazy(() => import('./pages/Admin/UserManagement'));
// const StatsUploader = lazy(() => import('./pages/Admin/StatsUploader'));

function AppRoutes() {
  const { user, loading } = useAuth();

  // Show minimal loading indicator briefly
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div>
      </div>
    }>
      <Routes>
        {/* Public routes */}
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <LoginForm />} 
        />
        <Route 
          path="/signup" 
          element={user ? <Navigate to="/dashboard" replace /> : <SignUpForm />} 
        />
        
        {/* Protected routes */}
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
          {/* <Route path="admin/users" element={
            <ProtectedRoute requiredPermission="CHANGE_ROLES">
              <UserManagement />
            </ProtectedRoute>
          } /> */}
          {/* <Route path="admin/stats-uploader" element={
            <ProtectedRoute requiredPermission="ACCESS_ADMIN">
              <StatsUploader />
            </ProtectedRoute>
          } /> */}
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AuthProvider>
  );
}

export default App;