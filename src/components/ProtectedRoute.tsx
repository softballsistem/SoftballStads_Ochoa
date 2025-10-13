import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuthHook';
import { Shield } from 'lucide-react';
import { type Permission } from '../config/roles';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: Permission;
}

export function ProtectedRoute({ children, requiredPermission }: ProtectedRouteProps) {
  const { user, loading, hasPermission } = useAuth();

  // Show minimal loading
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600 mx-auto"></div>
        </div>
      </div>
    );
  }

  // Redirect to login if no user
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check permissions
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return (
      <div className="flex items-center justify-center min-h-96 bg-gray-50">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="bg-red-100 rounded-full p-4 mx-auto w-20 h-20 flex items-center justify-center mb-6">
            <Shield className="h-10 w-10 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Acceso Denegado</h2>
          <p className="text-gray-600 mb-6">
            No tienes permisos para acceder a esta página. Tu rol actual es <strong>{user.role}</strong>.
          </p>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-left">
            <h3 className="font-medium text-yellow-800 mb-2">Permisos requeridos:</h3>
            <p className="text-sm text-yellow-700">
              Esta página requiere el permiso: <code className="bg-yellow-100 px-1 rounded">{requiredPermission}</code>
            </p>
          </div>
          <button
            onClick={() => window.history.back()}
            className="mt-6 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
          >
            Volver
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}