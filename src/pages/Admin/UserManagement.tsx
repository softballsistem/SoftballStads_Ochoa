import React, { useState, useEffect } from 'react';
import { Users, Shield, Edit2, Save, X, AlertTriangle, Clock, Check, Ban, Eye, UserPlus, Bell } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { userApi } from '../../services/api';
import { useAuth } from '../../hooks/useAuth';
import { ROLE_HIERARCHY, getRoleColor, getRoleDescription } from '../../config/roles';

interface RoleChangeRequest {
  id: string;
  requester_id: string;
  target_user_id: string;
  current_role: string;
  requested_role: string;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  requester: { username: string; email: string; role: string };
  target_user: { username: string; email: string; role: string };
  reviewer?: { username: string; email: string; role: string };
}

export function UserManagement() {
  const { user, hasPermission } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [roleChangeRequests, setRoleChangeRequests] = useState<RoleChangeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [newRole, setNewRole] = useState('');
  const [reason, setReason] = useState('');
  const [updating, setUpdating] = useState(false);
  const [activeTab, setActiveTab] = useState<'users' | 'requests'>('users');

  const isDeveloper = user?.role === 'developer';
  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    if (hasPermission('ACCESS_ADMIN')) {
      loadData();
    }
  }, [hasPermission]);

  const loadData = async () => {
    try {
      const [usersData, requestsData] = await Promise.all([
        userApi.getAllUsers(),
        isDeveloper ? userApi.getRoleChangeRequests() : Promise.resolve([])
      ]);
      
      setUsers(usersData);
      setRoleChangeRequests(requestsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (userId: string, currentRole: string) => {
    setEditingUser(userId);
    setNewRole(currentRole);
    setReason('');
  };

  const cancelEdit = () => {
    setEditingUser(null);
    setNewRole('');
    setReason('');
  };

  const handleRoleChange = async (userId: string, targetUser: any) => {
    if (!newRole || newRole === targetUser.role) {
      cancelEdit();
      return;
    }

    // Prevenir que el usuario se quite sus propios privilegios de developer
    if (userId === user?.uid && user?.role === 'developer' && newRole !== 'developer') {
      alert('No puedes quitar tus propios privilegios de desarrollador.');
      cancelEdit();
      return;
    }

    setUpdating(true);

    try {
      if (isDeveloper) {
        // Desarrollador puede cambiar roles directamente
        await userApi.updateUserRole(userId, newRole);
        setUsers(users.map(u => 
          u.uid === userId 
            ? { ...u, role: newRole, updated_at: new Date().toISOString() }
            : u
        ));
        alert('Rol de usuario actualizado exitosamente!');
      } else if (isAdmin) {
        // Administrador debe crear una solicitud
        await userApi.createRoleChangeRequest(userId, targetUser.role, newRole, reason);
        alert('Solicitud de cambio de rol enviada para aprobación del desarrollador.');
        await loadData(); // Recargar datos para mostrar la nueva solicitud
      }

      cancelEdit();
    } catch (error) {
      console.error('Error processing role change:', error);
      alert('Error al procesar el cambio de rol. Inténtalo de nuevo.');
    } finally {
      setUpdating(false);
    }
  };

  const reviewRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    if (!isDeveloper) return;

    try {
      await userApi.reviewRoleChangeRequest(requestId, status);
      alert(`Solicitud ${status === 'approved' ? 'aprobada' : 'rechazada'} exitosamente!`);
      await loadData(); // Recargar datos
    } catch (error) {
      console.error('Error reviewing request:', error);
      alert('Error al revisar la solicitud. Inténtalo de nuevo.');
    }
  };

  if (!hasPermission('ACCESS_ADMIN')) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Acceso Denegado</h3>
        <p className="mt-1 text-sm text-gray-500">
          No tienes permisos para gestionar usuarios.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
      </div>
    );
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'developer':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'admin':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'player':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const roles = ['developer', 'admin', 'player', 'visitor'];
  const pendingRequests = roleChangeRequests.filter(req => req.status === 'pending');

  // Filtrar usuarios según el rol
  const filteredUsers = isDeveloper 
    ? users // Desarrollador ve todos
    : users.filter(u => u.role === 'visitor' || u.uid === user?.uid); // Admin solo ve visitantes y su propio perfil

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p className="text-gray-600">
            {isDeveloper 
              ? 'Gestiona roles y aprueba solicitudes de cambio' 
              : 'Gestiona visitantes y solicita cambios de rol'
            }
          </p>
        </div>
        <div className="flex items-center space-x-4">
          {isDeveloper && pendingRequests.length > 0 && (
            <div className="flex items-center space-x-2 bg-yellow-50 px-3 py-2 rounded-lg border border-yellow-200">
              <Bell className="h-4 w-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                {pendingRequests.length} solicitud{pendingRequests.length !== 1 ? 'es' : ''} pendiente{pendingRequests.length !== 1 ? 's' : ''}
              </span>
            </div>
          )}
          <div className="flex items-center space-x-2 text-sm">
            <Shield className="h-4 w-4 text-purple-600" />
            <span className="font-medium text-purple-600">
              {isDeveloper ? 'Acceso Total' : 'Acceso Limitado'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('users')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'users'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Usuarios ({filteredUsers.length})
          </button>
          {isDeveloper && (
            <button
              onClick={() => setActiveTab('requests')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'requests'
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Clock className="h-4 w-4 inline mr-2" />
              Solicitudes ({roleChangeRequests.length})
              {pendingRequests.length > 0 && (
                <span className="ml-2 bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded-full">
                  {pendingRequests.length}
                </span>
              )}
            </button>
          )}
        </nav>
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-900">
                  {isDeveloper ? 'Todos los Usuarios' : 'Usuarios Visitantes'} ({filteredUsers.length})
                </h3>
              </div>
              {!isDeveloper && (
                <div className="text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-lg">
                  <Eye className="h-4 w-4 inline mr-1" />
                  Vista limitada a visitantes
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rol Actual
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Player ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Miembro desde
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((userItem) => (
                  <tr key={userItem.uid} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            {userItem.username}
                            {userItem.uid === user?.uid && (
                              <span className="ml-2 text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                Tú
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-sm text-gray-500">{userItem.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {editingUser === userItem.uid ? (
                        <div className="space-y-2">
                          <select
                            value={newRole}
                            onChange={(e) => setNewRole(e.target.value)}
                            className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                          >
                            {roles.map((role) => (
                              <option key={role} value={role}>
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </option>
                            ))}
                          </select>
                          {isAdmin && (
                            <textarea
                              value={reason}
                              onChange={(e) => setReason(e.target.value)}
                              placeholder="Razón del cambio (opcional)"
                              className="w-full text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-purple-500"
                              rows={2}
                            />
                          )}
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleRoleChange(userItem.uid, userItem)}
                              disabled={updating}
                              className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                            >
                              <Save className="h-4 w-4" />
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="p-1 text-gray-600 hover:text-gray-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(userItem.role)}`}>
                            <Shield className="h-3 w-3 mr-1" />
                            {userItem.role.charAt(0).toUpperCase() + userItem.role.slice(1)}
                          </span>
                          <div className="text-xs text-gray-500">
                            {getRoleDescription(userItem.role)}
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {userItem.player_id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(userItem.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingUser !== userItem.uid && (
                        <button
                          onClick={() => startEdit(userItem.uid, userItem.role)}
                          className="text-purple-600 hover:text-purple-900 transition-colors"
                          title={isDeveloper ? 'Cambiar rol directamente' : 'Solicitar cambio de rol'}
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Requests Tab (Solo para desarrolladores) */}
      {activeTab === 'requests' && isDeveloper && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Solicitudes de Cambio de Rol ({roleChangeRequests.length})
              </h3>
            </div>
          </div>

          {roleChangeRequests.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No hay solicitudes</h3>
              <p className="mt-1 text-sm text-gray-500">
                Las solicitudes de cambio de rol aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {roleChangeRequests.map((request) => (
                <div key={request.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <UserPlus className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Solicitud de <span className="font-semibold">{request.requester.username}</span>
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(request.created_at).toLocaleString()}
                          </p>
                        </div>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusBadgeColor(request.status)}`}>
                          {request.status === 'pending' && <Clock className="h-3 w-3 mr-1" />}
                          {request.status === 'approved' && <Check className="h-3 w-3 mr-1" />}
                          {request.status === 'rejected' && <Ban className="h-3 w-3 mr-1" />}
                          {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                        </span>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4 mb-3">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario Objetivo</p>
                            <p className="text-sm font-medium text-gray-900">{request.target_user.username}</p>
                            <p className="text-xs text-gray-500">{request.target_user.email}</p>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Cambio de Rol</p>
                            <div className="flex items-center space-x-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(request.current_role)}`}>
                                {request.current_role}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(request.requested_role)}`}>
                                {request.requested_role}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Solicitado por</p>
                            <p className="text-sm font-medium text-gray-900">{request.requester.username}</p>
                            <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${getRoleBadgeColor(request.requester.role)}`}>
                              {request.requester.role}
                            </span>
                          </div>
                        </div>

                        {request.reason && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Razón</p>
                            <p className="text-sm text-gray-700 mt-1">{request.reason}</p>
                          </div>
                        )}
                      </div>

                      {request.status === 'pending' && (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => reviewRequest(request.id, 'approved')}
                            className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Aprobar
                          </button>
                          <button
                            onClick={() => reviewRequest(request.id, 'rejected')}
                            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
                          >
                            <Ban className="h-4 w-4 mr-2" />
                            Rechazar
                          </button>
                        </div>
                      )}

                      {request.status !== 'pending' && request.reviewer && (
                        <div className="text-sm text-gray-500">
                          {request.status === 'approved' ? 'Aprobado' : 'Rechazado'} por{' '}
                          <span className="font-medium">{request.reviewer.username}</span>{' '}
                          el {new Date(request.reviewed_at!).toLocaleString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Información de permisos */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
        <div className="flex">
          <AlertTriangle className="h-5 w-5 text-purple-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-purple-800">Sistema de Permisos</h3>
            <div className="mt-2 text-sm text-purple-700">
              <ul className="list-disc list-inside space-y-1">
                {isDeveloper ? (
                  <>
                    <li><strong>Desarrollador (Tú):</strong> Acceso total - Puedes ver y modificar todos los usuarios y aprobar solicitudes</li>
                    <li><strong>Administradores:</strong> Pueden ver solo visitantes y solicitar cambios de rol</li>
                    <li><strong>Sistema de Aprobaciones:</strong> Las solicitudes de administradores requieren tu aprobación</li>
                    <li><strong>Protección:</strong> No puedes quitar tus propios privilegios de desarrollador</li>
                  </>
                ) : (
                  <>
                    <li><strong>Administrador (Tú):</strong> Puedes ver y gestionar usuarios visitantes</li>
                    <li><strong>Solicitudes:</strong> Los cambios de rol requieren aprobación del desarrollador</li>
                    <li><strong>Vista Limitada:</strong> Solo puedes ver usuarios con rol de visitante</li>
                    <li><strong>Proceso:</strong> Selecciona un nuevo rol y proporciona una razón para la solicitud</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}