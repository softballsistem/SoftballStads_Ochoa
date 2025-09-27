import React, { useState, useEffect } from 'react';
import { playersApi, playerStatsApi } from '../../services/api';
import type { PlayerWithTeamAndStats, PlayerStatWithPlayer, GameWithTeamNames } from '../../lib/supabase';
import { Save, Plus } from 'lucide-react';

interface StatsEntryFormProps {
  game: GameWithTeamNames;
  onClose: () => void;
}

export function StatsEntryForm({ game, onClose }: StatsEntryFormProps) {
  const [players, setPlayers] = useState<PlayerWithTeamAndStats[]>([]);
  const [playerStats, setPlayerStats] = useState<{ [key: string]: any }>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, [game]);

  const loadData = async () => {
    try {
      // Get all players from both teams
      const allPlayers = await playersApi.getAll();
      const gamePlayers = allPlayers.filter(
        player => 
          player.team_id === game.home_team_id || 
          player.team_id === game.away_team_id
      );
      setPlayers(gamePlayers);

      // Load existing stats for this game
      const existingStats = await playerStatsApi.getByGame(game.id);
      const statsMap: { [key: string]: any } = {};
      
      existingStats.forEach(stat => {
        if (stat.player_id) {
          statsMap[stat.player_id] = stat;
        }
      });

      // Initialize empty stats for players without existing data
      gamePlayers.forEach(player => {
        if (!statsMap[player.id]) {
          statsMap[player.id] = {
            player_id: player.id,
            game_id: game.id,
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
        }
      });

      setPlayerStats(statsMap);
    } catch (error) {
      console.error('Error loading stats data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStat = (playerId: string, field: string, value: number) => {
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
    try {
      const promises = Object.values(playerStats).map(stat => 
        playerStatsApi.upsert(stat)
      );
      await Promise.all(promises);
      // Show success message
      alert('Statistics saved successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving stats:', error);
      alert('Error saving statistics. Please try again.');
    } finally {
      setSaving(false);
    }
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
        <button
          onClick={saveStats}
          disabled={saving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
        >
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save All Stats'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Home Team */}
        {homeTeamPlayers.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              {game.home_team?.name || 'Home Team'}
            </h4>
            <div className="space-y-4">
              {homeTeamPlayers.map(player => (
                <PlayerStatRow 
                  key={player.id}
                  player={player}
                  stats={playerStats[player.id] || {}}
                  onUpdate={(field, value) => updateStat(player.id, field, value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Away Team */}
        {awayTeamPlayers.length > 0 && (
          <div>
            <h4 className="text-md font-medium text-gray-900 mb-3">
              {game.away_team?.name || 'Away Team'}
            </h4>
            <div className="space-y-4">
              {awayTeamPlayers.map(player => (
                <PlayerStatRow 
                  key={player.id}
                  player={player}
                  stats={playerStats[player.id] || {}}
                  onUpdate={(field, value) => updateStat(player.id, field, value)}
                />
              ))}
            </div>
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

interface PlayerStatRowProps {
  player: PlayerWithTeamAndStats;
  stats: any;
  onUpdate: (field: string, value: number) => void;
}

function PlayerStatRow({ player, stats, onUpdate }: PlayerStatRowProps) {
  const statFields = [
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
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-center mb-3">
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

      <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {statFields.map(field => (
          <div key={field.key} className="text-center">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {field.label}
            </label>
            <div className="flex items-center">
              <button
                onClick={() => onUpdate(field.key, (stats[field.key] || 0) - 1)}
                className="w-6 h-6 rounded-l-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs font-medium"
              >
                -
              </button>
              <input
                type="number"
                value={stats[field.key] || 0}
                onChange={(e) => onUpdate(field.key, parseInt(e.target.value) || 0)}
                className="w-12 h-6 text-center text-xs border-t border-b border-gray-300 focus:outline-none focus:ring-1 focus:ring-green-500"
                min="0"
              />
              <button
                onClick={() => onUpdate(field.key, (stats[field.key] || 0) + 1)}
                className="w-6 h-6 rounded-r-md bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-xs font-medium"
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}