import { supabase } from '../lib/supabase';
import type { 
  Database, 
  TeamWithPlayers, 
  PlayerWithTeamAndStats, 
  GameWithTeamNames, 
  PlayerStatWithPlayer, 
  PlayerStatWithGame 
} from '../lib/supabase';

type Team = Database['public']['Tables']['teams']['Row'];
type Player = Database['public']['Tables']['players']['Row'];
type Game = Database['public']['Tables']['games']['Row'];
type PlayerStat = Database['public']['Tables']['player_stats']['Row'];

// Enhanced error handling
const handleApiError = (error: any, operation: string) => {
  throw new Error(`Failed to ${operation}: ${error.message || 'Unknown error'}`);
};

// Teams API
export const teamsApi = {
  async getAll(): Promise<Team[]> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select('*')
        .order('name');
      
      if (error) handleApiError(error, 'fetch teams');
      return data || [];
    } catch (error) {
      handleApiError(error, 'fetch teams');
      return [];
    }
  },

  async getById(id: string): Promise<TeamWithPlayers> {
    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          players (*)
        `)
        .eq('id', id)
        .single();
      
      if (error) handleApiError(error, 'fetch team');
      return data;
    } catch (error) {
      handleApiError(error, 'fetch team');
      throw error;
    }
  },

  async create(team: Database['public']['Tables']['teams']['Insert']): Promise<Team> {
    try {
      // Validate required fields
      if (!team.name?.trim()) {
        throw new Error('Team name is required');
      }

      const { data, error } = await supabase
        .from('teams')
        .insert({
          ...team,
          name: team.name.trim(),
          coach: team.coach?.trim() || null,
          season: team.season || '2024'
        })
        .select()
        .single();
      
      if (error) handleApiError(error, 'create team');
      return data;
    } catch (error) {
      handleApiError(error, 'create team');
      throw error;
    }
  },

  async update(id: string, team: Database['public']['Tables']['teams']['Update']): Promise<Team> {
    try {
      // Validate required fields
      if (team.name !== undefined && !team.name?.trim()) {
        throw new Error('Team name cannot be empty');
      }

      const { data, error } = await supabase
        .from('teams')
        .update({
          ...team,
          name: team.name?.trim(),
          coach: team.coach?.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) handleApiError(error, 'update team');
      return data;
    } catch (error) {
      handleApiError(error, 'update team');
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', id);
      
      if (error) handleApiError(error, 'delete team');
    } catch (error) {
      handleApiError(error, 'delete team');
      throw error;
    }
  },
};

// Players API
export const playersApi = {
  async getAll(): Promise<PlayerWithTeamAndStats[]> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          teams (name),
          player_stats (*)
        `)
        .order('name');
      
      if (error) handleApiError(error, 'fetch players');
      return data || [];
    } catch (error) {
      handleApiError(error, 'fetch players');
      return [];
    }
  },

  async getById(id: string): Promise<PlayerWithTeamAndStats> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          teams (name),
          player_stats (*)
        `)
        .eq('id', id)
        .single();
      
      if (error) handleApiError(error, 'fetch player');
      return data;
    } catch (error) {
      handleApiError(error, 'fetch player');
      throw error;
    }
  },

  async getByTeam(teamId: string): Promise<PlayerWithTeamAndStats[]> {
    try {
      const { data, error } = await supabase
        .from('players')
        .select(`
          *,
          player_stats (*)
        `)
        .eq('team_id', teamId)
        .order('jersey_number');
      
      if (error) handleApiError(error, 'fetch team players');
      return data || [];
    } catch (error) {
      handleApiError(error, 'fetch team players');
      return [];
    }
  },

  async create(player: Database['public']['Tables']['players']['Insert']): Promise<Player> {
    try {
      // Validate required fields
      if (!player.name?.trim()) {
        throw new Error('Player name is required');
      }

      const { data, error } = await supabase
        .from('players')
        .insert({
          ...player,
          name: player.name.trim(),
          position: player.position || 'Utility',
          jersey_number: player.jersey_number || null,
          team_id: player.team_id || null,
          date_of_birth: player.date_of_birth || null
        })
        .select()
        .single();
      
      if (error) handleApiError(error, 'create player');
      return data;
    } catch (error) {
      handleApiError(error, 'create player');
      throw error;
    }
  },

  async update(id: string, player: Database['public']['Tables']['players']['Update']): Promise<Player> {
    try {
      // Validate required fields
      if (player.name !== undefined && !player.name?.trim()) {
        throw new Error('Player name cannot be empty');
      }

      const { data, error } = await supabase
        .from('players')
        .update({
          ...player,
          name: player.name?.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) handleApiError(error, 'update player');
      return data;
    } catch (error) {
      handleApiError(error, 'update player');
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('players')
        .delete()
        .eq('id', id);
      
      if (error) handleApiError(error, 'delete player');
    } catch (error) {
      handleApiError(error, 'delete player');
      throw error;
    }
  },
};

// Games API
export const gamesApi = {
  async getAll(): Promise<GameWithTeamNames[]> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          home_team:teams!games_home_team_id_fkey (name),
          away_team:teams!games_away_team_id_fkey (name)
        `)
        .order('date', { ascending: false });
      
      if (error) handleApiError(error, 'fetch games');
      return data || [];
    } catch (error) {
      handleApiError(error, 'fetch games');
      return [];
    }
  },

  async getById(id: string): Promise<GameWithTeamNames> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select(`
          *,
          home_team:teams!games_home_team_id_fkey (name),
          away_team:teams!games_away_team_id_fkey (name),
          player_stats (
            *,
            players (name, jersey_number, position)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) handleApiError(error, 'fetch game');
      return data;
    } catch (error) {
      handleApiError(error, 'fetch game');
      throw error;
    }
  },

  async create(game: Database['public']['Tables']['games']['Insert']): Promise<Game> {
    try {
      // Validate required fields
      if (!game.date) {
        throw new Error('Game date is required');
      }

      if (game.home_team_id && game.away_team_id && game.home_team_id === game.away_team_id) {
        throw new Error('Home and away teams cannot be the same');
      }

      const { data, error } = await supabase
        .from('games')
        .insert({
          ...game,
          status: game.status || 'scheduled',
          home_score: game.home_score || 0,
          away_score: game.away_score || 0
        })
        .select()
        .single();
      
      if (error) handleApiError(error, 'create game');
      return data;
    } catch (error) {
      handleApiError(error, 'create game');
      throw error;
    }
  },

  async update(id: string, game: Database['public']['Tables']['games']['Update']): Promise<Game> {
    try {
      // Validate fields if provided
      if (game.home_team_id && game.away_team_id && game.home_team_id === game.away_team_id) {
        throw new Error('Home and away teams cannot be the same');
      }

      const { data, error } = await supabase
        .from('games')
        .update({
          ...game,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      
      if (error) handleApiError(error, 'update game');
      return data;
    } catch (error) {
      handleApiError(error, 'update game');
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', id);
      
      if (error) handleApiError(error, 'delete game');
    } catch (error) {
      handleApiError(error, 'delete game');
      throw error;
    }
  },
};

// Player Stats API
export const playerStatsApi = {
  async getByGame(gameId: string): Promise<PlayerStatWithPlayer[]> {
    try {
      const { data, error } = await supabase
        .from('player_stats')
        .select(`
          *,
          players (name, jersey_number, position)
        `)
        .eq('game_id', gameId);
      
      if (error) handleApiError(error, 'fetch game stats');
      return data || [];
    } catch (error) {
      handleApiError(error, 'fetch game stats');
      return [];
    }
  },

  async getByPlayer(playerId: string): Promise<PlayerStatWithGame[]> {
    try {
      const { data, error } = await supabase
        .from('player_stats')
        .select(`
          *,
          games (date, home_team:teams!games_home_team_id_fkey (name), away_team:teams!games_away_team_id_fkey (name))
        `)
        .eq('player_id', playerId)
        .order('created_at', { ascending: false });
      
      if (error) handleApiError(error, 'fetch player stats');
      return data || [];
    } catch (error) {
      handleApiError(error, 'fetch player stats');
      return [];
    }
  },

  async upsert(stat: Database['public']['Tables']['player_stats']['Insert']): Promise<PlayerStat> {
    try {
      // Validate stats
      if (!stat.player_id || !stat.game_id) {
        throw new Error('Player ID and Game ID are required');
      }

      // Ensure non-negative values
      const cleanStat = {
        ...stat,
        at_bats: Math.max(0, stat.at_bats || 0),
        hits: Math.max(0, stat.hits || 0),
        runs: Math.max(0, stat.runs || 0),
        rbi: Math.max(0, stat.rbi || 0),
        doubles: Math.max(0, stat.doubles || 0),
        triples: Math.max(0, stat.triples || 0),
        home_runs: Math.max(0, stat.home_runs || 0),
        walks: Math.max(0, stat.walks || 0),
        strikeouts: Math.max(0, stat.strikeouts || 0),
        stolen_bases: Math.max(0, stat.stolen_bases || 0),
        errors: Math.max(0, stat.errors || 0),
      };

      // Validate hits don't exceed at-bats
      if (cleanStat.hits > cleanStat.at_bats) {
        throw new Error('Hits cannot exceed at-bats');
      }

      const { data, error } = await supabase
        .from('player_stats')
        .upsert(cleanStat, { 
          onConflict: 'player_id,game_id' 
        })
        .select()
        .single();
      
      if (error) handleApiError(error, 'save player stats');
      return data;
    } catch (error) {
      handleApiError(error, 'save player stats');
      throw error;
    }
  },

  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('player_stats')
        .delete()
        .eq('id', id);
      
      if (error) handleApiError(error, 'delete player stats');
    } catch (error) {
      handleApiError(error, 'delete player stats');
      throw error;
    }
  },
};

// Statistics calculations
export const calculatePlayerStats = (stats: PlayerStat[]) => {
  if (!stats || stats.length === 0) {
    return {
      games: 0,
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
      avg: 0,
      obp: 0,
      slg: 0,
      ops: 0,
    };
  }

  const totals = stats.reduce((acc, stat) => ({
    games: acc.games + 1,
    at_bats: acc.at_bats + stat.at_bats,
    hits: acc.hits + stat.hits,
    runs: acc.runs + stat.runs,
    rbi: acc.rbi + stat.rbi,
    doubles: acc.doubles + stat.doubles,
    triples: acc.triples + stat.triples,
    home_runs: acc.home_runs + stat.home_runs,
    walks: acc.walks + stat.walks,
    strikeouts: acc.strikeouts + stat.strikeouts,
    stolen_bases: acc.stolen_bases + stat.stolen_bases,
    errors: acc.errors + stat.errors,
  }), {
    games: 0,
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
  });

  const avg = totals.at_bats > 0 ? (totals.hits / totals.at_bats) : 0;
  const obp = (totals.at_bats + totals.walks) > 0 ? 
    ((totals.hits + totals.walks) / (totals.at_bats + totals.walks)) : 0;
  const slg = totals.at_bats > 0 ? 
    ((totals.hits - totals.doubles - totals.triples - totals.home_runs) + 
     (totals.doubles * 2) + (totals.triples * 3) + (totals.home_runs * 4)) / totals.at_bats : 0;
  const ops = obp + slg;

  return {
    ...totals,
    avg: Number(avg.toFixed(3)),
    obp: Number(obp.toFixed(3)),
    slg: Number(slg.toFixed(3)),
    ops: Number(ops.toFixed(3)),
  };
};

// User management API (for admin functions)
export const userApi = {
  async getAllUsers() {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) handleApiError(error, 'fetch users');
      return data || [];
    } catch (error) {
      handleApiError(error, 'fetch users');
      return [];
    }
  },

  async updateUserRole(userId: string, newRole: string) {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ 
          role: newRole,
          updated_at: new Date().toISOString()
        })
        .eq('uid', userId)
        .select()
        .single();

      if (error) handleApiError(error, 'update user role');
      return data;
    } catch (error) {
      handleApiError(error, 'update user role');
      throw error;
    }
  }
};