import React, { useState } from 'react';
import { useForm } from 'react-hook-form';

interface GameFormProps {
  game?: any;
  teams: any[];
  onSubmit: (data: any) => void;
  onCancel: () => void;
}

export function GameForm({ game, teams, onSubmit, onCancel }: GameFormProps) {
  const [loading, setLoading] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      date: game?.date || new Date().toISOString().split('T')[0],
      home_team_id: game?.home_team_id || '',
      away_team_id: game?.away_team_id || '',
      location: game?.location || '',
      home_score: game?.home_score || 0,
      away_score: game?.away_score || 0,
      status: game?.status || 'scheduled',
    },
  });

  const handleFormSubmit = async (data: any) => {
    setLoading(true);
    try {
      const formData = {
        ...data,
        home_team_id: data.home_team_id || null,
        away_team_id: data.away_team_id || null,
        home_score: parseInt(data.home_score) || 0,
        away_score: parseInt(data.away_score) || 0,
      };
      await onSubmit(formData);
    } finally {
      setLoading(false);
    }
  };

  const statusOptions = [
    { value: 'scheduled', label: 'Scheduled' },
    { value: 'in_progress', label: 'In Progress' },
    { value: 'completed', label: 'Completed' },
    { value: 'cancelled', label: 'Cancelled' },
  ];

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
      <div>
        <label htmlFor="date" className="block text-sm font-medium text-gray-700">
          Game Date *
        </label>
        <input
          {...register('date', { required: 'Game date is required' })}
          type="date"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
        />
        {errors.date && (
          <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="home_team_id" className="block text-sm font-medium text-gray-700">
            Home Team
          </label>
          <select
            {...register('home_team_id')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Select Home Team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="away_team_id" className="block text-sm font-medium text-gray-700">
            Away Team
          </label>
          <select
            {...register('away_team_id')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
          >
            <option value="">Select Away Team</option>
            {teams.map((team) => (
              <option key={team.id} value={team.id}>
                {team.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="location" className="block text-sm font-medium text-gray-700">
          Location
        </label>
        <input
          {...register('location')}
          type="text"
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
          placeholder="Enter game location"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label htmlFor="home_score" className="block text-sm font-medium text-gray-700">
            Home Score
          </label>
          <input
            {...register('home_score', { min: 0 })}
            type="number"
            min="0"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div>
          <label htmlFor="away_score" className="block text-sm font-medium text-gray-700">
            Away Score
          </label>
          <input
            {...register('away_score', { min: 0 })}
            type="number"
            min="0"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
          />
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700">
            Status
          </label>
          <select
            {...register('status')}
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-green-500 focus:border-green-500"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
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
          {loading ? 'Saving...' : game ? 'Update Game' : 'Schedule Game'}
        </button>
      </div>
    </form>
  );
}