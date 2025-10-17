/*
  # Fix SQL syntax error - rename reserved keyword column

  1. Changes
    - Rename `current_role` to `from_role` in role_change_requests table
    - Rename `requested_role` to `to_role` for consistency
    - Update all references to use new column names
    - Ensure proper indexing and constraints

  2. Security
    - Maintain existing RLS policies
    - Update policies to use new column names
*/

-- Drop existing table if it exists to avoid conflicts
DROP TABLE IF EXISTS role_change_requests CASCADE;

-- Create role_change_requests table with corrected column names
CREATE TABLE role_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid NOT NULL,
  from_role text NOT NULL,
  to_role text NOT NULL,
  reason text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes for better performance
CREATE INDEX role_change_requests_requester_id_idx ON role_change_requests(requester_id);
CREATE INDEX role_change_requests_target_user_id_idx ON role_change_requests(target_user_id);
CREATE INDEX role_change_requests_status_idx ON role_change_requests(status);
CREATE INDEX role_change_requests_created_at_idx ON role_change_requests(created_at);

-- Enable RLS
ALTER TABLE role_change_requests ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view role change requests they're involved in"
  ON role_change_requests
  FOR SELECT
  TO authenticated
  USING (
    requester_id = auth.uid() OR 
    target_user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE uid = auth.uid() AND role = 'developer'
    )
  );

CREATE POLICY "Admins and developers can create role change requests"
  ON role_change_requests
  FOR INSERT
  TO authenticated
  WITH CHECK (
    requester_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE uid = auth.uid() AND role IN ('admin', 'developer')
    )
  );

CREATE POLICY "Only developers can update role change requests"
  ON role_change_requests
  FOR UPDATE
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

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_role_change_requests_updated_at
    BEFORE UPDATE ON role_change_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();