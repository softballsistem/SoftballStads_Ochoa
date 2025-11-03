import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import Select from 'react-select';
import { debounce } from 'lodash';
import { playersApi, gamesApi, playerStatsApi } from '../../services/api';
import type { Database, PlayerWithTeamAndStats, GameWithTeamNames, PlayerStatWithGame } from '../../lib/supabase';
import { BarChart2, CheckCircle, AlertCircle, Hash, TrendingUp, TrendingDown, Swords, Shield, Wind, Edit, Trash2 } from 'lucide-react';
import { Skeleton } from '../../components/Skeleton';

type PlayerStatForm = Database['public']['Tables']['player_stats']['Insert'] & { id?: string };

const statFields: { name: keyof PlayerStatForm, label: string, icon: React.ElementType, category: string }[] = [
  { name: 'at_bats', label: 'Turnos al Bat', icon: Hash, category: 'Bateo' },
  { name: 'hits', label: 'Hits', icon: BarChart2, category: 'Bateo' },
  { name: 'runs', label: 'Carreras', icon: TrendingUp, category: 'Bateo' },
  { name: 'rbi', label: 'Carreras Impulsadas', icon: TrendingUp, category: 'Bateo' },
  { name: 'doubles', label: 'Dobles', icon: Hash, category: 'Bateo' },
  { name: 'triples', label: 'Triples', icon: Hash, category: 'Bateo' },
  { name: 'home_runs', label: 'Home Runs', icon: Swords, category: 'Bateo' },
  { name: 'walks', label: 'Bases por Bolas', icon: Shield, category: 'Bateo' },
  { name: 'strikeouts', label: 'Ponches', category: 'Bateo', icon: TrendingDown },
  { name: 'stolen_bases', label: 'Bases Robadas', icon: Wind, category: 'Corrido' },
  { name: 'errors', label: 'Errores', icon: AlertCircle, category: 'Fildeo' },
];

export function StatsUploader() {
  const { register, handleSubmit, reset, control } = useForm<PlayerStatForm>();
  const [players, setPlayers] = useState<PlayerWithTeamAndStats[]>([]);
  const [games, setGames] = useState<GameWithTeamNames[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStatWithGame[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<{ value: string; label: string } | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [editingStatId, setEditingStatId] = useState<string | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(false);
  const [isPlayersLoading, setIsPlayersLoading] = useState(false);
  const [isGamesLoading, setIsGamesLoading] = useState(false);

  const [playerPage, setPlayerPage] = useState(1);
  const [hasMorePlayers, setHasMorePlayers] = useState(true);
  const [playerSearch, setPlayerSearch] = useState('');

  const [gamePage, setGamePage] = useState(1);
  const [hasMoreGames, setHasMoreGames] = useState(true);
  const [step, setStep] = useState(1);

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const debouncedPlayerSearch = useMemo(
    () => debounce((search) => {
      setPlayerSearch(search);
      setPlayers([]);
      setPlayerPage(1);
      setHasMorePlayers(true);
    }, 500),
    [setPlayerSearch, setPlayers, setPlayerPage, setHasMorePlayers]
  );

  useEffect(() => {
    if (!hasMorePlayers) return;
    async function loadPlayers() {
      setIsPlayersLoading(true);
      try {
        const { players: newPlayers, hasMore } = await playersApi.getAll({ page: playerPage, search: playerSearch });
        setPlayers(prev => playerPage === 1 ? newPlayers : [...prev, ...newPlayers]);
        setHasMorePlayers(hasMore);
      } catch {
        setNotification({ type: 'error', message: 'Error al cargar jugadores.' });
      } finally {
        setIsPlayersLoading(false);
      }
    }
    loadPlayers();
  }, [playerPage, playerSearch, hasMorePlayers]);

  useEffect(() => {
    if (!hasMoreGames) return;
    async function loadGames() {
      setIsGamesLoading(true);
      try {
        const { games: newGames, hasMore } = await gamesApi.getAll({ page: gamePage });
        setGames(prev => gamePage === 1 ? newGames : [...prev, ...newGames]);
        setHasMoreGames(hasMore);
      } catch {
        setNotification({ type: 'error', message: 'Error al cargar juegos.' });
      } finally {
        setIsGamesLoading(false);
      }
    }
    loadGames();
  }, [gamePage, hasMoreGames]);
    useEffect(() => {
    if (selectedPlayer) {
      setIsStatsLoading(true);
      playerStatsApi.getByPlayer(selectedPlayer.value)
        .then(setPlayerStats)
        .finally(() => setIsStatsLoading(false));
    }
  }, [selectedPlayer]);

  const playerOptions = useMemo(() => 
    players.map(p => ({ 
      value: p.id, 
      label: `${p.name} (${p.teams?.name || 'Sin equipo'})` 
    })), 
    [players]
  );

  const gameOptions = useMemo(() => 
    games.map(g => ({ 
      value: g.id, 
      label: `${new Date(g.date).toLocaleDateString()} - ${g.home_team?.name || 'TBD'} vs ${g.away_team?.name || 'TBD'}` 
    })), 
    [games]
  );

  const onSubmit: SubmitHandler<PlayerStatForm> = async (data) => {
    const oldPlayerStats = [...playerStats];
    setIsLoading(true);
    setNotification(null);

    // Optimistically update the UI
    if (editingStatId) {
      setPlayerStats(prev => prev.map(s => s.id === editingStatId ? { ...s, ...data } : s));
    } else {
      // For new stats, we don't have a game object, so we can't display it properly.
      // We will just show the stats and 'N/A' for the game.
      // A better approach would be to have the full game object available.
      const newStat: PlayerStatWithGame = { ...data, id: 'temp-id', games: null };
      setPlayerStats(prev => [...prev, newStat]);
    }

    try {
      const payload = { ...data, id: editingStatId || undefined };
      await playerStatsApi.upsertOne(payload);
      setNotification({ type: 'success', message: `Estadísticas ${editingStatId ? 'actualizadas' : 'guardadas'} exitosamente!` });
      reset();
      setEditingStatId(null);
    } catch (err) {
      setPlayerStats(oldPlayerStats);
      if (err instanceof Error) {
        setNotification({ type: 'error', message: err.message || 'Error al guardar estadísticas.' });
      } else {
        setNotification({ type: 'error', message: 'Error al guardar estadísticas.' });
      }
    } finally {
      setIsLoading(false);
      if (selectedPlayer) {
        playerStatsApi.getByPlayer(selectedPlayer.value).then(setPlayerStats);
      }
    }
  };

  const handleEdit = (stat: PlayerStatWithGame) => {
    setEditingStatId(stat.id);
    reset(stat);
  };

  const handleDelete = async (statId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta estadística?')) {
      const oldPlayerStats = [...playerStats];
      setPlayerStats(prev => prev.filter(s => s.id !== statId));
      setIsDeleting(statId);
      setNotification(null);
      try {
        await playerStatsApi.delete(statId);
        setNotification({ type: 'success', message: 'Estadística eliminada exitosamente!' });
      } catch (err) {
        setPlayerStats(oldPlayerStats);
        if (err instanceof Error) {
          setNotification({ type: 'error', message: err.message || 'Error al eliminar la estadística.' });
        } else {
          setNotification({ type: 'error', message: 'Error al eliminar la estadística.' });
        }
      } finally {
        setIsDeleting(null);
      }
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <div className="flex items-center mb-4">
        <BarChart2 className="h-8 w-8 mr-2 text-indigo-600" />
        <h1 className="text-2xl font-bold">Gestión de Estadísticas de Jugadores</h1>
      </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 bg-white p-6 rounded-lg shadow-md mb-8">
              {notification && (
                <div className={`flex items-center p-4 rounded-md ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {notification.type === 'success' ? <CheckCircle className="h-5 w-5 mr-2" /> : <AlertCircle className="h-5 w-5 mr-2" />}
                  {notification.message}
                </div>
              )}
      
              {step === 1 && (
                <div>
                  <label htmlFor="player_id" className="block text-sm font-medium text-gray-700 mb-1">Jugador</label>
                  <Controller
                    name="player_id"
                    control={control}
                    rules={{ required: 'El jugador es obligatorio' }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={playerOptions}
                        isSearchable
                        placeholder="Buscar y seleccionar jugador..."
                        onInputChange={debouncedPlayerSearch}
                        value={selectedPlayer}
                        onChange={(option) => {
                          setSelectedPlayer(option);
                          field.onChange(option?.value);
                        }}
                        onMenuScrollToBottom={() => setPlayerPage(prev => prev + 1)}
                        isLoading={isPlayersLoading}
                      />
                    )}
                  />
                </div>
              )}
      
              {step === 2 && (
                <div>
                  <label htmlFor="game_id" className="block text-sm font-medium text-gray-700 mb-1">Juego</label>
                  <Controller
                    name="game_id"
                    control={control}
                    rules={{ required: 'El juego es obligatorio' }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={gameOptions}
                        isSearchable
                        placeholder="Seleccionar juego..."
                        onMenuScrollToBottom={() => setGamePage(prev => prev + 1)}
                        isLoading={isGamesLoading}
                        value={gameOptions.find(g => g.value === field.value)}
                        onChange={(option) => field.onChange(option?.value)}
                      />
                    )}
                  />
                </div>
              )}
      
              {step === 3 && (
                <div className="pt-4 border-t">
                  {Object.entries(statFields.reduce((acc, field) => {
                    if (!acc[field.category]) {
                      acc[field.category] = [];
                    }
                    acc[field.category].push(field);
                    return acc;
                  }, {} as Record<string, typeof statFields>)).map(([category, fields]) => (
                    <div key={category} className="mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-4">{category}</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {fields.map(field => (
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
                    </div>
                  ))}
                </div>
              )}
      
              <div className="pt-4 border-t flex items-center gap-4">
                {step > 1 && (
                  <button type="button" onClick={prevStep} className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    Atrás
                  </button>
                )}
                {step < 3 ? (
                  <button type="button" onClick={nextStep} disabled={!selectedPlayer} className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                    Siguiente
                  </button>
                ) : (
                  <button type="submit" disabled={isLoading} className="w-full inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                    {isLoading ? (editingStatId ? 'Actualizando...' : 'Guardando...') : (editingStatId ? 'Actualizar Estadística' : 'Guardar Estadística')}
                  </button>
                )}
                {editingStatId && (
                  <button type="button" onClick={() => { reset(); setEditingStatId(null); setStep(1); }} className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                    Cancelar Edición
                  </button>
                )}
              </div>
            </form>
      {selectedPlayer && (
        <div className="mt-8">
          <h2 className="text-xl font-bold mb-4">Estadísticas de {selectedPlayer.label}</h2>
          <div className="overflow-x-auto bg-white rounded-lg shadow-md">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Juego</th>
                  {statFields.map(f => <th key={f.name} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{f.label}</th>)}
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isStatsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      {statFields.map(f => (
                        <td key={f.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <Skeleton className="h-4 w-8" />
                        </td>
                      ))}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                        <Skeleton className="h-5 w-5" />
                        <Skeleton className="h-5 w-5" />
                      </td>
                    </tr>
                  ))
                ) : (
                  playerStats.map(stat => (
                    <tr key={stat.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {stat.games ? new Date(stat.games.date).toLocaleDateString() : 'N/A'}
                      </td>
                      {statFields.map(f => <td key={f.name} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{stat[f.name]}</td>)}
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-2">
                        <button onClick={() => handleEdit(stat)} className="text-indigo-600 hover:text-indigo-900"><Edit className="h-5 w-5" /></button>
                        <button onClick={() => handleDelete(stat.id)} disabled={isDeleting === stat.id} className="text-red-600 hover:text-red-900 disabled:opacity-50">
                          {isDeleting === stat.id ? '...' : <Trash2 className="h-5 w-5" />}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}