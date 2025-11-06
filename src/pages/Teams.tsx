import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Plus, CreditCard as Edit2, Trash2, Users, Trophy, Search } from 'lucide-react';
import { teamsApi, playersApi } from '../services/api';
import type { Team, PlayerWithTeamAndStats } from '../lib/supabase';
import { TeamForm } from '../components/Teams/TeamForm';
import { TeamLogo } from '../components/UI/TeamLogo';
import { Modal } from '../components/UI/Modal';
import { TeamFormData } from '../types';

const fetchTeams = async () => {
  return teamsApi.getAll();
};

function Teams() {
  const queryClient = useQueryClient();
  const { data: teams, isLoading, error } = useQuery('teams', fetchTeams);

  const [showForm, setShowForm] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [teamPlayers, setTeamPlayers] = useState<{ [key: string]: PlayerWithTeamAndStats[] }>({});
  const [searchTerm, setSearchTerm] = useState('');

  const createTeamMutation = useMutation(teamsApi.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('teams');
      setShowForm(false);
    },
  });

  const updateTeamMutation = useMutation(
    (variables: { id: string; teamData: TeamFormData }) => teamsApi.update(variables.id, variables.teamData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('teams');
        setShowForm(false);
        setEditingTeam(null);
      },
    }
  );

  const deleteTeamMutation = useMutation(teamsApi.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('teams');
    },
  });

  useEffect(() => {
    const loadPlayersForTeams = async () => {
      if (teams) {
        const playersData: { [key: string]: PlayerWithTeamAndStats[] } = {};
        await Promise.all(
          teams.map(async (team) => {
            const players = await playersApi.getByTeam(team.id);
            playersData[team.id] = players;
          })
        );
        setTeamPlayers(playersData);
      }
    };
    loadPlayersForTeams();
  }, [teams]);

  const handleSubmit = async (teamData: TeamFormData) => {
    if (editingTeam) {
      updateTeamMutation.mutate({ id: editingTeam.id, teamData });
    } else {
      createTeamMutation.mutate(teamData);
    }
  };

  const handleEdit = (team: Team) => {
    setEditingTeam(team);
    setShowForm(true);
  };

  const handleDelete = async (teamId: string) => {
    if (window.confirm('Are you sure you want to delete this team? This will also delete all associated players and statistics.')) {
      deleteTeamMutation.mutate(teamId);
    }
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingTeam(null);
  };

  const filteredTeams = React.useMemo(() => {
    if (!teams) return [];
    return teams.filter(team =>
      team.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [teams, searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error) {
    return <div>Error loading data</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Teams</h1>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Team
        </button>
      </div>

      <div className="mt-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search teams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-green-500 focus:border-green-500 sm:text-sm"
          />
        </div>
      </div>

      {filteredTeams.length === 0 ? (
        <div className="text-center py-12">
          <Trophy className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No teams</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new team.</p>
          <div className="mt-6">
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Team
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTeams.map((team) => (
            <div key={team.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <TeamLogo 
                    logoUrl={team.logo_url} 
                    teamName={team.name} 
                    size="large" 
                    className="mr-3" 
                  />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{team.name}</h3>
                    <p className="text-sm text-gray-600">Season: {team.season}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(team)}
                    className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(team.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>Coach: {team.coach || 'Not assigned'}</span>
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-2" />
                  <span>Players: {teamPlayers[team.id]?.length || 0}</span>
                </div>
              </div>

              {teamPlayers[team.id] && teamPlayers[team.id].length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Recent Players</h4>
                  <div className="space-y-1">
                    {teamPlayers[team.id].slice(0, 3).map((player) => (
                      <div key={player.id} className="text-xs text-gray-600">
                        #{player.jersey_number || '00'} {player.name} - {player.position}
                      </div>
                    ))}
                    {teamPlayers[team.id].length > 3 && (
                      <div className="text-xs text-gray-500">
                        +{teamPlayers[team.id].length - 3} more players
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showForm}
        onClose={closeForm}
        title={editingTeam ? 'Edit Team' : 'Add New Team'}
      >
        <TeamForm
          team={editingTeam}
          onSubmit={handleSubmit}
          onCancel={closeForm}
        />
      </Modal>
    </div>
  );
}

export default Teams;
