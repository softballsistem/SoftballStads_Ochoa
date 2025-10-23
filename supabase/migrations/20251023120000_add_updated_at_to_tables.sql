/*
  # Add updated_at column to teams, players, and games tables

  1. Modificaciones a las tablas
    - Agregar columna updated_at a las tablas `teams`, `players` y `games`
  
  2. Triggers
    - Agregar triggers para actualizar automaticamente la columna updated_at
*/

-- Agregar columna updated_at a la tabla teams
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE teams ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Agregar columna updated_at a la tabla players
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'players' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE players ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Agregar columna updated_at a la tabla games
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'games' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE games ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

-- Trigger para actualizar updated_at en teams
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en players
DROP TRIGGER IF EXISTS update_players_updated_at ON players;
CREATE TRIGGER update_players_updated_at
  BEFORE UPDATE ON players
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger para actualizar updated_at en games
DROP TRIGGER IF EXISTS update_games_updated_at ON games;
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
