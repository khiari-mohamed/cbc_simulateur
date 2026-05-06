import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Mail, Phone, Calendar, Shield, CheckCircle, XCircle, UserPlus, Trash2, Download, History } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import api from '../../../lib/api/client';
import { Role } from '../../../types';
import toast from 'react-hot-toast';
import { exportUsersToExcel } from '../../../lib/utils/exportUsers';

export const UsersManagementPage = () => {
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showConventionModal, setShowConventionModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'deactivate' | 'reactivate' | 'delete' | null;
    user: any;
  }>({ isOpen: false, type: null, user: null });
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    message: string;
  }>({ isOpen: false, message: '' });
  const [filterRole, setFilterRole] = useState<Role | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');
  const [filterConvention, setFilterConvention] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const { data } = await api.get('/users');
      return data;
    },
  });

  const { data: conventions } = useQuery({
    queryKey: ['conventions'],
    queryFn: async () => {
      const { data } = await api.get('/conventions');
      return data;
    },
  });

  const { data: assignmentHistory } = useQuery({
    queryKey: ['assignment-history'],
    queryFn: async () => {
      const { data } = await api.get('/users/assignment-history');
      return data;
    },
    enabled: showHistoryModal,
  });

  const toggle2FAMutation = useMutation({
    mutationFn: ({ userId, enabled }: { userId: string; enabled: boolean }) =>
      api.post('/users/toggle-2fa', { userId, enabled }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('2FA mis à jour');
    },
    onError: () => toast.error('Erreur'),
  });

  const deactivateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.patch(`/users/${userId}/deactivate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur désactivé avec succès');
      setConfirmModal({ isOpen: false, type: null, user: null });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la désactivation';
      toast.error(message);
      setConfirmModal({ isOpen: false, type: null, user: null });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.patch(`/users/${userId}/reactivate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur réactivé avec succès');
      setConfirmModal({ isOpen: false, type: null, user: null });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la réactivation';
      toast.error(message);
      setConfirmModal({ isOpen: false, type: null, user: null });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await api.delete(`/users/${userId}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Utilisateur supprimé définitivement');
      setConfirmModal({ isOpen: false, type: null, user: null });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression';
      setConfirmModal({ isOpen: false, type: null, user: null });
      setErrorModal({ isOpen: true, message });
    },
  });

  const assignConventionMutation = useMutation({
    mutationFn: ({ userId, conventionId }: { userId: string; conventionId: string }) =>
      api.post(`/users/${userId}/conventions/${conventionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Convention assignée');
      setShowConventionModal(false);
    },
    onError: () => toast.error('Erreur'),
  });

  const removeConventionMutation = useMutation({
    mutationFn: ({ userId, conventionId }: { userId: string; conventionId: string }) =>
      api.delete(`/users/${userId}/conventions/${conventionId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Convention retirée');
    },
    onError: () => toast.error('Erreur'),
  });

  const handleConfirmAction = () => {
    if (!confirmModal.user) return;

    switch (confirmModal.type) {
      case 'deactivate':
        deactivateMutation.mutate(confirmModal.user.id);
        break;
      case 'reactivate':
        reactivateMutation.mutate(confirmModal.user.id);
        break;
      case 'delete':
        deleteMutation.mutate(confirmModal.user.id);
        break;
    }
  };

  const getConfirmModalConfig = () => {
    const userName = confirmModal.user ? `${confirmModal.user.firstName} ${confirmModal.user.lastName}` : '';
    
    switch (confirmModal.type) {
      case 'deactivate':
        return {
          title: 'Désactiver l\'utilisateur',
          message: `Êtes-vous sûr de vouloir désactiver l'utilisateur "${userName}" ?\n\nL'utilisateur ne pourra plus se connecter.`,
          confirmText: 'Désactiver',
          variant: 'warning' as const,
        };
      case 'reactivate':
        return {
          title: 'Réactiver l\'utilisateur',
          message: `Êtes-vous sûr de vouloir réactiver l'utilisateur "${userName}" ?\n\nL'utilisateur pourra à nouveau se connecter.`,
          confirmText: 'Réactiver',
          variant: 'info' as const,
        };
      case 'delete':
        return {
          title: 'Supprimer définitivement',
          message: `ATTENTION: Voulez-vous vraiment supprimer définitivement l'utilisateur "${userName}" ?\n\nCette action est IRRÉVERSIBLE.\n\nNote: La suppression échouera si l'utilisateur possède des données associées (devis, simulations, contrats). Dans ce cas, utilisez le bouton "Désactiver" à la place.`,
          confirmText: 'Supprimer définitivement',
          variant: 'danger' as const,
        };
      default:
        return {
          title: '',
          message: '',
          confirmText: 'Confirmer',
          variant: 'warning' as const,
        };
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

  const filteredUsers = users?.filter((user: any) => {
    if (filterRole !== 'ALL' && user.role !== filterRole) return false;
    if (filterStatus === 'ACTIVE' && !user.isActive) return false;
    if (filterStatus === 'INACTIVE' && user.isActive) return false;
    if (filterConvention !== 'ALL') {
      const userConventions = user.organization?.conventions || [];
      const hasConvention = userConventions.some((conv: any) => conv.id === filterConvention);
      if (!hasConvention) return false;
    }
    return true;
  }) || [];

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const handleFilterChange = (filterSetter: Function, value: any) => {
    filterSetter(value);
    setCurrentPage(1);
  };

  const handleExport = () => {
    if (!filteredUsers || filteredUsers.length === 0) {
      toast.error('Aucun utilisateur à exporter');
      return;
    }
    try {
      exportUsersToExcel(filteredUsers);
      toast.success('Export Excel réussi!');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erreur lors de l\'export');
    }
  };

  return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Gestion des utilisateurs</h1>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
                Gérer les utilisateurs, rôles, conventions et 2FA
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setShowHistoryModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <History className="w-4 h-4" />
                Historique
              </Button>
              <Button
                onClick={handleExport}
                disabled={!filteredUsers || filteredUsers.length === 0}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white"
              >
                <Download className="w-4 h-4" />
                Exporter Excel
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filtrer par rôle
              </label>
              <select
                value={filterRole}
                onChange={(e) => handleFilterChange(setFilterRole, e.target.value as Role | 'ALL')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Tous les rôles</option>
                <option value={Role.CLIENT_ADHERENT}>Client</option>
                <option value={Role.ADMINISTRATEUR_ARS}>Administrateur</option>
                <option value={Role.GESTIONNAIRE_VALIDATION_ARS}>Gestionnaire</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filtrer par statut
              </label>
              <select
                value={filterStatus}
                onChange={(e) => handleFilterChange(setFilterStatus, e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Tous les statuts</option>
                <option value="ACTIVE">Actif</option>
                <option value="INACTIVE">Inactif</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Filtrer par convention
              </label>
              <select
                value={filterConvention}
                onChange={(e) => handleFilterChange(setFilterConvention, e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="ALL">Toutes les conventions</option>
                {conventions?.map((conv: any) => (
                  <option key={conv.id} value={conv.id}>
                    {conv.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          
          {(filterRole !== 'ALL' || filterStatus !== 'ALL' || filterConvention !== 'ALL') && (
            <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {filteredUsers.length} utilisateur(s) trouvé(s)
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setFilterRole('ALL');
                  setFilterStatus('ALL');
                  setFilterConvention('ALL');
                  setCurrentPage(1);
                }}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          )}
        </Card>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Aucun utilisateur trouvé</p>
          </Card>
        ) : (
          <>
            <div className="mb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Affichage de {startIndex + 1} à {Math.min(endIndex, filteredUsers.length)} sur {filteredUsers.length} utilisateur(s)
              </p>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={10}>10 par page</option>
                <option value={20}>20 par page</option>
                <option value={50}>50 par page</option>
                <option value={100}>100 par page</option>
              </select>
            </div>

            <div className="grid gap-4">
              {paginatedUsers.map((user: any) => (
              <Card key={user.id} className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                      {user.firstName[0]}{user.lastName[0]}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
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
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          user.otpEnabled
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {user.otpEnabled ? '2FA ON' : '2FA OFF'}
                      </span>
                      {user.organization?.conventions && user.organization.conventions.length > 0 && (
                        user.organization.conventions.map((conv: any) => (
                          <span key={conv.id} className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                            {conv.name}
                          </span>
                        ))
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-gray-600 dark:text-gray-400 mb-3">
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
                        {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </div>
                    </div>

                    {user.conventions && user.conventions.length > 0 && (
                      <div className="mb-3">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Conventions:</p>
                        <div className="flex flex-wrap gap-2">
                          {user.conventions.map((uc: any) => (
                            <span
                              key={uc.convention.id}
                              className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs flex items-center gap-1"
                            >
                              {uc.convention.name}
                              <button
                                onClick={() =>
                                  removeConventionMutation.mutate({
                                    userId: user.id,
                                    conventionId: uc.convention.id,
                                  })
                                }
                                className="ml-1 hover:text-red-600"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          toggle2FAMutation.mutate({
                            userId: user.id,
                            enabled: !user.otpEnabled,
                          })
                        }
                      >
                        <Shield className="w-3 h-3 mr-1" />
                        {user.otpEnabled ? 'Désactiver 2FA' : 'Activer 2FA'}
                      </Button>
                      {user.isActive ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-orange-600 hover:text-orange-700 hover:border-orange-600"
                          onClick={() => setConfirmModal({ isOpen: true, type: 'deactivate', user })}
                        >
                          <XCircle className="w-3 h-3 mr-1" />
                          Désactiver
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-green-600 hover:text-green-700 hover:border-green-600"
                          onClick={() => setConfirmModal({ isOpen: true, type: 'reactivate', user })}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Réactiver
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedUser(user);
                          setShowConventionModal(true);
                        }}
                      >
                        <UserPlus className="w-3 h-3 mr-1" />
                        Assigner convention
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setConfirmModal({ isOpen: true, type: 'delete', user })}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Supprimer
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} sur {totalPages}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                  >
                    Premier
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(currentPage - 1)}
                    disabled={currentPage === 1}
                  >
                    Précédent
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <Button
                          key={pageNum}
                          size="sm"
                          variant={currentPage === pageNum ? 'primary' : 'outline'}
                          onClick={() => setCurrentPage(pageNum)}
                          className="min-w-[2.5rem]"
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                  >
                    Suivant
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                  >
                    Dernier
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {showConventionModal && selectedUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Assigner une convention
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {selectedUser.firstName} {selectedUser.lastName}
                </p>
                {conventions && conventions.length > 0 && (
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {conventions.length} convention(s) disponible(s)
                  </p>
                )}
              </div>
              <div className="p-6 space-y-3 overflow-y-auto flex-1">
                {conventions && conventions.length > 0 ? (
                  conventions.map((conv: any) => (
                    <button
                      key={conv.id}
                      onClick={() =>
                        assignConventionMutation.mutate({
                          userId: selectedUser.id,
                          conventionId: conv.id,
                        })
                      }
                      className="w-full p-3 text-left rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">{conv.name}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {conv.companies?.length > 0 
                          ? conv.companies.map((cc: any) => cc.company.name).join(', ')
                          : 'Aucune compagnie'}
                      </p>
                      {conv.organization && (
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          Organisation: {conv.organization.name}
                        </p>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4">
                    Aucune convention disponible
                  </p>
                )}
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowConventionModal(false);
                    setSelectedUser(null);
                  }}
                  className="w-full"
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, type: null, user: null })}
          onConfirm={handleConfirmAction}
          isLoading={deactivateMutation.isPending || reactivateMutation.isPending || deleteMutation.isPending}
          {...getConfirmModalConfig()}
        />

        {/* Error Modal */}
        <ConfirmationModal
          isOpen={errorModal.isOpen}
          onClose={() => setErrorModal({ isOpen: false, message: '' })}
          onConfirm={() => setErrorModal({ isOpen: false, message: '' })}
          title="Suppression impossible"
          message={errorModal.message}
          confirmText="Compris"
          variant="danger"
          isLoading={false}
        />

        {/* Assignment History Modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Historique des assignations
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  Historique des assignations et retraits de conventions
                </p>
              </div>
              <div className="p-6 overflow-y-auto flex-1">
                {!assignmentHistory ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : assignmentHistory.length > 0 ? (
                  <div className="space-y-3">
                    {assignmentHistory.map((log: any) => {
                      const isAssignment = log.action === 'CONVENTION_ASSIGNED';
                      const newValue = log.newValue || {};
                      const targetUser = users?.find((u: any) => u.id === log.entityId);
                      
                      return (
                        <div
                          key={log.id}
                          className="p-4 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2 flex-wrap">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    isAssignment
                                      ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                      : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                                  }`}
                                >
                                  {isAssignment ? 'Assignation' : 'Retrait'}
                                </span>
                                {newValue.conventionName && (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                                    {newValue.conventionName}
                                  </span>
                                )}
                                {newValue.organizationName && (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                    {newValue.organizationName}
                                  </span>
                                )}
                                {newValue.userRole && (
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                                    {newValue.userRole === 'CLIENT_ADHERENT' ? 'Client' : 
                                     newValue.userRole === 'GESTIONNAIRE_VALIDATION_ARS' ? 'Gestionnaire' : 'Admin'}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-900 dark:text-white font-medium">
                                {newValue.userName || (targetUser ? `${targetUser.firstName} ${targetUser.lastName}` : 'Utilisateur inconnu')}
                                {targetUser && (
                                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                                    ({targetUser.email})
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                Par: {log.user ? `${log.user.firstName} ${log.user.lastName}` : 'Système'}
                              </p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(log.createdAt).toLocaleDateString('fr-FR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                })}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {new Date(log.createdAt).toLocaleTimeString('fr-FR', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                    Aucun historique d'assignation
                  </p>
                )}
              </div>
              <div className="p-6 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setShowHistoryModal(false)}
                  className="w-full"
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};
