import React from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { BarChart3, Users, Trophy, Calendar, LogOut, User, Settings, Shield, Menu, X } from 'lucide-react';
import { getRoleColor } from '../config/roles';

export function Layout() {
  const { user, signOut, hasPermission, loading } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  const navigationItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: BarChart3,
      permission: 'VIEW_DASHBOARD' as const,
    },
    {
      name: 'Equipos',
      href: '/teams',
      icon: Trophy,
      permission: 'VIEW_STATS' as const,
    },
    {
      name: 'Jugadores',
      href: '/players',
      icon: Users,
      permission: 'VIEW_STATS' as const,
    },
    {
      name: 'Juegos',
      href: '/games',
      icon: Calendar,
      permission: 'VIEW_STATS' as const,
    },
    {
      name: 'Rankings',
      href: '/ranking',
      icon: Trophy,
      permission: 'VIEW_STATS' as const,
    },
  ];

  if (hasPermission('ACCESS_ADMIN')) {
    navigationItems.push({
      name: 'Admin',
      href: '/admin',
      icon: Shield,
      permission: 'ACCESS_ADMIN' as const,
    });
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-2">
                <div className="p-1 bg-green-100 rounded-lg">
                  <Trophy className="h-6 w-6 text-green-600" />
                </div>
                <span className="text-xl font-bold text-gray-900 hidden sm:block">SoftballStats</span>
              </div>
              
              <div className="hidden lg:flex space-x-1">
                {navigationItems.map((item) => {
                  if (!hasPermission(item.permission)) return null;
                  
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      className={({ isActive }) =>
                        `flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? item.name === 'Admin'
                              ? 'bg-orange-100 text-orange-700 shadow-sm'
                              : 'bg-green-100 text-green-700 shadow-sm'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* User Info */}
              <div className="hidden md:flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">{user?.username}</div>
                  <div className="text-xs text-gray-500">{user?.email}</div>
                </div>
                <div className={`px-2 py-1 rounded-full text-xs font-medium border ${getRoleColor(user?.role || 'visitor')}`}>
                  {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                </div>
              </div>

              {/* Desktop Menu */}
              <div className="hidden md:flex items-center space-x-2">
                <NavLink
                  to="/profile"
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <Settings className="h-4 w-4" />
                  <span>Perfil</span>
                </NavLink>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 px-3 py-2 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Salir</span>
                </button>
              </div>

              {/* Mobile menu button */}
              <div className="lg:hidden">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
                >
                  {mobileMenuOpen ? (
                    <X className="block h-6 w-6" />
                  ) : (
                    <Menu className="block h-6 w-6" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Mobile menu */}
          {mobileMenuOpen && (
            <div className="lg:hidden">
              <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200">
                {navigationItems.map((item) => {
                  if (!hasPermission(item.permission)) return null;
                  
                  return (
                    <NavLink
                      key={item.name}
                      to={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                          isActive
                            ? item.name === 'Admin'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-green-100 text-green-700'
                            : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                        }`
                      }
                    >
                      <item.icon className="h-5 w-5" />
                      <span>{item.name}</span>
                    </NavLink>
                  );
                })}
                
                <div className="border-t border-gray-200 pt-4 pb-3">
                  <div className="flex items-center px-3 mb-3">
                    <div className="flex-shrink-0">
                      <User className="h-8 w-8 text-gray-400" />
                    </div>
                    <div className="ml-3">
                      <div className="text-base font-medium text-gray-800">{user?.username}</div>
                      <div className="text-sm text-gray-500">{user?.email}</div>
                      <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border mt-1 ${getRoleColor(user?.role || 'visitor')}`}>
                        {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)}
                      </div>
                    </div>
                  </div>
                  <NavLink
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                  >
                    <Settings className="h-5 w-5" />
                    <span>Perfil</span>
                  </NavLink>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleSignOut();
                    }}
                    className="flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors w-full text-left"
                  >
                    <LogOut className="h-5 w-5" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}