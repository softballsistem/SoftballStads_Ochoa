import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Calendar, MapPin, Trophy } from 'lucide-react';
import { gamesApi, teamsApi } from '../services/api';
import type { GameWithTeamNames, Team } from '../lib/supabase';
import { GameForm } from '../components/Games/GameForm';
import { StatsEntryForm } from '../components/Games/StatsEntryForm';
import { Modal } from '../components/UI/Modal';

export function Games() {
  const [games, setGames] = useState<GameWithTeamNames[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGameForm, setShowGameForm] = useState(false);
  const [showStatsForm, setShowStatsForm] = useState(false);
  const [editingGame, setEditingGame] = useState<GameWithTeamNames | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameWithTeamNames | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [gamesData, teamsData] = await Promise.all([
        gamesApi.getAll(),
        teamsApi.getAll(),
      ]);
      setGames(gamesData);
      setTeams(teamsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGameSubmit = async (gameData: any) => {
    try {
      if (editingGame) {
        await gamesApi.update(editingGame.id, gameData);
      } else {
        await gamesApi.create(gameData);
      }
      setShowGameForm(false);
      setEditingGame(null);
      loadData();
    } catch (error) {
      console.error('Error saving game:', error);
    }
  };

  const handleEdit = (game: GameWithTeamNames) => {
    setEditingGame(game);
    setShowGameForm(true);
  };

  const handleDelete = async (gameId: string) => {
    if (window.confirm('Are you sure you want to delete this game? This will also delete all associated statistics.')) {
      try {
        await gamesApi.delete(gameId);
        loadData();
      } catch (error) {
        console.error('Error deleting game:', error);
      }
    }
  };

  const handleEnterStats = (game: GameWithTeamNames) => {
    setSelectedGame(game);
    setShowStatsForm(true);
  };

  const closeGameForm = () => {
    setShowGameForm(false);
    setEditingGame(null);
  };

  const closeStatsForm = () => {
    setShowStatsForm(false);
    setSelectedGame(null);
    loadData();
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
        <h1 className="text-2xl font-bold text-gray-900">Games</h1>
        <button
          onClick={() => setShowGameForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Schedule Game
        </button>
      </div>

      {games.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No games scheduled</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by scheduling your first game.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowGameForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Schedule Game
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {games.map((game) => (
            <div key={game.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Trophy className="h-6 w-6 text-green-600 mr-2" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {game.home_team?.name || 'TBD'} vs {game.away_team?.name || 'TBD'}
                    </h3>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{new Date(game.date).toLocaleDateString()}</span>
                      {game.location && (
                        <>
                          <MapPin className="h-4 w-4 mr-1 ml-3" />
                          <span>{game.location}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(game)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(game.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {game.home_score}
                  </div>
                  <div className="text-sm text-gray-600">
                    {game.home_team?.name || 'Home'}
                  </div>
                </div>
                
                <div className="text-center">
                  <div className="text-lg font-medium text-gray-500">vs</div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    game.status === 'completed' ? 'bg-green-100 text-green-800' :
                    game.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {game.status.replace('_', ' ')}
                  </span>
                </div>
                
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">
                    {game.away_score}
                  </div>
                  <div className="text-sm text-gray-600">
                    {game.away_team?.name || 'Away'}
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex space-x-3">
                  <button
                    onClick={() => handleEnterStats(game)}
                    className="flex-1 bg-blue-50 text-blue-700 text-sm font-medium py-2 px-4 rounded-md hover:bg-blue-100 transition-colors"
                  >
                    Enter Stats
                  </button>
                  {game.status === 'scheduled' && (
                    <button
                      onClick={() => gamesApi.update(game.id, { status: 'in_progress' }).then(loadData)}
                      className="bg-green-50 text-green-700 text-sm font-medium py-2 px-4 rounded-md hover:bg-green-100 transition-colors"
                    >
                      Start Game
                    </button>
                  )}
                  {game.status === 'in_progress' && (
                    <button
                      onClick={() => gamesApi.update(game.id, { status: 'completed' }).then(loadData)}
                      className="bg-orange-50 text-orange-700 text-sm font-medium py-2 px-4 rounded-md hover:bg-orange-100 transition-colors"
                    >
                      End Game
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showGameForm}
        onClose={closeGameForm}
        title={editingGame ? 'Edit Game' : 'Schedule New Game'}
      >
        <GameForm
          game={editingGame}
          teams={teams}
          onSubmit={handleGameSubmit}
          onCancel={closeGameForm}
        />
      </Modal>

      <Modal
        isOpen={showStatsForm}
        onClose={closeStatsForm}
        title={selectedGame ? `Enter Stats - ${selectedGame.home_team?.name || 'Home'} vs ${selectedGame.away_team?.name || 'Away'}` : ''}
        size="large"
      >
        {selectedGame && (
          <StatsEntryForm
            game={selectedGame}
            onClose={closeStatsForm}
          />
        )}
      </Modal>
    </div>
  );
}