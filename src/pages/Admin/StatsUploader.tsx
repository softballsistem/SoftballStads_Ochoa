import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { playersApi } from '../../services/api';
import { gamesApi } from '../../services/api';
import { playerStatsApi } from '../../services/api';
import type { PlayerWithTeamAndStats, GameWithTeamNames, PlayerStat } from '../../lib/supabase';

export function StatsUploader() {
  const { register, handleSubmit, reset } = useForm<PlayerStat>();
  const [players, setPlayers] = useState<PlayerWithTeamAndStats[]>([]);
  const [games, setGames] = useState<GameWithTeamNames[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        setError('Failed to load players or games.');
      }
    }
    loadData();
  }, []);

  const onSubmit = async (data: PlayerStat) => {
    setIsLoading(true);
    setError(null);
    try {
      await playerStatsApi.upsert(data);
      reset();
    } catch (err) {
      setError('Failed to save stats.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Cargar Estadísticas de Jugadores</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="player_id" className="block text-sm font-medium text-gray-700">Jugador</label>
          <select id="player_id" {...register('player_id', { required: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
            <option value="">Selecciona un jugador</option>
            {players.map((player) => (
              <option key={player.id} value={player.id}>{player.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="game_id" className="block text-sm font-medium text-gray-700">Juego</label>
          <select id="game_id" {...register('game_id', { required: true })} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm">
            <option value="">Selecciona un juego</option>
            {games.map((game) => (
              <option key={game.id} value={game.id}>{new Date(game.date).toLocaleDateString()} - {game.home_team?.name || 'TBD'} vs {game.away_team?.name || 'TBD'}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="at_bats" className="block text-sm font-medium text-gray-700">At Bats</label>
            <input type="number" id="at_bats" {...register('at_bats', { required: true, valueAsNumber: true })} defaultValue={0} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="hits" className="block text-sm font-medium text-gray-700">Hits</label>
            <input type="number" id="hits" {...register('hits', { required: true, valueAsNumber: true })} defaultValue={0} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="runs" className="block text-sm font-medium text-gray-700">Runs</label>
            <input type="number" id="runs" {...register('runs', { required: true, valueAsNumber: true })} defaultValue={0} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="rbi" className="block text-sm font-medium text-gray-700">RBI</label>
            <input type="number" id="rbi" {...register('rbi', { required: true, valueAsNumber: true })} defaultValue={0} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="doubles" className="block text-sm font-medium text-gray-700">Doubles</label>
            <input type="number" id="doubles" {...register('doubles', { required: true, valueAsNumber: true })} defaultValue={0} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="triples" className="block text-sm font-medium text-gray-700">Triples</label>
            <input type="number" id="triples" {...register('triples', { required: true, valueAsNumber: true })} defaultValue={0} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="home_runs" className="block text-sm font-medium text-gray-700">Home Runs</label>
            <input type="number" id="home_runs" {...register('home_runs', { required: true, valueAsNumber: true })} defaultValue={0} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="walks" className="block text-sm font-medium text-gray-700">Walks</label>
            <input type="number" id="walks" {...register('walks', { required: true, valueAsNumber: true })} defaultValue={0} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="strikeouts" className="block text-sm font-medium text-gray-700">Strikeouts</label>
            <input type="number" id="strikeouts" {...register('strikeouts', { required: true, valueAsNumber: true })} defaultValue={0} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="stolen_bases" className="block text-sm font-medium text-gray-700">Stolen Bases</label>
            <input type="number" id="stolen_bases" {...register('stolen_bases', { required: true, valueAsNumber: true })} defaultValue={0} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" />
          </div>
          <div>
            <label htmlFor="errors" className="block text-sm font-medium text-gray-700">Errors</label>
            <input type="number" id="errors" {...register('errors', { required: true, valueAsNumber: true })} defaultValue={0} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-.indigo-500 sm:text-sm" />
          </div>
        </div>

        <button type="submit" disabled={isLoading} className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          {isLoading ? 'Guardando...' : 'Guardar Estadísticas'}
        </button>
        {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      </form>
    </div>
  );
}