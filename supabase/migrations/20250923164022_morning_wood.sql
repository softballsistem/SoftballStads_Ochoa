/*
  # Create user profiles table for authentication and role management

  1. New Tables
    - `user_profiles`
      - `uid` (uuid, primary key, references auth.users)
      - `email` (text, unique)
      - `username` (text, unique)
      - `role` (text, default 'player')
      - `player_id` (text, unique 11-digit identifier)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_profiles` table
    - Add policies for user profile management
    - Restrict role changes to authorized users only

  3. Indexes
    - Add indexes for efficient querying by username and email
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  uid uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  username text UNIQUE NOT NULL,
  role text DEFAULT 'player' CHECK (role IN ('developer', 'admin', 'player', 'visitor')),
  player_id text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS user_profiles_username_idx ON user_profiles(username);
CREATE INDEX IF NOT EXISTS user_profiles_email_idx ON user_profiles(email);
CREATE INDEX IF NOT EXISTS user_profiles_role_idx ON user_profiles(role);

-- Policies for user_profiles
CREATE POLICY "Users can view all profiles"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create their own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uid);

CREATE POLICY "Users can update their own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = uid)
  WITH CHECK (
    auth.uid() = uid AND
    -- Prevent users from changing their own role unless they're a developer
    (
      role = (SELECT role FROM user_profiles WHERE uid = auth.uid()) OR
      (SELECT role FROM user_profiles WHERE uid = auth.uid()) = 'developer'
    )
  );

-- Developers can update any user's role
CREATE POLICY "Developers can update any user"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING ((SELECT role FROM user_profiles WHERE uid = auth.uid()) = 'developer')
  WITH CHECK ((SELECT role FROM user_profiles WHERE uid = auth.uid()) = 'developer');

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();