/*
  # Configuración Completa de Base de Datos - SoftballStats

  1. Tablas Principales
    - `teams` - Equipos de softball
    - `players` - Jugadores
    - `games` - Juegos/Partidos
    - `player_stats` - Estadísticas de jugadores por juego
    - `user_profiles` - Perfiles de usuarios
    - `role_change_requests` - Solicitudes de cambio de rol

  2. Seguridad
    - RLS habilitado en todas las tablas
    - Políticas específicas por rol
    - Función de actualización de timestamps

  3. Índices
    - Optimización de consultas
    - Búsquedas eficientes

  4. Datos de Prueba
    - Equipos de ejemplo
    - Jugadores de muestra
    - Juegos programados
*/

-- Función para actualizar timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- TABLA: teams (Equipos)
-- =============================================
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  coach text,
  season text DEFAULT '2024',
  created_at timestamptz DEFAULT now()
);

-- Índices para teams
CREATE INDEX IF NOT EXISTS teams_name_idx ON teams (name);
CREATE INDEX IF NOT EXISTS teams_season_idx ON teams (season);

-- RLS para teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Políticas para teams
DROP POLICY IF EXISTS "Teams are viewable by authenticated users" ON teams;
DROP POLICY IF EXISTS "Teams are manageable by admins and developers" ON teams;

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

-- =============================================
-- TABLA: players (Jugadores)
-- =============================================
CREATE TABLE IF NOT EXISTS players (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  jersey_number integer,
  position text DEFAULT 'Utility',
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  date_of_birth date,
  created_at timestamptz DEFAULT now()
);

-- Índices para players
CREATE INDEX IF NOT EXISTS players_name_idx ON players (name);
CREATE INDEX IF NOT EXISTS players_team_id_idx ON players (team_id);
CREATE INDEX IF NOT EXISTS players_jersey_number_idx ON players (jersey_number);
CREATE INDEX IF NOT EXISTS players_position_idx ON players (position);

-- RLS para players
ALTER TABLE players ENABLE ROW LEVEL SECURITY;

-- Políticas para players
DROP POLICY IF EXISTS "Players are viewable by authenticated users" ON players;
DROP POLICY IF EXISTS "Players are manageable by admins and developers" ON players;

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

-- =============================================
-- TABLA: games (Juegos)
-- =============================================
CREATE TABLE IF NOT EXISTS games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date NOT NULL,
  home_team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  away_team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  home_score integer DEFAULT 0,
  away_score integer DEFAULT 0,
  location text,
  status text DEFAULT 'scheduled',
  created_at timestamptz DEFAULT now()
);

-- Índices para games
CREATE INDEX IF NOT EXISTS games_date_idx ON games (date);
CREATE INDEX IF NOT EXISTS games_home_team_id_idx ON games (home_team_id);
CREATE INDEX IF NOT EXISTS games_away_team_id_idx ON games (away_team_id);
CREATE INDEX IF NOT EXISTS games_status_idx ON games (status);

-- RLS para games
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Políticas para games
DROP POLICY IF EXISTS "Games are viewable by authenticated users" ON games;
DROP POLICY IF EXISTS "Games are manageable by admins and developers" ON games;

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

-- =============================================
-- TABLA: player_stats (Estadísticas)
-- =============================================
CREATE TABLE IF NOT EXISTS player_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id uuid REFERENCES players(id) ON DELETE CASCADE,
  game_id uuid REFERENCES games(id) ON DELETE CASCADE,
  at_bats integer DEFAULT 0,
  hits integer DEFAULT 0,
  runs integer DEFAULT 0,
  rbi integer DEFAULT 0,
  doubles integer DEFAULT 0,
  triples integer DEFAULT 0,
  home_runs integer DEFAULT 0,
  walks integer DEFAULT 0,
  strikeouts integer DEFAULT 0,
  stolen_bases integer DEFAULT 0,
  errors integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(player_id, game_id)
);

-- Índices para player_stats
CREATE INDEX IF NOT EXISTS player_stats_player_id_idx ON player_stats (player_id);
CREATE INDEX IF NOT EXISTS player_stats_game_id_idx ON player_stats (game_id);

-- RLS para player_stats
ALTER TABLE player_stats ENABLE ROW LEVEL SECURITY;

-- Políticas para player_stats
DROP POLICY IF EXISTS "Player stats are viewable by authenticated users" ON player_stats;
DROP POLICY IF EXISTS "Player stats are manageable by admins and developers" ON player_stats;

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

-- =============================================
-- TABLA: user_profiles (Perfiles de Usuario)
-- =============================================
CREATE TABLE IF NOT EXISTS user_profiles (
  uid uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  role text DEFAULT 'player' CHECK (role IN ('developer', 'admin', 'player', 'visitor')),
  player_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Índices para user_profiles
CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON user_profiles (email);
CREATE INDEX IF NOT EXISTS user_profiles_username_idx ON user_profiles (username);
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON user_profiles (role);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS para user_profiles
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para user_profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON user_profiles;
DROP POLICY IF EXISTS "Users can create their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON user_profiles;
DROP POLICY IF EXISTS "Developers can update any user" ON user_profiles;

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
        WHERE uid = auth.uid() AND role = 'developer'
      )
    )
  );

CREATE POLICY "Developers can update any user"
  ON user_profiles FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE uid = auth.uid() AND role = 'developer'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE uid = auth.uid() AND role = 'developer'
    )
  );

-- =============================================
-- TABLA: role_change_requests (Solicitudes de Cambio de Rol)
-- =============================================
CREATE TABLE IF NOT EXISTS role_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES user_profiles(uid) ON DELETE CASCADE,
  target_user_id uuid REFERENCES user_profiles(uid) ON DELETE CASCADE,
  current_role text NOT NULL,
  requested_role text NOT NULL CHECK (requested_role IN ('developer', 'admin', 'player', 'visitor')),
  reason text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES user_profiles(uid),
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Índices para role_change_requests
CREATE INDEX IF NOT EXISTS role_change_requests_requester_id_idx ON role_change_requests (requester_id);
CREATE INDEX IF NOT EXISTS role_change_requests_target_user_id_idx ON role_change_requests (target_user_id);
CREATE INDEX IF NOT EXISTS role_change_requests_status_idx ON role_change_requests (status);

-- RLS para role_change_requests
ALTER TABLE role_change_requests ENABLE ROW LEVEL SECURITY;

-- Políticas para role_change_requests
DROP POLICY IF EXISTS "Admins can create role change requests" ON role_change_requests;
DROP POLICY IF EXISTS "Developers can view all requests" ON role_change_requests;
DROP POLICY IF EXISTS "Users can view their own requests" ON role_change_requests;
DROP POLICY IF EXISTS "Developers can update requests" ON role_change_requests;

CREATE POLICY "Admins can create role change requests"
  ON role_change_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE uid = auth.uid() AND role IN ('admin', 'developer')
    )
  );

CREATE POLICY "Developers can view all requests"
  ON role_change_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE uid = auth.uid() AND role = 'developer'
    )
  );

CREATE POLICY "Users can view their own requests"
  ON role_change_requests FOR SELECT
  TO authenticated
  USING (
    requester_id = auth.uid() OR target_user_id = auth.uid()
  );

CREATE POLICY "Developers can update requests"
  ON role_change_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE uid = auth.uid() AND role = 'developer'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE uid = auth.uid() AND role = 'developer'
    )
  );

-- =============================================
-- DATOS DE PRUEBA
-- =============================================

-- Insertar equipos de ejemplo
INSERT INTO teams (name, coach, season) VALUES
  ('Águilas Doradas', 'Carlos Mendoza', '2024'),
  ('Tigres Azules', 'María González', '2024'),
  ('Leones Rojos', 'José Rodríguez', '2024'),
  ('Panteras Negras', 'Ana López', '2024')
ON CONFLICT (name) DO NOTHING;

-- Insertar jugadores de ejemplo
DO $$
DECLARE
  team1_id uuid;
  team2_id uuid;
  team3_id uuid;
  team4_id uuid;
BEGIN
  -- Obtener IDs de equipos
  SELECT id INTO team1_id FROM teams WHERE name = 'Águilas Doradas';
  SELECT id INTO team2_id FROM teams WHERE name = 'Tigres Azules';
  SELECT id INTO team3_id FROM teams WHERE name = 'Leones Rojos';
  SELECT id INTO team4_id FROM teams WHERE name = 'Panteras Negras';

  -- Jugadores para Águilas Doradas
  INSERT INTO players (name, jersey_number, position, team_id, date_of_birth) VALUES
    ('Roberto Silva', 1, 'Pitcher', team1_id, '1995-03-15'),
    ('Miguel Torres', 2, 'Catcher', team1_id, '1992-07-22'),
    ('Diego Morales', 3, '1st Base', team1_id, '1994-11-08'),
    ('Fernando Castro', 4, '2nd Base', team1_id, '1996-01-30'),
    ('Alejandro Ruiz', 5, '3rd Base', team1_id, '1993-09-12')
  ON CONFLICT DO NOTHING;

  -- Jugadores para Tigres Azules
  INSERT INTO players (name, jersey_number, position, team_id, date_of_birth) VALUES
    ('Carlos Herrera', 10, 'Pitcher', team2_id, '1994-05-18'),
    ('Luis Vargas', 11, 'Catcher', team2_id, '1991-12-03'),
    ('Andrés Jiménez', 12, 'Shortstop', team2_id, '1995-08-25'),
    ('Pablo Ramírez', 13, 'Left Field', team2_id, '1993-04-14'),
    ('Sergio Delgado', 14, 'Center Field', team2_id, '1996-10-07')
  ON CONFLICT DO NOTHING;

  -- Jugadores para Leones Rojos
  INSERT INTO players (name, jersey_number, position, team_id, date_of_birth) VALUES
    ('Javier Ortega', 20, 'Pitcher', team3_id, '1992-02-28'),
    ('Ricardo Peña', 21, 'Catcher', team3_id, '1994-06-16'),
    ('Gustavo Medina', 22, 'Right Field', team3_id, '1995-12-09'),
    ('Héctor Vega', 23, '1st Base', team3_id, '1993-03-21'),
    ('Raúl Guerrero', 24, '2nd Base', team3_id, '1996-07-04')
  ON CONFLICT DO NOTHING;

  -- Jugadores para Panteras Negras
  INSERT INTO players (name, jersey_number, position, team_id, date_of_birth) VALUES
    ('Eduardo Sánchez', 30, 'Pitcher', team4_id, '1994-09-11'),
    ('Arturo Flores', 31, 'Catcher', team4_id, '1992-01-27'),
    ('Mauricio Aguilar', 32, '3rd Base', team4_id, '1995-05-19'),
    ('Víctor Romero', 33, 'Shortstop', team4_id, '1993-11-02'),
    ('Emilio Navarro', 34, 'Utility', team4_id, '1996-08-15')
  ON CONFLICT DO NOTHING;
END $$;

-- Insertar juegos de ejemplo
DO $$
DECLARE
  team1_id uuid;
  team2_id uuid;
  team3_id uuid;
  team4_id uuid;
BEGIN
  -- Obtener IDs de equipos
  SELECT id INTO team1_id FROM teams WHERE name = 'Águilas Doradas';
  SELECT id INTO team2_id FROM teams WHERE name = 'Tigres Azules';
  SELECT id INTO team3_id FROM teams WHERE name = 'Leones Rojos';
  SELECT id INTO team4_id FROM teams WHERE name = 'Panteras Negras';

  -- Insertar juegos
  INSERT INTO games (date, home_team_id, away_team_id, home_score, away_score, location, status) VALUES
    ('2024-10-15', team1_id, team2_id, 8, 5, 'Estadio Central', 'completed'),
    ('2024-10-16', team3_id, team4_id, 6, 7, 'Campo Norte', 'completed'),
    ('2024-10-20', team2_id, team3_id, 0, 0, 'Estadio Sur', 'scheduled'),
    ('2024-10-22', team4_id, team1_id, 0, 0, 'Campo Este', 'scheduled'),
    ('2024-10-25', team1_id, team3_id, 0, 0, 'Estadio Central', 'scheduled')
  ON CONFLICT DO NOTHING;
END $$;

-- =============================================
-- VERIFICACIONES FINALES
-- =============================================

-- Verificar que todas las tablas existen
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'teams') THEN
    RAISE EXCEPTION 'Tabla teams no existe';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'players') THEN
    RAISE EXCEPTION 'Tabla players no existe';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'games') THEN
    RAISE EXCEPTION 'Tabla games no existe';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'player_stats') THEN
    RAISE EXCEPTION 'Tabla player_stats no existe';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
    RAISE EXCEPTION 'Tabla user_profiles no existe';
  END IF;
  
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'role_change_requests') THEN
    RAISE EXCEPTION 'Tabla role_change_requests no existe';
  END IF;
  
  RAISE NOTICE 'Todas las tablas han sido creadas correctamente';
END $$;

-- Verificar RLS
DO $$
BEGIN
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'teams') THEN
    RAISE EXCEPTION 'RLS no está habilitado en teams';
  END IF;
  
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'players') THEN
    RAISE EXCEPTION 'RLS no está habilitado en players';
  END IF;
  
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'games') THEN
    RAISE EXCEPTION 'RLS no está habilitado en games';
  END IF;
  
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'player_stats') THEN
    RAISE EXCEPTION 'RLS no está habilitado en player_stats';
  END IF;
  
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'user_profiles') THEN
    RAISE EXCEPTION 'RLS no está habilitado en user_profiles';
  END IF;
  
  IF NOT (SELECT relrowsecurity FROM pg_class WHERE relname = 'role_change_requests') THEN
    RAISE EXCEPTION 'RLS no está habilitado en role_change_requests';
  END IF;
  
  RAISE NOTICE 'RLS está habilitado en todas las tablas';
END $$;

-- Mostrar estadísticas finales
SELECT 
  'teams' as tabla,
  COUNT(*) as registros
FROM teams
UNION ALL
SELECT 
  'players' as tabla,
  COUNT(*) as registros
FROM players
UNION ALL
SELECT 
  'games' as tabla,
  COUNT(*) as registros
FROM games
UNION ALL
SELECT 
  'user_profiles' as tabla,
  COUNT(*) as registros
FROM user_profiles
UNION ALL
SELECT 
  'role_change_requests' as tabla,
  COUNT(*) as registros
FROM role_change_requests;