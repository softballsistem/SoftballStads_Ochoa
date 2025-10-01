/*
  # Sistema de Solicitudes de Cambio de Roles

  1. Nueva Tabla
    - `role_change_requests`
      - `id` (uuid, primary key)
      - `requester_id` (uuid, referencia a user_profiles)
      - `target_user_id` (uuid, referencia a user_profiles)
      - `current_role` (text)
      - `requested_role` (text)
      - `reason` (text)
      - `status` (text: pending, approved, rejected)
      - `reviewed_by` (uuid, referencia a user_profiles)
      - `reviewed_at` (timestamp)
      - `created_at` (timestamp)

  2. Seguridad
    - Enable RLS en `role_change_requests`
    - Políticas para desarrolladores y administradores
*/

CREATE TABLE IF NOT EXISTS role_change_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES user_profiles(uid) ON DELETE CASCADE,
  target_user_id uuid NOT NULL REFERENCES user_profiles(uid) ON DELETE CASCADE,
  current_role text NOT NULL,
  requested_role text NOT NULL,
  reason text,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by uuid REFERENCES user_profiles(uid) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE role_change_requests ENABLE ROW LEVEL SECURITY;

-- Desarrolladores pueden ver y gestionar todas las solicitudes
CREATE POLICY "Developers can manage all role change requests"
  ON role_change_requests
  FOR ALL
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

-- Administradores pueden crear solicitudes y ver las suyas
CREATE POLICY "Admins can create and view their requests"
  ON role_change_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE uid = auth.uid() AND role = 'admin'
    ) AND (requester_id = auth.uid() OR target_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE uid = auth.uid() AND role = 'admin'
    )
  );

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS role_change_requests_requester_id_idx ON role_change_requests(requester_id);
CREATE INDEX IF NOT EXISTS role_change_requests_target_user_id_idx ON role_change_requests(target_user_id);
CREATE INDEX IF NOT EXISTS role_change_requests_status_idx ON role_change_requests(status);
CREATE INDEX IF NOT EXISTS role_change_requests_created_at_idx ON role_change_requests(created_at DESC);