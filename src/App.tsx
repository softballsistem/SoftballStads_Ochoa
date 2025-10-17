import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.tsx';
import { useAuth } from './hooks/useAuthHook';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginForm } from './components/Auth/LoginForm';
import { SignUpForm } from './components/Auth/SignUpForm';
<<<<<<< HEAD

const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })));
const Teams = lazy(() => import('./pages/Teams').then(module => ({ default: module.Teams })));
const Players = lazy(() => import('./pages/Players').then(module => ({ default: module.Players })));
const Games = lazy(() => import('./pages/Games').then(module => ({ default: module.Games })));
const Profile = lazy(() => import('./pages/Profile').then(module => ({ default: module.Profile })));
const Ranking = lazy(() => import('./pages/Ranking').then(module => ({ default: module.Ranking })));
const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard').then(module => ({ default: module.AdminDashboard })));
const UserManagement = lazy(() => import('./pages/Admin/UserManagement').then(module => ({ default: module.UserManagement })));
=======
import { Dashboard } from './pages/Dashboard';
import { Teams } from './pages/Teams';
import { Players } from './pages/Players';
import { Games } from './pages/Games';
import { Profile } from './pages/Profile';
import { Ranking } from './pages/Ranking';
import { AdminDashboard } from './pages/Admin/AdminDashboard';
import { UserManagement } from './pages/Admin/UserManagement';
import { StatsUploader } from './pages/Admin/StatsUploader';
>>>>>>> a606e153d9e28b576a48027193a7eb5d5e4967bd

function AppRoutes() {
  const { user, loading } = useAuth();

  // Show loading screen only briefly
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Cargando...</p>
        </div>
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
          <Route path="admin/users" element={
            <ProtectedRoute requiredPermission="CHANGE_ROLES">
              <UserManagement />
            </ProtectedRoute>
          } />
        </Route>
        
        {/* Fallback route */}
        <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
      </Routes>
    </Suspense>
=======
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
        <Route path="admin/users" element={
          <ProtectedRoute requiredPermission="CHANGE_ROLES">
            <UserManagement />
          </ProtectedRoute>
        } />
        <Route path="admin/stats-uploader" element={
          <ProtectedRoute requiredPermission="ACCESS_ADMIN">
            <StatsUploader />
          </ProtectedRoute>
        } />
      </Route>
      
      {/* Fallback route */}
      <Route path="*" element={<Navigate to={user ? "/dashboard" : "/login"} replace />} />
    </Routes>
>>>>>>> a606e153d9e28b576a48027193a7eb5d5e4967bd
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