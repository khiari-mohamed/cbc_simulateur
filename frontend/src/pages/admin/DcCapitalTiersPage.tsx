import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';

export const DcCapitalTiersPage = () => {
  const queryClient = useQueryClient();
  const [showAddForm, setShowAddForm] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'deactivate' | 'reactivate' | 'delete' | null;
    tier: any;
  }>({ isOpen: false, type: null, tier: null });
  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    tier: any;
  }>({ isOpen: false, tier: null });
  const [copyModal, setCopyModal] = useState<{
    isOpen: boolean;
    tier: any;
  }>({ isOpen: false, tier: null });
  const [selectedCompaniesForCopy, setSelectedCompaniesForCopy] = useState<string[]>([]);
  const [editFormData, setEditFormData] = useState({
    minAmount: '',
    maxAmount: '',
    step: '',
  });
  const [formData, setFormData] = useState({
    companyId: '',
    usageId: '',
    minAmount: '',
    maxAmount: '',
    step: '',
  });

  const { data: tiers, isLoading: tiersLoading } = useQuery({
    queryKey: ['dc-capital-tiers'],
    queryFn: async () => {
      const { data } = await api.get('/dc-capital-tiers');
      return data;
    },
  });

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data } = await api.get('/companies');
      return data;
    },
  });

  const { data: usageTypes } = useQuery({
    queryKey: ['usage-types'],
    queryFn: async () => {
      const { data } = await api.get('/usage-types');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        minAmount: Number(data.minAmount),
        maxAmount: data.maxAmount ? Number(data.maxAmount) : undefined,
        step: Number(data.step),
      };
      return api.post('/dc-capital-tiers', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dc-capital-tiers'] });
      toast.success('Palier créé avec succès');
      setShowAddForm(false);
      setFormData({ companyId: '', usageId: '', minAmount: '', maxAmount: '', step: '' });
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const payload = {
        minAmount: Number(data.minAmount),
        maxAmount: data.maxAmount ? Number(data.maxAmount) : undefined,
        step: Number(data.step),
      };
      return api.put(`/dc-capital-tiers/${id}`, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dc-capital-tiers'] });
      toast.success('Palier modifié avec succès');
      setEditModal({ isOpen: false, tier: null });
      setEditFormData({ minAmount: '', maxAmount: '', step: '' });
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        toast.error('Un palier avec ces valeurs existe déjà');
      } else {
        toast.error('Erreur lors de la modification');
      }
      setEditModal({ isOpen: false, tier: null });
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/dc-capital-tiers/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dc-capital-tiers'] });
      toast.success('Palier désactivé');
      setConfirmModal({ isOpen: false, type: null, tier: null });
    },
    onError: () => {
      toast.error('Erreur lors de la désactivation');
      setConfirmModal({ isOpen: false, type: null, tier: null });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async (id: string) => api.patch(`/dc-capital-tiers/${id}/reactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dc-capital-tiers'] });
      toast.success('Palier réactivé');
      setConfirmModal({ isOpen: false, type: null, tier: null });
    },
    onError: () => {
      toast.error('Erreur lors de la réactivation');
      setConfirmModal({ isOpen: false, type: null, tier: null });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/dc-capital-tiers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dc-capital-tiers'] });
      toast.success('Palier supprimé définitivement');
      setConfirmModal({ isOpen: false, type: null, tier: null });
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
      setConfirmModal({ isOpen: false, type: null, tier: null });
    },
  });

  const copyToAllMutation = useMutation({
    mutationFn: async ({ sourceTierId, targetCompanyIds }: { sourceTierId: string; targetCompanyIds: string[] }) => {
      return api.post('/dc-capital-tiers/copy-to-companies', { sourceTierId, targetCompanyIds });
    },
    onSuccess: (response: any) => {
      queryClient.invalidateQueries({ queryKey: ['dc-capital-tiers'] });
      const created = response.data?.created?.length || 0;
      const updated = response.data?.updated?.length || 0;
      const skipped = response.data?.skipped?.length || 0;
      
      const messages = [];
      if (created > 0) messages.push(`${created} créé(s)`);
      if (updated > 0) messages.push(`${updated} mis à jour`);
      if (skipped > 0) messages.push(`${skipped} erreur(s)`);
      
      if (created > 0 || updated > 0) {
        toast.success(`Palier copié: ${messages.join(', ')}`);
      } else {
        toast('Aucune modification effectuée', { icon: 'ℹ️' });
      }
      setCopyModal({ isOpen: false, tier: null });
      setSelectedCompaniesForCopy([]);
    },
    onError: () => {
      toast.error('Erreur lors de la copie');
      setCopyModal({ isOpen: false, tier: null });
      setSelectedCompaniesForCopy([]);
    },
  });

  const handleConfirmAction = () => {
    if (!confirmModal.tier) return;

    switch (confirmModal.type) {
      case 'deactivate':
        deactivateMutation.mutate(confirmModal.tier.id);
        break;
      case 'reactivate':
        reactivateMutation.mutate(confirmModal.tier.id);
        break;
      case 'delete':
        deleteMutation.mutate(confirmModal.tier.id);
        break;
    }
  };

  const getConfirmModalConfig = () => {
    const tierLabel = confirmModal.tier 
      ? `${Number(confirmModal.tier.minAmount).toLocaleString('fr-FR')} DT (${confirmModal.tier.company.name} - ${confirmModal.tier.usage.nameFr})`
      : '';
    
    switch (confirmModal.type) {
      case 'deactivate':
        return {
          title: 'Désactiver le palier',
          message: `Êtes-vous sûr de vouloir désactiver le palier "${tierLabel}" ?\n\nLe palier ne sera plus disponible dans les simulations.`,
          confirmText: 'Désactiver',
          variant: 'warning' as const,
        };
      case 'reactivate':
        return {
          title: 'Réactiver le palier',
          message: `Êtes-vous sûr de vouloir réactiver le palier "${tierLabel}" ?\n\nLe palier sera à nouveau disponible dans les simulations.`,
          confirmText: 'Réactiver',
          variant: 'info' as const,
        };
      case 'delete':
        return {
          title: 'Supprimer définitivement',
          message: `ATTENTION: Voulez-vous vraiment supprimer définitivement le palier "${tierLabel}" ?\n\nCette action est IRRÉVERSIBLE.`,
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    const minAmount = Number(formData.minAmount);
    const maxAmount = formData.maxAmount ? Number(formData.maxAmount) : null;
    const step = Number(formData.step);

    if (maxAmount && maxAmount < minAmount) {
      toast.error('Le montant maximum doit être supérieur ou égal au montant minimum');
      return;
    }

    if (step <= 0) {
      toast.error('Le pas doit être supérieur à 0');
      return;
    }

    createMutation.mutate(formData);
  };

  const groupedTiers = tiers?.reduce((acc: any, tier: any) => {
    const key = `${tier.company.name}-${tier.usage.nameFr}`;
    if (!acc[key]) {
      acc[key] = {
        company: tier.company,
        usage: tier.usage,
        tiers: [],
      };
    }
    acc[key].tiers.push(tier);
    return acc;
  }, {});

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Paliers de Capital DC
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
            Configuration des paliers de capital pour Dommages Collision
          </p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="w-4 h-4 mr-2" />
          Nouveau Palier
        </Button>
      </div>

      {showAddForm && (
        <Card className="p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Ajouter un Palier
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Compagnie *
                </label>
                <select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Sélectionner une compagnie</option>
                  {companies?.map((c: any) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type d'usage *
                </label>
                <select
                  value={formData.usageId}
                  onChange={(e) => setFormData({ ...formData, usageId: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="">Sélectionner un usage</option>
                  {usageTypes?.map((u: any) => (
                    <option key={u.id} value={u.id}>
                      {u.nameFr}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Montant Min (DT) *
                </label>
                <input
                  type="number"
                  value={formData.minAmount}
                  onChange={(e) => setFormData({ ...formData, minAmount: e.target.value })}
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Montant Max (DT)
                </label>
                <input
                  type="number"
                  value={formData.maxAmount}
                  onChange={(e) => setFormData({ ...formData, maxAmount: e.target.value })}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pas (Step) *
                </label>
                <input
                  type="number"
                  value={formData.step}
                  onChange={(e) => setFormData({ ...formData, step: e.target.value })}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <Button type="submit" disabled={createMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  setFormData({ companyId: '', usageId: '', minAmount: '', maxAmount: '', step: '' });
                }}
              >
                <X className="w-4 h-4 mr-2" />
                Annuler
              </Button>
            </div>
          </form>
        </Card>
      )}

      {tiersLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedTiers || {}).map(([key, group]: [string, any]) => (
            <Card key={key} className="p-6">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {group.company.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Usage: {group.usage.nameFr}
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Min (DT)
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Max (DT)
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Pas
                      </th>
                      <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Statut
                      </th>
                      <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700 dark:text-gray-300">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.tiers.map((tier: any) => (
                      <tr
                        key={tier.id}
                        className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                          {Number(tier.minAmount).toLocaleString('fr-FR')}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                          {tier.maxAmount ? Number(tier.maxAmount).toLocaleString('fr-FR') : '∞'}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                          {Number(tier.step).toLocaleString('fr-FR')}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
                              tier.isActive
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                            }`}
                          >
                            {tier.isActive ? 'Actif' : 'Inactif'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditFormData({
                                  minAmount: tier.minAmount.toString(),
                                  maxAmount: tier.maxAmount?.toString() || '',
                                  step: tier.step.toString(),
                                });
                                setEditModal({ isOpen: true, tier });
                              }}
                            >
                              Modifier
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-blue-600 hover:text-blue-700 hover:border-blue-600"
                              onClick={() => {
                                const otherCompanies = companies?.filter((c: any) => c.id !== tier.companyId) || [];
                                if (otherCompanies.length === 0) {
                                  toast('Aucune autre compagnie disponible', { icon: 'ℹ️' });
                                  return;
                                }
                                setCopyModal({ isOpen: true, tier });
                                setSelectedCompaniesForCopy([]);
                              }}
                            >
                              Copier vers...
                            </Button>
                            {tier.isActive ? (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-orange-600 hover:text-orange-700 hover:border-orange-600"
                                onClick={() => setConfirmModal({ isOpen: true, type: 'deactivate', tier })}
                              >
                                Désactiver
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:border-green-600"
                                onClick={() => setConfirmModal({ isOpen: true, type: 'reactivate', tier })}
                              >
                                Réactiver
                              </Button>
                            )}
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmModal({ isOpen: true, type: 'delete', tier })}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          ))}

          {(!groupedTiers || Object.keys(groupedTiers).length === 0) && (
            <Card className="p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Aucun palier configuré. Cliquez sur "Nouveau Palier" pour commencer.
              </p>
            </Card>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal({ isOpen: false, type: null, tier: null })}
        onConfirm={handleConfirmAction}
        isLoading={deactivateMutation.isPending || reactivateMutation.isPending || deleteMutation.isPending}
        {...getConfirmModalConfig()}
      />

      {/* Copy Modal */}
      {copyModal.isOpen && copyModal.tier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Copier le palier vers d'autres compagnies
            </h3>
            <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <p className="text-sm text-gray-700 dark:text-gray-300">
                <strong>Palier source:</strong> {copyModal.tier.company.name} - {copyModal.tier.usage.nameFr}
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Min: {Number(copyModal.tier.minAmount).toLocaleString('fr-FR')} DT | 
                Max: {copyModal.tier.maxAmount ? Number(copyModal.tier.maxAmount).toLocaleString('fr-FR') : '∞'} DT | 
                Pas: {Number(copyModal.tier.step).toLocaleString('fr-FR')} DT
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                ℹ️ Les paliers existants avec le même montant minimum seront mis à jour
              </p>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Sélectionner les compagnies cibles *
              </label>
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-60 overflow-y-auto space-y-2">
                <label className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCompaniesForCopy.length === companies?.filter((c: any) => c.id !== copyModal.tier.companyId).length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const allOtherIds = companies?.filter((c: any) => c.id !== copyModal.tier.companyId).map((c: any) => c.id) || [];
                        setSelectedCompaniesForCopy(allOtherIds);
                      } else {
                        setSelectedCompaniesForCopy([]);
                      }
                    }}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    Toutes les compagnies
                  </span>
                </label>
                <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>
                {companies?.filter((c: any) => c.id !== copyModal.tier.companyId).map((company: any) => (
                  <label key={company.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedCompaniesForCopy.includes(company.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedCompaniesForCopy([...selectedCompaniesForCopy, company.id]);
                        } else {
                          setSelectedCompaniesForCopy(selectedCompaniesForCopy.filter(id => id !== company.id));
                        }
                      }}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">
                      {company.name}
                    </span>
                  </label>
                ))}
              </div>
              {selectedCompaniesForCopy.length > 0 && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {selectedCompaniesForCopy.length} compagnie(s) sélectionnée(s)
                </p>
              )}
            </div>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => {
                  setCopyModal({ isOpen: false, tier: null });
                  setSelectedCompaniesForCopy([]);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  if (selectedCompaniesForCopy.length === 0) {
                    toast.error('Veuillez sélectionner au moins une compagnie');
                    return;
                  }
                  copyToAllMutation.mutate({ sourceTierId: copyModal.tier.id, targetCompanyIds: selectedCompaniesForCopy });
                }}
                disabled={copyToAllMutation.isPending || selectedCompaniesForCopy.length === 0}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {copyToAllMutation.isPending ? 'Copie en cours...' : 'Copier'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModal.isOpen && editModal.tier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Modifier le palier
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {editModal.tier.company.name} - {editModal.tier.usage.nameFr}
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Montant Min (DT) *
                </label>
                <input
                  type="number"
                  value={editFormData.minAmount}
                  onChange={(e) => setEditFormData({ ...editFormData, minAmount: e.target.value })}
                  required
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Montant Max (DT)
                </label>
                <input
                  type="number"
                  value={editFormData.maxAmount}
                  onChange={(e) => setEditFormData({ ...editFormData, maxAmount: e.target.value })}
                  min="0"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Pas (Step) *
                </label>
                <input
                  type="number"
                  value={editFormData.step}
                  onChange={(e) => setEditFormData({ ...editFormData, step: e.target.value })}
                  required
                  min="1"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setEditModal({ isOpen: false, tier: null })}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  const minAmount = Number(editFormData.minAmount);
                  const maxAmount = editFormData.maxAmount ? Number(editFormData.maxAmount) : null;
                  const step = Number(editFormData.step);
                  if (maxAmount && maxAmount < minAmount) {
                    toast.error('Le maximum doit être ≥ au minimum');
                    return;
                  }
                  if (step <= 0) {
                    toast.error('Le pas doit être > 0');
                    return;
                  }
                  updateMutation.mutate({ id: editModal.tier.id, data: editFormData });
                }}
                disabled={updateMutation.isPending}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {updateMutation.isPending ? 'Modification...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
