import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Player, PlayerFormData, Team } from '../../types';

interface PlayerFormProps {
  player?: Player;
  teams: Team[];
  onSubmit: (data: PlayerFormData) => void;
  onCancel: () => void;
}

export function PlayerForm({ player, teams, onSubmit, onCancel }: PlayerFormProps) {
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<PlayerFormData>({
    defaultValues: {
      name: player?.name || '',
      jersey_number: player?.jersey_number || null,
      position: player?.position || 'Utility',
      team_id: player?.team_id || '',
      date_of_birth: player?.date_of_birth || '',
    },
  });

  const handleFormSubmit = async (data: PlayerFormData) => {
    setLoading(true);
    try {
      const formData = {
        ...data,
        jersey_number: data.jersey_number ? parseInt(data.jersey_number) : null,
        team_id: data.team_id || null,
        date_of_birth: data.date_of_birth || null,
      };
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const positions = [
    'Pitcher',
    'Catcher',
    '1st Base',
    '2nd Base',
    '3rd Base',
    'Shortstop',
    'Left Field',
    'Center Field',
    'Right Field',
    'Utility',
  ];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Player Name *
        </label>
        <input
          {...register('name', { required: 'Player name is required' })}
          type="text"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="Enter player name"
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="jersey_number" className="block text-sm font-medium text-gray-700">
            Jersey Number
          </label>
          <input
            {...register('jersey_number', { 
              min: { value: 0, message: 'Jersey number must be positive' },
              max: { value: 99, message: 'Jersey number must be 99 or less' }
            })}
            type="number"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
            placeholder="e.g., 42"
            min="0"
            max="99"
          />
          {errors.jersey_number && (
            <p className="mt-1 text-sm text-red-600">{errors.jersey_number.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="position" className="block text-sm font-medium text-gray-700">
            Position
          </label>
          <select
            {...register('position')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
          >
            {positions.map((position) => (
              <option key={position} value={position}>
                {position}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="team_id" className="block text-sm font-medium text-gray-700">
          Team
        </label>
        <select
          {...register('team_id')}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
        >
          <option value="">No Team</option>
          {teams.map((team) => (
            <option key={team.id} value={team.id}>
              {team.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="date_of_birth" className="block text-sm font-medium text-gray-700">
          Date of Birth
        </label>
        <input
          {...register('date_of_birth')}
          type="date"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
        />
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
          {loading ? 'Saving...' : player ? 'Update Player' : 'Create Player'}
        </button>
      </div>
    </form>
  );
}