import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Target, Zap } from 'lucide-react';
import { playersApi, calculatePlayerStats } from '../services/api';
import type { PlayerWithTeamAndStats } from '../lib/supabase';

export function Ranking() {
  const [players, setPlayers] = useState<PlayerWithTeamAndStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlayers();
  }, []);

  const loadPlayers = async () => {
    try {
      const playersData = await playersApi.getAll();
      setPlayers(playersData);
    } catch (error) {
      console.error('Error loading players:', error);
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

  const playersWithStats = players.map(player => {
    const stats = calculatePlayerStats(player.player_stats || []);
    return { ...player, ...stats };
  }).filter(player => player.at_bats >= 10);

  const topBatters = [...playersWithStats]
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  const topHomeRuns = [...playersWithStats]
    .sort((a, b) => b.home_runs - a.home_runs)
    .slice(0, 5);

  const topRBI = [...playersWithStats]
    .sort((a, b) => b.rbi - a.rbi)
    .slice(0, 5);

  const topRuns = [...playersWithStats]
    .sort((a, b) => b.runs - a.runs)
    .slice(0, 5);

  const getMedalIcon = (position: number) => {
    switch (position) {
      case 0:
        return <Trophy className="h-5 w-5 text-yellow-500" />;
      case 1:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 2:
        return <Award className="h-5 w-5 text-orange-600" />;
      default:
        return <span className="text-sm font-bold text-gray-600">#{position + 1}</span>;
    }
  };

  const RankingCard = ({ title, players, statKey, statLabel, icon }: any) => (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        {icon}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-3">
        {players.map((player: any, index: number) => (
          <div key={player.id} className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                {getMedalIcon(index)}
              </div>
              <div>
                <p className="font-medium text-gray-900">{player.name}</p>
                <p className="text-sm text-gray-600">{player.teams?.name || 'No Team'}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-gray-900">
                {statKey === 'avg' ? `.${Math.round(player[statKey] * 1000)}` : player[statKey]}
              </p>
              <p className="text-xs text-gray-600">{statLabel}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">League Rankings</h1>
        <div className="text-sm text-gray-600">
          Top performers of the season
        </div>
      </div>

      {playersWithStats.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No rankings available</h3>
          <p className="mt-1 text-sm text-gray-500">
            Rankings will appear once players have sufficient at-bats (minimum 10).
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2">
            <RankingCard
              title="Top 10 Batting Average Leaders"
              players={topBatters}
              statKey="avg"
              statLabel="AVG"
              icon={<Trophy className="h-6 w-6 text-green-600" />}
            />
          </div>

          <RankingCard
            title="Home Run Leaders"
            players={topHomeRuns}
            statKey="home_runs"
            statLabel="HR"
            icon={<Target className="h-6 w-6 text-orange-600" />}
          />

          <RankingCard
            title="RBI Leaders"
            players={topRBI}
            statKey="rbi"
            statLabel="RBI"
            icon={<Zap className="h-6 w-6 text-blue-600" />}
          />

          <RankingCard
            title="Runs Scored Leaders"
            players={topRuns}
            statKey="runs"
            statLabel="Runs"
            icon={<Medal className="h-6 w-6 text-purple-600" />}
          />

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">League Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{players.length}</p>
                <p className="text-sm text-gray-600">Total Players</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{playersWithStats.length}</p>
                <p className="text-sm text-gray-600">Qualified Players</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-600">
                  .{Math.round((playersWithStats.reduce((sum, p) => sum + p.avg, 0) / playersWithStats.length) * 1000) || 0}
                </p>
                <p className="text-sm text-gray-600">League AVG</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {playersWithStats.reduce((sum, p) => sum + p.home_runs, 0)}
                </p>
                <p className="text-sm text-gray-600">Total HRs</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}