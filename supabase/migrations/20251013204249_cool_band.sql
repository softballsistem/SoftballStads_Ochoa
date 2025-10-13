/*
  # Agregar soporte para logos de equipos

  1. Modificaciones a la tabla teams
    - Agregar columna logo_url para almacenar la URL del logo
  
  2. Configuración de Storage
    - Crear bucket para logos de equipos
    - Configurar políticas de acceso
  
  3. Índices y optimizaciones
    - Índice en logo_url para búsquedas rápidas
*/

-- Agregar columna logo_url a la tabla teams
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE teams ADD COLUMN logo_url text;
  END IF;
END $$;

-- Crear índice para logo_url
CREATE INDEX IF NOT EXISTS teams_logo_url_idx ON teams(logo_url);

-- Crear bucket para logos de equipos si no existe
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'team-logos',
  'team-logos',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;

-- Políticas de Storage para team-logos bucket
-- Permitir lectura pública de logos
CREATE POLICY IF NOT EXISTS "Public can view team logos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'team-logos');

-- Permitir subida de logos para usuarios autenticados con permisos de admin/developer
CREATE POLICY IF NOT EXISTS "Admins and developers can upload team logos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'team-logos' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE uid = auth.uid() 
    AND role IN ('admin', 'developer')
  )
);

-- Permitir actualización de logos para usuarios autenticados con permisos de admin/developer
CREATE POLICY IF NOT EXISTS "Admins and developers can update team logos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'team-logos' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE uid = auth.uid() 
    AND role IN ('admin', 'developer')
  )
);

-- Permitir eliminación de logos para usuarios autenticados con permisos de admin/developer
CREATE POLICY IF NOT EXISTS "Admins and developers can delete team logos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'team-logos' AND
  EXISTS (
    SELECT 1 FROM user_profiles
    WHERE uid = auth.uid() 
    AND role IN ('admin', 'developer')
  )
);

-- Actualizar la política de teams para incluir logo_url en las actualizaciones
DROP POLICY IF EXISTS "Teams are manageable by admins and developers" ON teams;
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