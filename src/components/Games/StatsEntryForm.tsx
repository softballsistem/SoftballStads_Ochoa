import React, { useState, useEffect, useCallback } from 'react';
import { playersApi, playerStatsApi } from '../../services/api';
import type { PlayerWithTeamAndStats, GameWithTeamNames } from '../../lib/supabase';
import { Save } from 'lucide-react';
import { PlayerStat } from '../../types';

interface StatsEntryFormProps {
  game: GameWithTeamNames;
  onClose: () => void;
}

const defaultStat: PlayerStat = {
  player_id: '',
  game_id: '',
  at_bats: 0,
  hits: 0,
  runs: 0,
  rbi: 0,
  doubles: 0,
  triples: 0,
  home_runs: 0,
  walks: 0,
  strikeouts: 0,
  stolen_bases: 0,
  errors: 0,
};

export function StatsEntryForm({ game, onClose }: StatsEntryFormProps) {
  const [players, setPlayers] = useState<PlayerWithTeamAndStats[]>([]);
  const [playerStats, setPlayerStats] = useState<{ [key: string]: PlayerStat }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const loadData = useCallback(async () => {
    try {
      if (!game.home_team_id || !game.away_team_id) {
        setPlayers([]);
        setLoading(false);
        return;
      }
      // Get players for the specific game
      const gamePlayers = await playersApi.getPlayersForGame(game.home_team_id, game.away_team_id);
      setPlayers(gamePlayers);

      // Load existing stats for this game
      const existingStats = await playerStatsApi.getByGame(game.id);
      const statsMap: { [key: string]: PlayerStat } = {};
      
      existingStats.forEach(stat => {
        if (stat.player_id) {
          statsMap[stat.player_id] = stat;
        }
      });

      // Initialize empty stats for players without existing data
      gamePlayers.forEach(player => {
        if (!statsMap[player.id]) {
          statsMap[player.id] = {
            ...defaultStat,
            player_id: player.id,
            game_id: game.id,
          };
        }
      });

      setPlayerStats(statsMap);
    } catch (error) {
      console.error('Error loading stats data:', error);
    } finally {
      setLoading(false);
    }
  }, [game.id, game.home_team_id, game.away_team_id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const updateStat = (playerId: string, field: keyof PlayerStat, value: number) => {
    setPlayerStats(prev => ({
      ...prev,
      [playerId]: {
        ...prev[playerId],
        [field]: Math.max(0, value),
      },
    }));
  };

  const saveStats = async () => {
    setSaving(true);
    setStatusMessage(null);
    try {
      await playerStatsApi.upsertMany(Object.values(playerStats));
      setStatusMessage({ type: 'success', message: 'Statistics saved successfully!' });
      setTimeout(() => {
        onClose();
      }, 1500); // Close modal after a short delay
    } catch (error) {
      console.error('Error saving stats:', error);
      setStatusMessage({ type: 'error', message: 'Error saving statistics. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const calculateScore = (teamPlayers: PlayerWithTeamAndStats[]) => {
    return teamPlayers.reduce((total, player) => {
      return total + (playerStats[player.id]?.runs || 0);
    }, 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  const homeTeamPlayers = players.filter(p => p.team_id === game.home_team_id);
  const awayTeamPlayers = players.filter(p => p.team_id === game.away_team_id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Player Statistics</h3>
        <div className="flex items-center space-x-4">
          {statusMessage && (
            <div className={`text-sm ${statusMessage.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>
              {statusMessage.message}
            </div>
          )}
          <button
            onClick={saveStats}
            disabled={saving}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save All Stats'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Home Team */}
        {homeTeamPlayers.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              {game.home_team?.name || 'Home Team'} - Score: {calculateScore(homeTeamPlayers)}
            </h4>
            <PlayerStatTable players={homeTeamPlayers} stats={playerStats} onUpdate={updateStat} />
          </div>
        )}

        {/* Away Team */}
        {awayTeamPlayers.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              {game.away_team?.name || 'Away Team'} - Score: {calculateScore(awayTeamPlayers)}
            </h4>
            <PlayerStatTable players={awayTeamPlayers} stats={playerStats} onUpdate={updateStat} />
          </div>
        )}
      </div>

      {players.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500">No players found for the teams in this game.</p>
        </div>
      )}
    </div>
  );
}

interface PlayerStatTableProps {
  players: PlayerWithTeamAndStats[];
  stats: { [key: string]: PlayerStat };
  onUpdate: (playerId: string, field: keyof PlayerStat, value: number) => void;
}

function PlayerStatTable({ players, stats, onUpdate }: PlayerStatTableProps) {
  const statFields: { key: keyof PlayerStat; label: string }[] = [
    { key: 'at_bats', label: 'AB' },
    { key: 'hits', label: 'H' },
    { key: 'runs', label: 'R' },
    { key: 'rbi', label: 'RBI' },
    { key: 'doubles', label: '2B' },
    { key: 'triples', label: '3B' },
    { key: 'home_runs', label: 'HR' },
    { key: 'walks', label: 'BB' },
    { key: 'strikeouts', label: 'SO' },
    { key: 'stolen_bases', label: 'SB' },
    { key: 'errors', label: 'E' },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Player
            </th>
            {statFields.map(field => (
              <th key={field.key} scope="col" className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                {field.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {players.map(player => (
            <tr key={player.id}>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-8 w-8">
                    <div className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                      <span className="text-xs font-medium text-green-800">
                        #{player.jersey_number || '00'}
                      </span>
                    </div>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{player.name}</p>
                    <p className="text-xs text-gray-600">{player.position}</p>
                  </div>
                </div>
              </td>
              {statFields.map(field => (
                <td key={field.key} className="px-2 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-center">
                    <button
                      onClick={() => onUpdate(player.id, field.key, (stats[player.id]?.[field.key] || 0) - 1)}
                      className="w-6 h-6 rounded-l-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs font-medium"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={stats[player.id]?.[field.key] || 0}
                      onChange={(e) => onUpdate(player.id, field.key, parseInt(e.target.value) || 0)}
                      className="w-12 h-6 text-center text-xs border-t border-b border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500"
                      min="0"
                    />
                    <button
                      onClick={() => onUpdate(player.id, field.key, (stats[player.id]?.[field.key] || 0) + 1)}
                      className="w-6 h-6 rounded-r-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs font-medium"
                    >
                      +
                    </button>
                  </div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}