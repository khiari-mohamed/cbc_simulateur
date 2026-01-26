import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '../../../components/layout/MainLayout';
import { Mail, Phone, Calendar, Trash2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import api from '../../../lib/api/client';
import { Role } from '../../../types';
import toast from 'react-hot-toast';

export const UsersPage = () => {
  const queryClient = useQueryClient();
  
  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (userId: string) => api.delete(`/users/${userId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur supprimé avec succès');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const handleDelete = (userId: string, userName: string) => {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userName} ?`)) {
      deleteMutation.mutate(userId);
    }
  };

  const getRoleBadge = (role: Role) => {
    const styles = {
      [Role.CLIENT_ADHERENT]: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      [Role.ADMINISTRATEUR_ARS]: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
      [Role.GESTIONNAIRE_VALIDATION_ARS]: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    };

    const labels = {
      [Role.CLIENT_ADHERENT]: 'Client',
      [Role.ADMINISTRATEUR_ARS]: 'Administrateur',
      [Role.GESTIONNAIRE_VALIDATION_ARS]: 'Gestionnaire',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[role]}`}>
        {labels[role]}
      </span>
    );
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Utilisateurs</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Gérer les utilisateurs de la plateforme
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid gap-4">
            {users?.map((user: any) => (
              <div
                key={user.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {user.firstName[0]}{user.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </h3>
                      {getRoleBadge(user.role)}
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.isActive
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                        }`}
                      >
                        {user.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {user.email}
                      </div>
                      {user.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {user.phone}
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        Inscrit le {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                  <div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(user.id, `${user.firstName} ${user.lastName}`)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
