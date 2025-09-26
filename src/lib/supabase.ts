import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type Database = {
  public: {
    Tables: {
      teams: {
        Row: {
          id: string;
          name: string;
          coach: string | null;
          season: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          coach?: string | null;
          season?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          coach?: string | null;
          season?: string;
          created_at?: string;
        };
      };
      players: {
        Row: {
          id: string;
          name: string;
          jersey_number: number | null;
          position: string;
          team_id: string | null;
          date_of_birth: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          jersey_number?: number | null;
          position?: string;
          team_id?: string | null;
          date_of_birth?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          jersey_number?: number | null;
          position?: string;
          team_id?: string | null;
          date_of_birth?: string | null;
          created_at?: string;
        };
      };
      games: {
        Row: {
          id: string;
          date: string;
          home_team_id: string | null;
          away_team_id: string | null;
          home_score: number;
          away_score: number;
          location: string | null;
          status: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          home_team_id?: string | null;
          away_team_id?: string | null;
          home_score?: number;
          away_score?: number;
          location?: string | null;
          status?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          home_team_id?: string | null;
          away_team_id?: string | null;
          home_score?: number;
          away_score?: number;
          location?: string | null;
          status?: string;
          created_at?: string;
        };
      };
      player_stats: {
        Row: {
          id: string;
          player_id: string | null;
          game_id: string | null;
          at_bats: number;
          hits: number;
          runs: number;
          rbi: number;
          doubles: number;
          triples: number;
          home_runs: number;
          walks: number;
          strikeouts: number;
          stolen_bases: number;
          errors: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          player_id?: string | null;
          game_id?: string | null;
          at_bats?: number;
          hits?: number;
          runs?: number;
          rbi?: number;
          doubles?: number;
          triples?: number;
          home_runs?: number;
          walks?: number;
          strikeouts?: number;
          stolen_bases?: number;
          errors?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          player_id?: string | null;
          game_id?: string | null;
          at_bats?: number;
          hits?: number;
          runs?: number;
          rbi?: number;
          doubles?: number;
          triples?: number;
          home_runs?: number;
          walks?: number;
          strikeouts?: number;
          stolen_bases?: number;
          errors?: number;
          created_at?: string;
        };
      };
    };
  };
};

// Extended types for API responses with joins
export type TeamWithPlayers = Database['public']['Tables']['teams']['Row'] & {
  players?: Database['public']['Tables']['players']['Row'][];
};

export type PlayerWithTeamAndStats = Database['public']['Tables']['players']['Row'] & {
  teams?: { name: string } | null;
  player_stats?: Database['public']['Tables']['player_stats']['Row'][];
};

export type GameWithTeamNames = Database['public']['Tables']['games']['Row'] & {
  home_team?: { name: string } | null;
  away_team?: { name: string } | null;
  player_stats?: (Database['public']['Tables']['player_stats']['Row'] & {
    players?: {
      name: string;
      jersey_number: number | null;
      position: string;
    } | null;
  })[];
};

export type PlayerStatWithPlayer = Database['public']['Tables']['player_stats']['Row'] & {
  players?: {
    name: string;
    jersey_number: number | null;
    position: string;
  } | null;
};

export type PlayerStatWithGame = Database['public']['Tables']['player_stats']['Row'] & {
  games?: {
    date: string;
    home_team?: { name: string } | null;
    away_team?: { name: string } | null;
  } | null;
}