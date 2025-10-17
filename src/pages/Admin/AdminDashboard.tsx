import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, Users, Trophy, Calendar, BarChart3, UserCheck } from 'lucide-react';
import type { GameWithTeamNames } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuthHook';

export function AdminDashboard() {
  const { user, hasPermission } = useAuth();
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalPlayers: 0,
    totalGames: 0,
    recentActivity: [] as GameWithTeamNames[],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const [teams, players, games] = await Promise.all([
        teamsApi.getAll(),
        playersApi.getAll(),
        gamesApi.getAll(),
      ]);

      setStats({
        totalTeams: teams.length,
        totalPlayers: players.length,
        totalGames: games.length,
        recentActivity: games.slice(0, 5),
      });
    } catch (error) {
      console.error('Error loading admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!hasPermission('ACCESS_ADMIN')) {
    return (
      <div className="text-center py-12">
        <Shield className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Access Denied</h3>
        <p className="mt-1 text-sm text-gray-500">
          You don't have permission to access the admin panel.
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  const adminCards = [
    {
      title: 'Manage Teams',
      description: 'Create and manage teams',
      icon: Trophy,
      link: '/teams',
      color: 'bg-green-500',
      count: stats.totalTeams,
    },
    {
      title: 'Manage Players',
      description: 'Add and edit player information',
      icon: Users,
      link: '/players',
      color: 'bg-blue-500',
      count: stats.totalPlayers,
    },
    {
      title: 'Manage Games',
      description: 'Schedule games and enter statistics',
      icon: Calendar,
      link: '/games',
      color: 'bg-purple-500',
      count: stats.totalGames,
    },
    {
      title: 'View Analytics',
      description: 'View detailed statistics and reports',
      icon: BarChart3,
      link: '/dashboard',
      color: 'bg-orange-500',
      count: null,
    },
  ];

  if (hasPermission('CHANGE_ROLES')) {
    adminCards.push({
      title: 'User Management',
      description: 'Manage user roles and permissions',
      icon: UserCheck,
      link: '/admin/users',
      color: 'bg-red-500',
      count: null,
    });
  }

  if (hasPermission('ACCESS_ADMIN')) {
    adminCards.push({
      title: 'Upload Stats',
      description: 'Upload player statistics from a file',
      icon: BarChart3,
      link: '/admin/stats-uploader',
      color: 'bg-teal-500',
      count: null,
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600">Welcome back, {user?.username}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="h-5 w-5 text-orange-600" />
          <span className="text-sm font-medium text-orange-600">
            {user?.role.charAt(0).toUpperCase() + user?.role.slice(1)} Access
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminCards.map((card) => (
          <Link
            key={card.title}
            to={card.link}
            className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-lg ${card.color}`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
              {card.count !== null && (
                <span className="text-2xl font-bold text-gray-900">{card.count}</span>
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
            <p className="text-sm text-gray-600">{card.description}</p>
          </Link>
        ))}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
        </div>
        <div className="p-6">
          {stats.recentActivity.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent activity.</p>
          ) : (
            <div className="space-y-4">
              {stats.recentActivity.map((game: GameWithTeamNames) => (
                <div key={game.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {game.home_team?.name || 'TBD'} vs {game.away_team?.name || 'TBD'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(game.date).toLocaleDateString()} • {game.location || 'TBD'}
                    </p>
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    game.status === 'completed' ? 'bg-green-100 text-green-800' :
                    game.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {game.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}