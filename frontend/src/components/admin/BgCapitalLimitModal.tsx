import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Info, Plus, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';

interface BgCapitalLimitModalProps {
  limit: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const BgCapitalLimitModal = ({ onClose }: BgCapitalLimitModalProps) => {
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedLimit, setSelectedLimit] = useState<any>(null);
  const [deletingLimit, setDeletingLimit] = useState<any>(null);
  const [formData, setFormData] = useState({
    value: '',
    label: '',
    description: '',
    isStandard: false,
    isActive: true,
  });

  const { data: limits, isLoading } = useQuery({
    queryKey: ['bg-capital-limits', 'all'],
    queryFn: async () => {
      const { data } = await api.get('/bg-capital-limits?includeInactive=true');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/bg-capital-limits', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bg-capital-limits'] });
      toast.success('Limite créée avec succès');
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la création';
      toast.error(message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/bg-capital-limits/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bg-capital-limits'] });
      toast.success('Limite modifiée avec succès');
      setIsFormOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la modification';
      toast.error(message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/bg-capital-limits/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bg-capital-limits'] });
      toast.success('Limite supprimée définitivement');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/bg-capital-limits/${id}/deactivate`),
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

  const resetForm = () => {
    setFormData({
      value: '',
      label: '',
      description: '',
      isStandard: false,
      isActive: true,
    });
    setSelectedLimit(null);
  };

  const handleAdd = () => {
    resetForm();
    setIsFormOpen(true);
  };

  const handleEdit = (limit: any) => {
    setSelectedLimit(limit);
    setFormData({
      value: limit.value.toString(),
      label: limit.label || '',
      description: limit.description || '',
      isStandard: limit.isStandard,
      isActive: limit.isActive,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.value || parseFloat(formData.value) <= 0) {
      toast.error('La valeur doit être supérieure à 0');
      return;
    }

    const valueNum = parseFloat(formData.value);

    const payload = {
      value: valueNum,
      label: formData.label || `${valueNum.toLocaleString('fr-FR')} DT`,
      description: formData.description || null,
      isStandard: formData.isStandard,
      isActive: formData.isActive,
    };

    console.log('Payload label:', payload.label); // Debug

    if (selectedLimit) {
      updateMutation.mutate({ id: selectedLimit.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Gérer les limites de capital BG
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        {!isFormOpen ? (
          <div className="p-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 flex items-start gap-2 mb-4">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Ces limites apparaissent dans le menu déroulant lors de la sélection de la garantie Bris de Glaces.
              </p>
            </div>

            <div className="flex justify-end mb-4">
              <Button onClick={handleAdd}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter une limite
              </Button>
            </div>

            {isLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : limits && limits.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Valeur (DT)</th>
                      <th className="text-left py-3 px-4 font-semibold text-gray-900 dark:text-white">Libellé</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Standard</th>
                      <th className="text-center py-3 px-4 font-semibold text-gray-900 dark:text-white">Statut</th>
                      <th className="text-right py-3 px-4 font-semibold text-gray-900 dark:text-white">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {limits
                      .sort((a: any, b: any) => a.value - b.value)
                      .map((limit: any) => (
                        <tr key={limit.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="py-3 px-4 font-mono font-semibold text-gray-900 dark:text-white">
                            {parseFloat(limit.value).toLocaleString('fr-FR')} DT
                          </td>
                          <td className="py-3 px-4 text-gray-900 dark:text-white">{limit.label || '-'}</td>
                          <td className="py-3 px-4 text-center">
                            {limit.isStandard ? (
                              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto" />
                            ) : (
                              <span className="text-gray-400">-</span>
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
                              <Button size="sm" variant="outline" onClick={() => handleEdit(limit)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              {limit.isActive ? (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => deactivateMutation.mutate(limit.id)}
                                    loading={deactivateMutation.isPending}
                                    title="Désactiver"
                                  >
                                    <X className="w-4 h-4 text-orange-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setDeletingLimit(limit)}
                                    title="Supprimer définitivement"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => reactivateMutation.mutate(limit.id)}
                                    loading={reactivateMutation.isPending}
                                    title="Réactiver"
                                  >
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setDeletingLimit(limit)}
                                    title="Supprimer définitivement"
                                  >
                                    <Trash2 className="w-4 h-4 text-red-600" />
                                  </Button>
                                </>
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
                <p className="text-gray-600 dark:text-gray-400 mb-4">Aucune limite configurée</p>
                <Button onClick={handleAdd}>
                  <Plus className="w-4 h-4 mr-2" />
                  Ajouter la première limite
                </Button>
              </div>
            )}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {selectedLimit ? 'Modifier' : 'Ajouter'} une limite
              </h3>
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Retour à la liste
              </Button>
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                Cette limite apparaîtra dans le menu déroulant lors de la sélection de la garantie Bris de Glaces.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valeur (DT) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={formData.value}
                  onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Ex: 1000, 2000, 5000"
                  required
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Montant du capital en Dinars Tunisiens (DT)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Libellé
                </label>
                <input
                  type="text"
                  value={formData.label}
                  onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Ex: 5 000 DT"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Texte affiché dans le menu déroulant (généré automatiquement si vide)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  placeholder="Ex: Couverture minimale"
                  rows={2}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Description optionnelle pour usage interne
                </p>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isStandard}
                    onChange={(e) => setFormData({ ...formData, isStandard: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Limite standard</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Actif</span>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {createMutation.isPending || updateMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deletingLimit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Trash2 className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Confirmer la suppression
                </h3>
              </div>
              <button onClick={() => setDeletingLimit(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white font-medium mb-2">
                    Êtes-vous sûr de vouloir supprimer définitivement la limite {deletingLimit.value.toLocaleString()} DT ?
                  </p>
                  <p className="text-sm text-red-600 dark:text-red-400 font-semibold mb-2">
                    ⚠️ Cette action est irréversible !
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    La limite sera supprimée de la base de données et ne pourra pas être récupérée.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={() => setDeletingLimit(null)}>
                Annuler
              </Button>
              <Button
                type="button"
                onClick={() => {
                  deleteMutation.mutate(deletingLimit.id);
                  setDeletingLimit(null);
                }}
                disabled={deleteMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteMutation.isPending ? 'Suppression...' : 'Supprimer définitivement'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
