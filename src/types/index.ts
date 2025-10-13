export interface Team {
  id: string;
  name: string;
  coach: string;
  season: string;
  logo_url: string | null;
  // Add other team properties as needed
}

export interface TeamFormData {
  name: string;
  coach: string;
  season: string;
  logo_url: string | null;
}

export interface Game {
  id: string;
  date: string;
  home_team_id: string;
  away_team_id: string;
  location: string;
  home_score: number;
  away_score: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  // Add other game properties as needed
}

export interface GameFormData {
  date: string;
  home_team_id: string;
  away_team_id: string;
  location: string;
  home_score: number;
  away_score: number;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export interface PlayerStat {
  player_id: string;
  game_id: string;
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
}

export interface Player {
  id: string;
  name: string;
  jersey_number: number | null;
  position: string;
  team_id: string | null;
  date_of_birth: string | null;
  // Add other player properties as needed
}

export interface PlayerFormData {
  name: string;
  jersey_number: number | null;
  position: string;
  team_id: string | null;
  date_of_birth: string | null;
}