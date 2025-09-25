import React, { useState, useEffect } from 'react';
import { Trophy, Users, Calendar, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { teamsApi, playersApi, gamesApi, calculatePlayerStats } from '../services/api';
import type { Team, PlayerWithTeamAndStats, GameWithTeamNames } from '../lib/supabase';

export function Dashboard() {
  const [stats, setStats] = useState({
    totalTeams: 0,
    totalPlayers: 0,
    totalGames: 0,
    recentGames: [] as GameWithTeamNames[],
  });
  const [topPerformers, setTopPerformers] = useState<(PlayerWithTeamAndStats & ReturnType<typeof calculatePlayerStats>)[]>([]);
  const [teamStats, setTeamStats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const [teams, players, games] = await Promise.all([
        teamsApi.getAll(),
        playersApi.getAll(),
        gamesApi.getAll(),
      ]);

      // Calculate top performers
      const playersWithStats = players.map(player => {
        const playerStats = calculatePlayerStats(player.player_stats || []);
        return {
          ...player,
          ...playerStats,
        };
      }).filter(player => player.at_bats >= 10)
        .sort((a, b) => b.avg - a.avg)
        .slice(0, 5);

      // Calculate team statistics
      const teamStatsData = teams.map(team => {
        const teamPlayers = players.filter(p => p.team_id === team.id);
        const allStats = teamPlayers.flatMap(p => p.player_stats || []);
        const teamTotals = calculatePlayerStats(allStats);
        
        return {
          name: team.name,
          runs: teamTotals.runs,
          hits: teamTotals.hits,
          avg: teamTotals.avg,
          players: teamPlayers.length,
        };
      });

      setStats({
        totalTeams: teams.length,
        totalPlayers: players.length,
        totalGames: games.length,
        recentGames: games.slice(0, 5),
      });
      
      setTopPerformers(playersWithStats);
      setTeamStats(teamStatsData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="text-sm text-gray-600">
          Welcome to your softball statistics dashboard
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Trophy className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Teams</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTeams}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Users className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Players</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPlayers}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <Calendar className="h-8 w-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Games</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalGames}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Season</p>
              <p className="text-2xl font-bold text-gray-900">2024</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers (AVG)</h3>
          <div className="space-y-3">
            {topPerformers.length === 0 ? (
              <p className="text-gray-500 text-sm">No player statistics available yet.</p>
            ) : (
              topPerformers.map((player, index) => (
                <div key={player.id} className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white mr-3 ${
                      index === 0 ? 'bg-yellow-500' : 
                      index === 1 ? 'bg-gray-400' : 
                      index === 2 ? 'bg-orange-600' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{player.name}</p>
                      <p className="text-sm text-gray-600">{player.teams?.name || 'No Team'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">.{Math.round(player.avg * 1000)}</p>
                    <p className="text-xs text-gray-600">{player.hits}/{player.at_bats}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Team Performance Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Team Performance</h3>
          {teamStats.length === 0 ? (
            <p className="text-gray-500 text-sm">No team statistics available yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={teamStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="runs" fill="#22c55e" name="Runs" />
                <Bar dataKey="hits" fill="#3b82f6" name="Hits" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Recent Games */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Recent Games</h3>
        </div>
        <div className="p-6">
          {stats.recentGames.length === 0 ? (
            <p className="text-gray-500 text-sm">No games recorded yet.</p>
          ) : (
            <div className="space-y-4">
              {stats.recentGames.map((game: any) => (
                <div key={game.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">
                      {game.home_team?.name || 'TBD'} vs {game.away_team?.name || 'TBD'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(game.date).toLocaleDateString()} • {game.location || 'TBD'}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg text-gray-900">
                      {game.home_score} - {game.away_score}
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      game.status === 'completed' ? 'bg-green-100 text-green-800' :
                      game.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {game.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}