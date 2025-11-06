import React, { useState, useEffect, useMemo } from 'react';
import { useForm, Controller, SubmitHandler } from 'react-hook-form';
import Select from 'react-select';
import { debounce } from 'lodash';
import { playersApi, gamesApi, playerStatsApi } from '../../services/api';
import type { Database, PlayerWithTeamAndStats, GameWithTeamNames, PlayerStatWithGame } from '../../lib/supabase';
import { BarChart2, CheckCircle, AlertCircle, Hash, TrendingUp, TrendingDown, Swords, Shield, Wind, Edit, Trash2, UploadCloud } from 'lucide-react';
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

function StatsUploader() {
  const { register, handleSubmit, reset, control } = useForm<PlayerStatForm>();
  const [players, setPlayers] = useState<PlayerWithTeamAndStats[]>([]);
  const [games, setGames] = useState<GameWithTeamNames[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStatWithGame[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<{ value: string; label: string } | null>(null);
  const [selectedGame, setSelectedGame] = useState<{ value: string; label: string } | null>(null);

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

    if (!selectedPlayer || !selectedGame) {
      setNotification({ type: 'error', message: 'Por favor selecciona un jugador y un juego.' });
      setIsLoading(false);
      return;
    }

    const statData = {
      ...data,
      player_id: selectedPlayer.value,
      game_id: selectedGame.value,
    };

    // Optimistically update the UI
    if (editingStatId) {
      setPlayerStats(prev => prev.map(s => s.id === editingStatId ? { ...s, ...statData } : s));
    } else {
      const newStat: PlayerStatWithGame = { ...statData, id: 'temp-id', games: null };
      setPlayerStats(prev => [...prev, newStat]);
    }

    try {
      const payload = { ...statData, id: editingStatId || undefined };
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    setNotification(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim() !== '');
      if (lines.length === 0) {
        setNotification({ type: 'error', message: 'El archivo CSV está vacío.' });
        setIsLoading(false);
        return;
      }

      const headers = lines[0].split(',').map(h => h.trim());
      const expectedHeaders = ['player_name', 'game_date', 'home_team', 'away_team', 'at_bats', 'hits', 'runs', 'rbi', 'doubles', 'triples', 'home_runs', 'walks', 'strikeouts', 'stolen_bases', 'errors'];

      if (JSON.stringify(headers) !== JSON.stringify(expectedHeaders)) {
        setNotification({ type: 'error', message: `Formato de encabezado CSV incorrecto. Se esperaba: ${expectedHeaders.join(', ')}` });
        setIsLoading(false);
        return;
      }

      const statsToUpload: PlayerStatForm[] = [];
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        const rowData: { [key: string]: string } = {};
        headers.forEach((header, index) => {
          rowData[header] = values[index];
        });

        try {
          // Find player ID
          const playerResponse = await playersApi.getAll({ search: rowData.player_name });
          const player = playerResponse.players.find(p => p.name === rowData.player_name);
          if (!player) {
            errors.push(`Línea ${i + 1}: Jugador '${rowData.player_name}' no encontrado.`);
            continue;
          }

          // Find game ID
          const gameResponse = await gamesApi.getAll(); // Fetch all games for now, can optimize later
          const game = gameResponse.games.find(g => 
            new Date(g.date).toLocaleDateString() === new Date(rowData.game_date).toLocaleDateString() &&
            g.home_team?.name === rowData.home_team &&
            g.away_team?.name === rowData.away_team
          );
          if (!game) {
            errors.push(`Línea ${i + 1}: Juego del ${rowData.game_date} entre ${rowData.home_team} y ${rowData.away_team} no encontrado.`);
            continue;
          }

          const stat: PlayerStatForm = {
            player_id: player.id,
            game_id: game.id,
            at_bats: parseInt(rowData.at_bats || '0'),
            hits: parseInt(rowData.hits || '0'),
            runs: parseInt(rowData.runs || '0'),
            rbi: parseInt(rowData.rbi || '0'),
            doubles: parseInt(rowData.doubles || '0'),
            triples: parseInt(rowData.triples || '0'),
            home_runs: parseInt(rowData.home_runs || '0'),
            walks: parseInt(rowData.walks || '0'),
            strikeouts: parseInt(rowData.strikeouts || '0'),
            stolen_bases: parseInt(rowData.stolen_bases || '0'),
            errors: parseInt(rowData.errors || '0'),
          };
          statsToUpload.push(stat);
        } catch (err) {
          errors.push(`Línea ${i + 1}: Error al procesar (${err instanceof Error ? err.message : 'Error desconocido'}).`);
        }
      }

      if (errors.length > 0) {
        setNotification({ type: 'error', message: `Errores en el archivo: ${errors.join('; ')}` });
        setIsLoading(false);
        return;
      }

      if (statsToUpload.length === 0) {
        setNotification({ type: 'error', message: 'No se encontraron estadísticas válidas para subir.' });
        setIsLoading(false);
        return;
      }

      try {
        await playerStatsApi.upsertMany(statsToUpload);
        setNotification({ type: 'success', message: `Se subieron ${statsToUpload.length} estadísticas exitosamente!` });
      } catch (err) {
        setNotification({ type: 'error', message: `Error al subir estadísticas: ${err instanceof Error ? err.message : 'Error desconocido'}` });
      }
      setIsLoading(false);
    };

    reader.onerror = () => {
      setNotification({ type: 'error', message: 'Error al leer el archivo.' });
      setIsLoading(false);
    };

    reader.readAsText(file);
  };

  return (
    <div className="p-4 max-w-7xl mx-auto">
      <div className="flex items-center mb-6">
        <BarChart2 className="h-8 w-8 mr-3 text-indigo-600" />
        <h1 className="text-3xl font-bold text-gray-900">Gestión de Estadísticas</h1>
      </div>

      {notification && (
        <div className={`flex items-center p-4 mb-6 rounded-lg shadow-md ${notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {notification.type === 'success' ? <CheckCircle className="h-6 w-6 mr-3" /> : <AlertCircle className="h-6 w-6 mr-3" />}
          <span className="font-medium">{notification.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Manual Stat Entry */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Entrada Manual</h2>
          
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="player_id" className="block text-sm font-medium text-gray-700 mb-2">Jugador</label>
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
                      classNamePrefix="react-select"
                    />
                  )}
                />
              </div>

              <div>
                <label htmlFor="game_id" className="block text-sm font-medium text-gray-700 mb-2">Juego</label>
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
                      value={selectedGame}
                      onChange={(option) => {
                        setSelectedGame(option);
                        field.onChange(option?.value);
                      }}
                      classNamePrefix="react-select"
                    />
                  )}
                />
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Estadísticas del Juego</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {statFields.map(field => (
                  <div key={field.name} className="relative">
                    <label htmlFor={field.name} className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                    <div className="absolute left-3 top-10 transform -translate-y-1/2 text-gray-400">
                      <field.icon className="h-5 w-5" />
                    </div>
                    <input 
                      type="number" 
                      id={field.name} 
                      {...register(field.name, { required: true, valueAsNumber: true, min: 0 })} 
                      defaultValue={0} 
                      className="pl-10 mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-lg py-3"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-6 flex justify-end space-x-4">
              {editingStatId && (
                <button type="button" onClick={() => { reset(); setEditingStatId(null); }} className="px-6 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50">
                  Cancelar Edición
                </button>
              )}
              <button type="submit" disabled={isLoading} className="px-8 py-3 border border-transparent shadow-sm text-sm font-medium rounded-lg text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50">
                {isLoading ? (editingStatId ? 'Actualizando...' : 'Guardando...') : (editingStatId ? 'Actualizar Estadística' : 'Guardar Estadística')}
              </button>
            </div>
          </form>
        </div>

        {/* File Upload */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200 flex flex-col items-center justify-center text-center">
          <UploadCloud className="h-16 w-16 text-indigo-300 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Subir Archivo de Estadísticas</h2>
          <p className="text-gray-600 mb-6 max-w-sm">Sube un archivo CSV con las estadísticas de un juego completo. Asegúrate de que el formato del archivo sea el correcto.</p>
          
          <label htmlFor="file-upload" className="cursor-pointer px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg shadow-md hover:bg-indigo-700 transition-transform transform hover:scale-105">
            {isLoading ? 'Subiendo...' : 'Seleccionar Archivo'}
          </label>
          <input id="file-upload" name="file-upload" type="file" className="sr-only" onChange={handleFileUpload} accept=".csv" />
          
          <p className="text-xs text-gray-500 mt-4">Solo se aceptan archivos .csv</p>
        </div>
      </div>

      {selectedPlayer && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">Estadísticas de {selectedPlayer.label}</h2>
          <div className="overflow-x-auto bg-white rounded-2xl shadow-lg border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Juego</th>
                  {statFields.map(f => <th key={f.name} className="px-8 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">{f.label}</th>)}
                  <th className="px-8 py-4 text-left text-sm font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isStatsLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <tr key={i}>
                      <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-500"><Skeleton className="h-5 w-24" /></td>
                      {statFields.map(f => (
                        <td key={f.name} className="px-8 py-5 whitespace-nowrap text-sm text-gray-900"><Skeleton className="h-5 w-10" /></td>
                      ))}
                      <td className="px-8 py-5 whitespace-nowrap text-sm font-medium flex space-x-4"><Skeleton className="h-6 w-6" /><Skeleton className="h-6 w-6" /></td>
                    </tr>
                  ))
                ) : (
                  playerStats.map(stat => (
                    <tr key={stat.id} className="hover:bg-gray-50">
                      <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-600 font-medium">
                        {stat.games ? new Date(stat.games.date).toLocaleDateString() : 'N/A'}
                      </td>
                      {statFields.map(f => <td key={f.name} className="px-8 py-5 whitespace-nowrap text-lg font-semibold text-gray-800">{stat[f.name]}</td>)}
                      <td className="px-8 py-5 whitespace-nowrap text-sm font-medium flex space-x-4">
                        <button onClick={() => handleEdit(stat)} className="text-indigo-600 hover:text-indigo-900 transition-transform transform hover:scale-110"><Edit className="h-5 w-5" /></button>
                        <button onClick={() => handleDelete(stat.id)} disabled={isDeleting === stat.id} className="text-red-600 hover:text-red-900 disabled:opacity-50 transition-transform transform hover:scale-110">
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

export default StatsUploader;