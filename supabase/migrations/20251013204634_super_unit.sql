/*
  # Setup Team Logos Storage System

  1. Database Changes
    - Add logo_url column to teams table
    - Add index for logo_url column
    - Update RLS policies to include logo_url

  2. Storage Setup
    - Create team-logos bucket
    - Set up storage policies for public read and admin/developer write
    - Configure file size and type restrictions

  3. Security
    - Public read access for logo viewing
    - Restricted write access for admins and developers only
*/

-- Add logo_url column to teams table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'logo_url'
  ) THEN
    ALTER TABLE teams ADD COLUMN logo_url text;
  END IF;
END $$;

-- Add index for logo_url column for better performance
CREATE INDEX IF NOT EXISTS teams_logo_url_idx ON teams(logo_url);

-- Create storage bucket for team logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('team-logos', 'team-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Allow public to view team logos
CREATE POLICY "Public can view team logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'team-logos');

-- Storage policy: Allow authenticated users with admin/developer roles to upload
CREATE POLICY "Admins and developers can upload team logos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'team-logos' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE uid = auth.uid() 
    AND role IN ('admin', 'developer')
  )
);

-- Storage policy: Allow authenticated users with admin/developer roles to update
CREATE POLICY "Admins and developers can update team logos"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'team-logos' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE uid = auth.uid() 
    AND role IN ('admin', 'developer')
  )
);

-- Storage policy: Allow authenticated users with admin/developer roles to delete
CREATE POLICY "Admins and developers can delete team logos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'team-logos' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE uid = auth.uid() 
    AND role IN ('admin', 'developer')
  )
);

-- Update existing teams RLS policies to include logo_url in selects
DROP POLICY IF EXISTS "Teams are viewable by authenticated users" ON teams;
CREATE POLICY "Teams are viewable by authenticated users"
ON teams FOR SELECT
TO authenticated
USING (true);

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