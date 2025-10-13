import React, { useState } from 'react';
import { Trophy, Image as ImageIcon, AlertCircle } from 'lucide-react';

interface TeamLogoProps {
  logoUrl?: string | null;
  teamName: string;
  size?: 'small' | 'medium' | 'large';
  className?: string;
  showFallback?: boolean;
}

export function TeamLogo({ 
  logoUrl, 
  teamName, 
  size = 'medium', 
  className = '',
  showFallback = true 
}: TeamLogoProps) {
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);

  const sizeClasses = {
    small: 'h-8 w-8',
    medium: 'h-12 w-12',
    large: 'h-16 w-16'
  };

  const iconSizes = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8'
  };

  const textSizes = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base'
  };

  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // Si hay logo y no hay error, mostrar imagen
  if (logoUrl && !imageError) {
    return (
      <div className={`relative ${sizeClasses[size]} ${className}`}>
        {imageLoading && (
          <div className={`absolute inset-0 ${sizeClasses[size]} rounded-full bg-gray-100 flex items-center justify-center animate-pulse`}>
            <ImageIcon className={`${iconSizes[size]} text-gray-400`} />
          </div>
        )}
        <img
          src={logoUrl}
          alt={`${teamName} logo`}
          className={`${sizeClasses[size]} rounded-full object-cover border-2 border-gray-200 ${imageLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
          onLoad={handleImageLoad}
          onError={handleImageError}
        />
      </div>
    );
  }

  // Fallback: mostrar icono con iniciales o trophy
  if (showFallback) {
    const initials = teamName
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);

    return (
      <div className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-green-100 to-blue-100 border-2 border-gray-200 flex items-center justify-center ${className}`}>
        {initials ? (
          <span className={`font-bold text-green-700 ${textSizes[size]}`}>
            {initials}
          </span>
        ) : (
          <Trophy className={`${iconSizes[size]} text-green-600`} />
        )}
      </div>
    );
  }

  return null;
}

interface TeamLogoUploadProps {
  teamId: string;
  currentLogoUrl?: string | null;
  onLogoUpdate: (logoUrl: string) => void;
  className?: string;
}

export function TeamLogoUpload({ 
  teamId, 
  currentLogoUrl, 
  onLogoUpdate, 
  className = '' 
}: TeamLogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const { teamsApi } = await import('../../services/api');
      const { logoUrl } = await teamsApi.updateLogo(teamId, file);
      onLogoUpdate(logoUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al subir el logo');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center space-x-3">
        <TeamLogo logoUrl={currentLogoUrl} teamName="Team" size="medium" />
        <div className="flex-1">
          <label className="block">
            <span className="sr-only">Seleccionar logo del equipo</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/svg+xml"
              onChange={handleFileSelect}
              disabled={uploading}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100 disabled:opacity-50"
            />
          </label>
          <p className="text-xs text-gray-500 mt-1">
            JPEG, PNG, WebP o SVG. Máximo 5MB.
          </p>
        </div>
      </div>

      {uploading && (
        <div className="flex items-center space-x-2 text-sm text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span>Subiendo logo...</span>
        </div>
      )}

      {error && (
        <div className="flex items-center space-x-2 text-sm text-red-600 bg-red-50 p-2 rounded-md">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}