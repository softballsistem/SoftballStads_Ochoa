import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Target, Zap, Star, TrendingUp, Activity } from 'lucide-react';
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
  });

  // RANKINGS ESPECIALES
  const topBatters = [...playersWithStats]
    .filter(player => player.at_bats > 0)
    .sort((a, b) => b.avg - a.avg)
    .slice(0, 10);

  const topPitchers = [...playersWithStats]
    .filter(player => player.strikeouts > 0)
    .sort((a, b) => b.strikeouts - a.strikeouts)
    .slice(0, 3);

  const topRBI = [...playersWithStats]
    .filter(player => player.rbi > 0)
    .sort((a, b) => b.rbi - a.rbi)
    .slice(0, 5);

  const topDoubles = [...playersWithStats]
    .filter(player => player.doubles > 0)
    .sort((a, b) => b.doubles - a.doubles)
    .slice(0, 5);

  const topHomeRuns = [...playersWithStats]
    .filter(player => player.home_runs > 0)
    .sort((a, b) => b.home_runs - a.home_runs)
    .slice(0, 5);

  const topStrikeouts = [...playersWithStats]
    .filter(player => player.strikeouts > 0)
    .sort((a, b) => b.strikeouts - a.strikeouts)
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

  const RankingCard = ({ title, players, statKey, statLabel, icon, bgColor = "bg-white" }: any) => (
    <div className={`${bgColor} rounded-lg shadow-sm border border-gray-200 p-6`}>
      <div className="flex items-center space-x-2 mb-4">
        {icon}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      </div>
      {players.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-gray-500 text-sm">No hay datos disponibles</p>
        </div>
      ) : (
        <div className="space-y-3">
          {players.map((player: any, index: number) => (
            <div key={player.id} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0">
                  {getMedalIcon(index)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{player.name}</p>
                  <p className="text-sm text-gray-600">
                    {player.teams?.name || 'Sin Equipo'} • #{player.jersey_number || '00'}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-gray-900">
                  {statKey === 'avg' ? `.${Math.round(player[statKey] * 1000).toString().padStart(3, '0')}` : player[statKey]}
                </p>
                <p className="text-xs text-gray-600">{statLabel}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Rankings de la Liga</h1>
          <p className="text-gray-600 mt-2">Mejores rendimientos de la temporada</p>
        </div>
        <div className="text-sm text-gray-600 bg-green-50 px-3 py-2 rounded-lg">
          <Star className="h-4 w-4 inline mr-1" />
          {playersWithStats.length} jugadores registrados
        </div>
      </div>

      {/* RANKINGS ESPECIALES - Título Principal */}
      <div className="text-center py-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border-2 border-green-200">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🏆 RANKINGS ESPECIALES 🏆</h2>
        <p className="text-gray-600">Los mejores jugadores en cada categoría</p>
      </div>

      {/* Top 10 Mejores Bateadores */}
      <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-1">
        <RankingCard
          title="🥇 Top 10 Mejores Bateadores"
          players={topBatters}
          statKey="avg"
          statLabel="PROMEDIO"
          icon={<Trophy className="h-6 w-6 text-yellow-600" />}
          bgColor="bg-white"
        />
      </div>

      {/* Grid de Rankings Especiales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 3 Mejores Pitchers */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-1">
          <RankingCard
            title="⚾ Top 3 Mejores Pitchers"
            players={topPitchers}
            statKey="strikeouts"
            statLabel="PONCHES"
            icon={<Target className="h-6 w-6 text-blue-600" />}
            bgColor="bg-white"
          />
        </div>

        {/* Top 5 en Carreras Impulsadas */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-1">
          <RankingCard
            title="🚀 Top 5 en Carreras Impulsadas"
            players={topRBI}
            statKey="rbi"
            statLabel="RBI"
            icon={<Zap className="h-6 w-6 text-green-600" />}
            bgColor="bg-white"
          />
        </div>

        {/* Top 5 en Dobles */}
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-1">
          <RankingCard
            title="⚡ Top 5 en Dobles"
            players={topDoubles}
            statKey="doubles"
            statLabel="DOBLES"
            icon={<TrendingUp className="h-6 w-6 text-purple-600" />}
            bgColor="bg-white"
          />
        </div>

        {/* Top 5 en Home Runs */}
        <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-lg p-1">
          <RankingCard
            title="💥 Top 5 en Home Runs"
            players={topHomeRuns}
            statKey="home_runs"
            statLabel="HOME RUNS"
            icon={<Target className="h-6 w-6 text-red-600" />}
            bgColor="bg-white"
          />
        </div>
      </div>

      {/* Top 5 Pitchers con Más Ponches */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg p-1">
        <RankingCard
          title="🔥 Top 5 Pitchers con Más Ponches"
          players={topStrikeouts}
          statKey="strikeouts"
          statLabel="PONCHES"
          icon={<Activity className="h-6 w-6 text-indigo-600" />}
          bgColor="bg-white"
        />
      </div>

      {/* Estadísticas Generales de la Liga */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center">
          <Medal className="h-5 w-5 text-gray-600 mr-2" />
          Estadísticas Generales de la Liga
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{players.length}</p>
            <p className="text-sm text-gray-600 font-medium">Total Jugadores</p>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <p className="text-3xl font-bold text-blue-600">{playersWithStats.filter(p => p.at_bats > 0).length}</p>
            <p className="text-sm text-gray-600 font-medium">Jugadores Activos</p>
          </div>
          <div className="text-center p-4 bg-orange-50 rounded-lg">
            <p className="text-3xl font-bold text-orange-600">
              .{Math.round((playersWithStats.filter(p => p.at_bats > 0).reduce((sum, p) => sum + p.avg, 0) / playersWithStats.filter(p => p.at_bats > 0).length) * 1000) || 0}
            </p>
            <p className="text-sm text-gray-600 font-medium">Promedio Liga</p>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <p className="text-3xl font-bold text-purple-600">
              {playersWithStats.reduce((sum, p) => sum + p.home_runs, 0)}
            </p>
            <p className="text-sm text-gray-600 font-medium">Total Home Runs</p>
          </div>
        </div>
      </div>

      {playersWithStats.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No hay jugadores registrados</h3>
          <p className="mt-1 text-sm text-gray-500">
            Los rankings aparecerán una vez que se registren jugadores y estadísticas.
          </p>
        </div>
      )}
    </div>
  );
}