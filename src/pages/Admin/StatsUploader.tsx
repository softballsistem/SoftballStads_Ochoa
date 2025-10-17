import React, { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { User, Calendar, Hash, BarChart2, TrendingUp, TrendingDown, Swords, Shield, Wind, AlertCircle, CheckCircle } from 'lucide-react';
import { playersApi, gamesApi, playerStatsApi } from '../../services/api';
import type { Database, PlayerWithTeamAndStats, GameWithTeamNames } from '../../lib/supabase';

type PlayerStatForm = Database['public']['Tables']['player_stats']['Insert'];

export function StatsUploader() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PlayerStatForm>();
  const [players, setPlayers] = useState<PlayerWithTeamAndStats[]>([]);
  const [games, setGames] = useState<GameWithTeamNames[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [playersData, gamesData] = await Promise.all([
          playersApi.getAll(),
          gamesApi.getAll(),
        ]);
        setPlayers(playersData);
        setGames(gamesData);
      } catch (err) {
        setNotification({ type: 'error', message: 'Failed to load players or games.' });
      }
    }
    loadData();
  }, []);

  const onSubmit: SubmitHandler<PlayerStatForm> = async (data) => {
    setIsLoading(true);
    setNotification(null);
    try {
      await playerStatsApi.upsert(data);
      setNotification({ type: 'success', message: 'Estadísticas guardadas exitosamente!' });
      reset();
    } catch (err: any) {
      setNotification({ type: 'error', message: err.message || 'Failed to save stats.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <div className="flex items-center mb-4">
        <BarChart2 className="h-8 w-8 mr-2 text-indigo-600" />
        <h1 className="text-2xl font-bold">Cargar Estadísticas de Jugadores</h1>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-6 rounded-lg shadow-md">
        
        {notification && (
          <div className={`flex items-center p-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {notification.type === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> : <AlertCircle className="h-5 w-5 mr-2" />}
            {notification.message}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="relative">
            <label htmlFor="player_id" className="block text-sm font-medium text-gray-700 mb-1">Jugador</label>
            <div className="absolute inset-y-0 left-0 pl-3 pt-7 flex items-center pointer-events-none">
              <User className="h-5 w-5 text-gray-400" />
            </div>
            <select 
              id="player_id" 
              {...register('player_id', { required: 'Player is required' })} 
              className="pl-10 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Selecciona un jugador</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>{player.name}</option>
              ))}
            </select>
            {errors.player_id && <p className="text-red-500 text-xs mt-1">{errors.player_id.message}</p>}
          </div>

          <div className="relative">
            <label htmlFor="game_id" className="block text-sm font-medium text-gray-700 mb-1">Juego</label>
            <div className="absolute inset-y-0 left-0 pl-3 pt-7 flex items-center pointer-events-none">
              <Calendar className="h-5 w-5 text-gray-400" />
            </div>
            <select 
              id="game_id" 
              {...register('game_id', { required: 'Game is required' })} 
              className="pl-10 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">Selecciona un juego</option>
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {new Date(game.date).toLocaleDateString()} - {game.home_team?.name || 'TBD'} vs {game.away_team?.name || 'TBD'}
                </option>
              ))}
            </select>
            {errors.game_id && <p className="text-red-500 text-xs mt-1">{errors.game_id.message}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 pt-4 border-t">
          {statFields.map(field => (
            <div key={field.name} className="relative">
              <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-1">{field.label}</label>
              <div className="absolute inset-y-0 left-0 pl-3 pt-7 flex items-center pointer-events-none">
                <field.icon className="h-5 w-5 text-gray-400" />
              </div>
              <input 
                type="number" 
                id={field.name} 
                {...register(field.name, { required: true, valueAsNumber: true, min: 0 })} 
                defaultValue={0} 
                className="pl-10 mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              />
            </div>
          ))}
        </div>

        <div className="pt-4 border-t">
          <button type="submit" disabled={isLoading} className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
            {isLoading ? 'Guardando...' : 'Guardar Estadísticas'}
          </button>
        </div>
      </form>
    </div>
  );
}

const statFields: { name: keyof PlayerStatForm, label: string, icon: React.ElementType }[] = [
  { name: 'at_bats', label: 'At Bats', icon: Hash },
  { name: 'hits', label: 'Hits', icon: BarChart2 },
  { name: 'runs', label: 'Runs', icon: TrendingUp },
  { name: 'rbi', label: 'RBI', icon: TrendingUp },
  { name: 'doubles', label: 'Doubles', icon: Hash },
  { name: 'triples', label: 'Triples', icon: Hash },
  { name: 'home_runs', label: 'Home Runs', icon: Swords },
  { name: 'walks', label: 'Walks', icon: Shield },
  { name: 'strikeouts', label: 'Strikeouts', icon: TrendingDown },
  { name: 'stolen_bases', label: 'Stolen Bases', icon: Wind },
  { name: 'errors', label: 'Errors', icon: AlertCircle },
];