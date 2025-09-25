/*
  # Complete Database Setup and Verification

  1. Database Schema
    - Verify all tables exist with proper structure
    - Ensure all foreign keys and constraints are correct
    - Add missing indexes for performance
    
  2. Row Level Security
    - Enable RLS on all tables
    - Create comprehensive security policies
    
  3. Super User Setup
    - Prepare for hedrichdev@gmail.com super user
    - Set up proper role hierarchy
    
  4. Data Integrity
    - Add proper constraints and validations
    - Ensure referential integrity
*/

-- Create teams table with proper structure
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  coach text,
  season text DEFAULT '2024',
  created_at timestamptz DEFAULT now()
);

-- Create players table with proper structure
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  jersey_number integer CHECK (jersey_number >= 0 AND jersey_number <= 99),
  position text DEFAULT 'Utility',
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  date_of_birth date,
  created_at timestamptz DEFAULT now()
);

-- Create games table with proper structure
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  home_team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  home_score integer DEFAULT 0 CHECK (home_score >= 0),
  away_score integer DEFAULT 0 CHECK (away_score >= 0),
  location text,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT different_teams CHECK (home_team_id != away_team_id)
);

-- Create player_stats table with proper structure
CREATE TABLE IF NOT EXISTS player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  at_bats integer DEFAULT 0 CHECK (at_bats >= 0),
  hits integer DEFAULT 0 CHECK (hits >= 0),
  runs integer DEFAULT 0 CHECK (runs >= 0),
  rbi integer DEFAULT 0 CHECK (rbi >= 0),
  doubles integer DEFAULT 0 CHECK (doubles >= 0),
  triples integer DEFAULT 0 CHECK (triples >= 0),
  home_runs integer DEFAULT 0 CHECK (home_runs >= 0),
  walks integer DEFAULT 0 CHECK (walks >= 0),
  strikeouts integer DEFAULT 0 CHECK (strikeouts >= 0),
  stolen_bases integer DEFAULT 0 CHECK (stolen_bases >= 0),
  errors integer DEFAULT 0 CHECK (errors >= 0),
  created_at timestamptz DEFAULT now(),
  UNIQUE(player_id, game_id),
  CONSTRAINT hits_not_exceed_at_bats CHECK (hits <= at_bats),
  CONSTRAINT extra_base_hits_valid CHECK (doubles + triples + home_runs <= hits)
);

-- Create user_profiles table with enhanced structure
CREATE TABLE IF NOT EXISTS user_profiles (
  uid uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  role text DEFAULT 'player' CHECK (role IN ('developer', 'admin', 'player', 'visitor')),
  player_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_profiles updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS teams_name_idx ON teams(name);
CREATE INDEX IF NOT EXISTS teams_season_idx ON teams(season);

CREATE INDEX IF NOT EXISTS players_name_idx ON players(name);
CREATE INDEX IF NOT EXISTS players_team_id_idx ON players(team_id);
CREATE INDEX IF NOT EXISTS players_jersey_number_idx ON players(jersey_number);
CREATE INDEX IF NOT EXISTS players_position_idx ON players(position);

CREATE INDEX IF NOT EXISTS games_date_idx ON games(date);
CREATE INDEX IF NOT EXISTS games_home_team_id_idx ON games(home_team_id);
CREATE INDEX IF NOT EXISTS games_away_team_id_idx ON games(away_team_id);
CREATE INDEX IF NOT EXISTS games_status_idx ON games(status);

CREATE INDEX IF NOT EXISTS player_stats_player_id_idx ON player_stats(player_id);
CREATE INDEX IF NOT EXISTS player_stats_game_id_idx ON player_stats(game_id);

CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON user_profiles(email);
CREATE INDEX IF NOT EXISTS user_profiles_username_idx ON user_profiles(username);
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON user_profiles(role);

-- Enable Row Level Security on all tables
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Teams are viewable by authenticated users" ON teams;
DROP POLICY IF EXISTS "Teams are editable by authenticated users" ON teams;
DROP POLICY IF EXISTS "Players are viewable by authenticated users" ON players;
DROP POLICY IF EXISTS "Players are editable by authenticated users" ON players;
DROP POLICY IF EXISTS "Games are viewable by authenticated users" ON games;
DROP POLICY IF EXISTS "Games are editable by authenticated users" ON games;
DROP POLICY IF EXISTS "Player stats are viewable by authenticated users" ON player_stats;
DROP POLICY IF EXISTS "Player stats are editable by authenticated users" ON player_stats;
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Developers can update any user" ON user_profiles;

-- Create comprehensive RLS policies for teams
CREATE POLICY "Teams are viewable by authenticated users"
  ON teams FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Teams are manageable by admins and developers"
  ON teams FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE uid = auth.uid() 
      AND role IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE uid = auth.uid() 
      AND role IN ('admin', 'developer')
    )
  );

-- Create comprehensive RLS policies for players
CREATE POLICY "Players are viewable by authenticated users"
  ON players FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Players are manageable by admins and developers"
  ON players FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE uid = auth.uid() 
      AND role IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE uid = auth.uid() 
      AND role IN ('admin', 'developer')
    )
  );

-- Create comprehensive RLS policies for games
CREATE POLICY "Games are viewable by authenticated users"
  ON games FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Games are manageable by admins and developers"
  ON games FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE uid = auth.uid() 
      AND role IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE uid = auth.uid() 
      AND role IN ('admin', 'developer')
    )
  );

-- Create comprehensive RLS policies for player_stats
CREATE POLICY "Player stats are viewable by authenticated users"
  ON player_stats FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Player stats are manageable by admins and developers"
  ON player_stats FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE uid = auth.uid() 
      AND role IN ('admin', 'developer')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE uid = auth.uid() 
      AND role IN ('admin', 'developer')
    )
  );

-- Create comprehensive RLS policies for user_profiles
CREATE POLICY "Users can view all profiles"
  ON user_profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own profile"
  ON user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uid);

CREATE POLICY "Users can update their own profile"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = uid)
  WITH CHECK (
    auth.uid() = uid AND (
      role = (SELECT role FROM user_profiles WHERE uid = auth.uid()) OR
      EXISTS (
        SELECT 1 FROM user_profiles 
        WHERE uid = auth.uid() 
        AND role = 'developer'
      )
    )
  );

CREATE POLICY "Developers can update any user"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE uid = auth.uid() 
      AND role = 'developer'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE uid = auth.uid() 
      AND role = 'developer'
    )
  );

-- Insert sample data for testing (if tables are empty)
DO $$
BEGIN
  -- Insert sample teams if none exist
  IF NOT EXISTS (SELECT 1 FROM teams LIMIT 1) THEN
    INSERT INTO teams (name, coach, season) VALUES
    ('Eagles', 'Coach Johnson', '2024'),
    ('Tigers', 'Coach Smith', '2024'),
    ('Lions', 'Coach Brown', '2024');
  END IF;

  -- Insert sample players if none exist
  IF NOT EXISTS (SELECT 1 FROM players LIMIT 1) THEN
    INSERT INTO players (name, jersey_number, position, team_id) 
    SELECT 'John Doe', 1, 'Pitcher', id FROM teams WHERE name = 'Eagles' LIMIT 1;
    
    INSERT INTO players (name, jersey_number, position, team_id) 
    SELECT 'Jane Smith', 2, 'Catcher', id FROM teams WHERE name = 'Eagles' LIMIT 1;
    
    INSERT INTO players (name, jersey_number, position, team_id) 
    SELECT 'Mike Johnson', 3, '1st Base', id FROM teams WHERE name = 'Tigers' LIMIT 1;
  END IF;
END $$;