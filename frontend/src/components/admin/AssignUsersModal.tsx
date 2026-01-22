import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, UserPlus, Trash2, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';
import type { Convention, User } from '../../types';

interface AssignUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  convention: Convention | null;
}

export const AssignUsersModal = ({ isOpen, onClose, convention }: AssignUsersModalProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const { data: assignedUsers } = useQuery({
    queryKey: ['convention-users', convention?.id],
    queryFn: async () => {
      const { data } = await api.get(`/conventions/${convention?.id}/users`);
      return data.map((item: any) => item.user) as User[];
    },
    enabled: isOpen && !!convention,
  });

  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data as User[];
    },
    enabled: isOpen,
  });

  const assignMutation = useMutation({
    mutationFn: (userId: string) => api.post('/conventions/assign', { userId, conventionId: convention?.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convention-users'] });
      queryClient.invalidateQueries({ queryKey: ['conventions'] });
      toast.success('Utilisateur assigné');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'assignation');
    },
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/conventions/assign/${userId}/${convention?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convention-users'] });
      queryClient.invalidateQueries({ queryKey: ['conventions'] });
      toast.success('Utilisateur retiré');
    },
    onError: () => toast.error('Erreur lors du retrait'),
  });

  if (!isOpen || !convention) return null;

  const assignedUserIds = new Set(assignedUsers?.map(u => u.id) || []);
  const availableUsers = allUsers?.filter(u => 
    !assignedUserIds.has(u.id) && 
    u.role === 'CLIENT_ADHERENT' &&
    (u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
     `${u.firstName} ${u.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()))
  ) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Gérer les utilisateurs
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">{convention.name}</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4 flex-1 overflow-hidden">
          {/* Assigned Users */}
          <div className="flex flex-col">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Utilisateurs assignés ({assignedUsers?.length || 0})
            </h3>
            <div className="flex-1 overflow-y-auto space-y-2">
              {assignedUsers?.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                  <button
                    onClick={() => removeMutation.mutate(user.id)}
                    className="text-red-600 hover:text-red-700"
                    disabled={removeMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {assignedUsers?.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  Aucun utilisateur assigné
                </p>
              )}
            </div>
          </div>

          {/* Available Users */}
          <div className="flex flex-col">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
              Utilisateurs disponibles
            </h3>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-900 dark:border-gray-700"
              />
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {availableUsers.map(user => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.firstName} {user.lastName}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                  </div>
                  <button
                    onClick={() => assignMutation.mutate(user.id)}
                    className="flex flex-col items-center text-primary-600 hover:text-primary-700"
                    disabled={assignMutation.isPending}
                    title="Assigner cet utilisateur"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span className="text-[10px] mt-0.5">Assigner</span>
                  </button>
                </div>
              ))}
              {availableUsers.length === 0 && (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  Aucun utilisateur disponible
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <Button onClick={onClose} variant="outline" className="w-full">
            Fermer
          </Button>
        </div>
      </div>
    </div>
  );
};
