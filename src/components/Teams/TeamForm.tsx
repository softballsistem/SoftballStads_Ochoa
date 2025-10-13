import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { TeamLogoUpload } from '../UI/TeamLogo';

interface TeamFormProps {
  team?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function TeamForm({ team, onSubmit, onCancel }: TeamFormProps) {
  const [loading, setLoading] = useState(false);
  const [logoUrl, setLogoUrl] = useState(team?.logo_url || null);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      name: team?.name || '',
      coach: team?.coach || '',
      season: team?.season || '2024',
    },
  });

  const handleFormSubmit = async (data: any) => {
    setLoading(true);
    try {
      await onSubmit({ ...data, logo_url: logoUrl });
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpdate = (newLogoUrl: string) => {
    setLogoUrl(newLogoUrl);
  };
  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Logo Upload Section */}
      {team && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Logo del Equipo
          </label>
          <TeamLogoUpload
            teamId={team.id}
            currentLogoUrl={logoUrl}
            onLogoUpdate={handleLogoUpdate}
          />
        </div>
      )}

      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Team Name *
        </label>
        <input
          {...register('name', { required: 'Team name is required' })}
          type="text"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="Enter team name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div>
        <label htmlFor="coach" className="block text-sm font-medium text-gray-700">
          Coach
        </label>
        <input
          {...register('coach')}
          type="text"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="Enter coach name"
        />
      </div>

      <div>
        <label htmlFor="season" className="block text-sm font-medium text-gray-700">
          Season
        </label>
        <input
          {...register('season', { required: 'Season is required' })}
          type="text"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="e.g., 2024"
        />
        {errors.season && (
          <p className="mt-1 text-sm text-red-600">{errors.season.message}</p>
        )}
      </div>

      <div className="flex justify-end space-x-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : team ? 'Update Team' : 'Create Team'}
        </button>
      </div>
    </form>
  );
}