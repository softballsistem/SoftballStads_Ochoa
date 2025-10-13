import { supabase } from '../lib/supabase';

export interface UploadResult {
  url?: string;
  error?: string;
}

export const storageService = {
  /**
   * Sube un logo de equipo al storage de Supabase
   */
  async uploadTeamLogo(file: File, teamId: string): Promise<UploadResult> {
    try {
      // Validar tipo de archivo
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'];
      if (!allowedTypes.includes(file.type)) {
        return { error: 'Tipo de archivo no permitido. Use JPEG, PNG, WebP o SVG.' };
      }

      // Validar tamaño (5MB máximo)
      if (file.size > 5 * 1024 * 1024) {
        return { error: 'El archivo es demasiado grande. Máximo 5MB.' };
      }

      // Generar nombre único para el archivo
      const fileExt = file.name.split('.').pop();
      const fileName = `${teamId}-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      // Eliminar logo anterior si existe
      await this.deleteTeamLogo(teamId);

      // Subir archivo
      const { error } = await supabase.storage
        .from('team-logos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        console.error('Error uploading file:', error);
        return { error: `Error al subir archivo: ${error.message}` };
      }

      // Obtener URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('team-logos')
        .getPublicUrl(filePath);

      return { url: publicUrl };
    } catch (error) {
      console.error('Upload error:', error);
      return { error: 'Error inesperado al subir el archivo' };
    }
  },

  /**
   * Elimina el logo anterior de un equipo
   */
  async deleteTeamLogo(teamId: string): Promise<void> {
    try {
      // Listar archivos del equipo
      const { data: files } = await supabase.storage
        .from('team-logos')
        .list('logos', {
          search: teamId
        });

      if (files && files.length > 0) {
        // Eliminar archivos existentes
        const filesToDelete = files.map(file => `logos/${file.name}`);
        await supabase.storage
          .from('team-logos')
          .remove(filesToDelete);
      }
    } catch (error) {
      console.error('Error deleting old logo:', error);
    }
  },

  /**
   * Obtiene la URL pública de un logo
   */
  getPublicUrl(path: string): string {
    const { data: { publicUrl } } = supabase.storage
      .from('team-logos')
      .getPublicUrl(path);
    return publicUrl;
  },

  /**
   * Valida si una URL de logo es válida
   */
  async validateLogoUrl(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
};