import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, CheckCircle, XCircle, Shield } from 'lucide-react';
import { MainLayout } from '../../components/layout/MainLayout';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';
import { BgCapitalLimitModal } from '../../components/admin/BgCapitalLimitModal';

export const BgCapitalLimitsPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLimit, setSelectedLimit] = useState<any>(null);

  const { data: limits, isLoading } = useQuery({
    queryKey: ['bg-capital-limits', 'all'],
    queryFn: async () => {
      const { data } = await api.get('/bg-capital-limits?includeInactive=true');
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/bg-capital-limits/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bg-capital-limits'] });
      toast.success('Limite désactivée avec succès');
    },
    onError: () => toast.error('Erreur lors de la désactivation'),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/bg-capital-limits/${id}/reactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bg-capital-limits'] });
      toast.success('Limite réactivée avec succès');
    },
    onError: () => toast.error('Erreur lors de la réactivation'),
  });

  const handleEdit = (limit: any) => {
    setSelectedLimit(limit);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedLimit(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedLimit(null);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['bg-capital-limits'] });
    handleCloseModal();
  };

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Shield className="w-8 h-8" />
                Limites de Capital - Bris de Glaces
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Gérer les options de capital disponibles pour la garantie Bris de Glaces
              </p>
            </div>
            <Button onClick={handleAdd}>
              <Plus className="w-4 h-4 mr-2" />
              Ajouter une limite
            </Button>
          </div>
          <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Info :</strong> Ces limites apparaissent dans le menu déroulant lors de la création d'un devis avec la garantie Bris de Glaces. Les clients peuvent choisir parmi ces options.
            </p>
          </div>
        </div>

        <Card>
          <div className="p-6">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-400 mt-4">Chargement...</p>
              </div>
            ) : limits && limits.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        Valeur (DT)
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        Libellé
                      </th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        Description
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        Standard
                      </th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        Statut
                      </th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {limits
                      .sort((a: any, b: any) => a.value - b.value)
                      .map((limit: any) => (
                        <tr
                          key={limit.id}
                          className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                        >
                          <td className="py-3 px-4">
                            <span className="font-mono font-semibold text-gray-900 dark:text-white">
                              {limit.value.toLocaleString()} DT
                            </span>
                          </td>
                          <td className="py-3 px-4 text-gray-900 dark:text-white">
                            {limit.label || '-'}
                          </td>
                          <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                            {limit.description || '-'}
                          </td>
                          <td className="py-3 px-4 text-center">
                            {limit.isStandard ? (
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto" />
                            ) : (
                              <XCircle className="w-5 h-5 text-gray-400 dark:text-gray-600 mx-auto" />
                            )}
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                limit.isActive
                                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                              }`}
                            >
                              {limit.isActive ? 'Actif' : 'Inactif'}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEdit(limit)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              {limit.isActive ? (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteMutation.mutate(limit.id)}
                                  loading={deleteMutation.isPending}
                                >
                                  <Trash2 className="w-4 h-4 text-red-600" />
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => reactivateMutation.mutate(limit.id)}
                                  loading={reactivateMutation.isPending}
                                >
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Aucune limite de capital configurée
                </p>
                <Button onClick={handleAdd}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter la première limite
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {isModalOpen && (
        <BgCapitalLimitModal
          limit={selectedLimit}
          onClose={handleCloseModal}
          onSuccess={handleSuccess}
        />
      )}
    </MainLayout>
  );
};
