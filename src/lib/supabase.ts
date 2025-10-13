import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'https://your-project.supabase.co' || supabaseAnonKey === 'your_supabase_anon_key_here') {
  console.error('Supabase configuration error:', {
    url: supabaseUrl ? 'Set' : 'Missing',
    key: supabaseAnonKey ? 'Set' : 'Missing',
    urlIsDefault: supabaseUrl === 'https://your-project.supabase.co',
    keyIsDefault: supabaseAnonKey === 'your_supabase_anon_key_here'
  });
  throw new Error('Missing or invalid Supabase environment variables. Please check your .env file and ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set with your actual Supabase project details.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  },
  global: {
    fetch: async (url, options = {}) => {
      const maxRetries = 3;
      const retryDelay = 1000; // 1 second
      
      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(url, options);
          
          // If we get a 503, retry after delay
          if (response.status === 503 && attempt < maxRetries) {
            console.warn(`Supabase service unavailable (503), retrying in ${retryDelay}ms... (attempt ${attempt}/${maxRetries})`);
            await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
            continue;
          }
          
          // Handle other common errors
          if (response.status === 401) {
            console.warn('Supabase authentication error (401)');
          }
          
          if (response.status === 403) {
            console.warn('Supabase permission error (403)');
          }
          
          if (response.status >= 500) {
            console.warn(`Supabase server error (${response.status})`);
          }
          
          // If still 503 on final attempt, provide helpful error
          if (response.status === 503) {
            throw new Error('Supabase service is temporarily unavailable. Please check your Supabase project status at https://supabase.com/dashboard and try again in a few minutes.');
          }
          
          return response;
        } catch (error) {
          if (attempt === maxRetries) {
            // On final attempt, provide more context
            if (error instanceof Error && error.message.includes('503')) {
              throw error;
            }
            throw new Error(`Failed to connect to Supabase after ${maxRetries} attempts. Please verify your Supabase project is active and your network connection is stable.`);
          }
          
          // Wait before retrying
          console.warn(`Connection attempt ${attempt} failed, retrying...`);
          await new Promise(resolve => setTimeout(resolve, retryDelay * attempt));
        }
      }
    },
    headers: {
      'X-Client-Info': 'supabase-js-web'
    }
  }
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
          logo_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          coach?: string | null;
          season?: string;
          logo_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          coach?: string | null;
          season?: string;
          logo_url?: string | null;
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