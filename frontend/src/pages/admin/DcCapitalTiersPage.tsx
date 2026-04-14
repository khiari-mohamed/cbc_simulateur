import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Trash2, Save, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmationModal } from '../../components/ui/ConfirmationModal';
import { DcCapitalTiersInfoModal } from './DcCapitalTiersInfoModal';
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

  // Fetch DC configs to check which companies use MATRIX method
  const { data: dcConfigs } = useQuery({
    queryKey: ['dc-configs-all'],
    queryFn: async () => {
      const { data } = await api.get('/dc-config');
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

  // Fetch matrix data for preview (VV ranges, capitals, prices) - AFTER companies and usageTypes
  const { data: matrixVvRanges } = useQuery({
    queryKey: ['matrix-vv-ranges-all', companies, usageTypes],
    queryFn: async () => {
      // Fetch for all companies/usages
      const allRanges: any[] = [];
      if (companies && usageTypes) {
        for (const company of companies) {
          for (const usage of usageTypes) {
            try {
              const { data } = await api.get(`/dc-config/matrix-vv-ranges/${company.id}/${usage.id}`);
              allRanges.push(...data);
            } catch (e) {
              // Ignore errors for companies without matrix config
            }
          }
        }
      }
      return allRanges;
    },
    enabled: !!companies && !!usageTypes,
  });

  const { data: matrixCapitals } = useQuery({
    queryKey: ['matrix-capitals-all', companies, usageTypes],
    queryFn: async () => {
      const allCapitals: any[] = [];
      if (companies && usageTypes) {
        for (const company of companies) {
          for (const usage of usageTypes) {
            try {
              const { data } = await api.get(`/dc-config/matrix-capitals/${company.id}/${usage.id}`);
              allCapitals.push(...data);
            } catch (e) {
              // Ignore errors
            }
          }
        }
      }
      return allCapitals;
    },
    enabled: !!companies && !!usageTypes,
  });

  const { data: matrixPrices } = useQuery({
    queryKey: ['matrix-prices-all', companies, usageTypes],
    queryFn: async () => {
      const allPrices: any[] = [];
      if (companies && usageTypes) {
        for (const company of companies) {
          for (const usage of usageTypes) {
            try {
              const { data } = await api.get(`/dc-config/matrix-prices/${company.id}/${usage.id}`);
              allPrices.push(...data);
            } catch (e) {
              // Ignore errors
            }
          }
        }
      }
      return allPrices;
    },
    enabled: !!companies && !!usageTypes,
  });

  // Fetch progressive tiers for preview
  const { data: progressiveTiers } = useQuery({
    queryKey: ['progressive-tiers-all', companies, usageTypes],
    queryFn: async () => {
      const allTiers: any[] = [];
      if (companies && usageTypes) {
        for (const company of companies) {
          for (const usage of usageTypes) {
            try {
              const { data } = await api.get(`/dc-config/progressive-tiers/${company.id}/${usage.id}`);
              allTiers.push(...data);
            } catch (e) {
              // Ignore errors
            }
          }
        }
      }
      return allTiers;
    },
    enabled: !!companies && !!usageTypes,
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
      // Check if this company/usage uses MATRIX method
      const config = dcConfigs?.find(
        (c: any) => c.companyId === tier.companyId && c.usageId === tier.usageId
      );
      acc[key] = {
        company: tier.company,
        usage: tier.usage,
        tiers: [],
        useMatrix: config?.useMatrix || false,
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
        <div className="flex items-center gap-3">
          <DcCapitalTiersInfoModal />
          <Button onClick={() => setShowAddForm(!showAddForm)}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau Palier
          </Button>
        </div>
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
            </div>

            {/* Display method badge when both company and usage are selected */}
            {formData.companyId && formData.usageId && (() => {
              const selectedConfig = dcConfigs?.find(
                (config: any) => config.companyId === formData.companyId && config.usageId === formData.usageId
              );
              const useMatrix = selectedConfig?.useMatrix || false;
              const companyName = companies?.find((c: any) => c.id === formData.companyId)?.name || '';

              return (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-blue-900 dark:text-blue-200">
                      Méthode détectée pour {companyName}:
                    </span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      useMatrix 
                        ? 'bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200'
                        : 'bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200'
                    }`}>
                      {useMatrix ? 'MATRICE' : 'PROGRESSIVE'}
                    </span>
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

            {/* Preview section based on method */}
            {formData.companyId && formData.usageId && (() => {
              const selectedConfig = dcConfigs?.find(
                (config: any) => config.companyId === formData.companyId && config.usageId === formData.usageId
              );
              const useMatrix = selectedConfig?.useMatrix || false;

              if (useMatrix) {
                // Filter matrix data for this company/usage
                const companyVvRanges = matrixVvRanges?.filter(
                  (r: any) => r.companyId === formData.companyId && r.usageId === formData.usageId && r.isActive
                ) || [];
                const companyCapitals = matrixCapitals?.filter(
                  (c: any) => c.companyId === formData.companyId && c.usageId === formData.usageId && c.isActive
                ) || [];
                const companyPrices = matrixPrices?.filter(
                  (p: any) => p.companyId === formData.companyId && p.usageId === formData.usageId
                ) || [];

                return (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        📊 Aperçu - Configuration MATRICE
                      </h4>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        🔒 Lecture seule
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      ℹ️ La matrice de prix complète se configure dans l'onglet <strong>"Dommages Collision"</strong>.
                    </p>
                    <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-600">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Matrice de prix (lecture seule)
                      </p>
                      {companyVvRanges.length > 0 && companyCapitals.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400">VV (DT)</th>
                                {companyCapitals.sort((a: any, b: any) => a.order - b.order).map((cap: any) => (
                                  <th key={cap.id} className="text-left py-2 px-2 text-gray-600 dark:text-gray-400">
                                    {Number(cap.amount).toLocaleString('fr-FR')}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {companyVvRanges.sort((a: any, b: any) => Number(a.minVv) - Number(b.minVv)).map((vvRange: any) => (
                                <tr key={vvRange.id} className="border-b border-gray-100 dark:border-gray-800">
                                  <td className="py-2 px-2 text-gray-700 dark:text-gray-300 font-medium">
                                    {Number(vvRange.minVv).toLocaleString('fr-FR')} - {vvRange.maxVv ? Number(vvRange.maxVv).toLocaleString('fr-FR') : '∞'}
                                  </td>
                                  {companyCapitals.sort((a: any, b: any) => a.order - b.order).map((cap: any) => {
                                    const price = companyPrices.find(
                                      (p: any) => p.vvRangeId === vvRange.id && p.capitalId === cap.id
                                    );
                                    return (
                                      <td key={cap.id} className="py-2 px-2 text-gray-700 dark:text-gray-300">
                                        {price ? Number(price.prime).toLocaleString('fr-FR') : '-'}
                                      </td>
                                    );
                                  })}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                          La matrice VV × Capital sera affichée ici après configuration dans l'onglet "Dommages Collision".
                        </div>
                      )}
                    </div>
                  </div>
                );
              } else {
                // Filter progressive tiers for this company/usage
                const companyProgressiveTiers = progressiveTiers?.filter(
                  (t: any) => t.companyId === formData.companyId && t.usageId === formData.usageId && t.isActive
                ) || [];

                return (
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                        📊 Aperçu - Configuration PROGRESSIVE
                      </h4>
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                        🔒 Lecture seule
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      ℹ️ Les taux progressifs se configurent dans l'onglet <strong>"Dommages Collision"</strong>.
                    </p>
                    
                    {/* Paliers de Capital (read-only) */}
                    <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-600 mb-3">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Paliers de Capital (lecture seule)
                      </p>
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400">Min (DT)</th>
                              <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400">Max (DT)</th>
                              <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400">Pas (DT)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {tiers
                              ?.filter((t: any) => t.companyId === formData.companyId && t.usageId === formData.usageId && t.isActive)
                              .map((tier: any) => (
                                <tr key={tier.id} className="border-b border-gray-100 dark:border-gray-800">
                                  <td className="py-2 px-2 text-gray-700 dark:text-gray-300">
                                    {Number(tier.minAmount).toLocaleString('fr-FR')}
                                  </td>
                                  <td className="py-2 px-2 text-gray-700 dark:text-gray-300">
                                    {tier.maxAmount ? Number(tier.maxAmount).toLocaleString('fr-FR') : '∞'}
                                  </td>
                                  <td className="py-2 px-2 text-gray-700 dark:text-gray-300">
                                    {Number(tier.step).toLocaleString('fr-FR')}
                                  </td>
                                </tr>
                              ))}
                            {(!tiers || tiers.filter((t: any) => t.companyId === formData.companyId && t.usageId === formData.usageId && t.isActive).length === 0) && (
                              <tr>
                                <td colSpan={3} className="py-3 px-2 text-center text-gray-400 dark:text-gray-500 italic">
                                  Aucun palier configuré
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Taux Progressifs (read-only) */}
                    <div className="bg-white dark:bg-gray-900 p-3 rounded border border-gray-200 dark:border-gray-600">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Taux Progressifs (lecture seule)
                      </p>
                      {companyProgressiveTiers.length > 0 ? (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="border-b border-gray-200 dark:border-gray-700">
                                <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400">Tranche</th>
                                <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400">Taux</th>
                                <th className="text-left py-2 px-2 text-gray-600 dark:text-gray-400">%</th>
                              </tr>
                            </thead>
                            <tbody>
                              {companyProgressiveTiers.sort((a: any, b: any) => a.tierNumber - b.tierNumber).map((tier: any) => (
                                <tr key={tier.id} className="border-b border-gray-100 dark:border-gray-800">
                                  <td className="py-2 px-2 text-gray-700 dark:text-gray-300">
                                    Tranche {tier.tierNumber}
                                  </td>
                                  <td className="py-2 px-2 text-gray-700 dark:text-gray-300">
                                    {Number(tier.tierRate).toFixed(3)}
                                  </td>
                                  <td className="py-2 px-2 text-gray-700 dark:text-gray-300">
                                    {(Number(tier.tierRate) * 100).toFixed(2)}%
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        <div className="text-xs text-gray-400 dark:text-gray-500 italic">
                          Les taux par tranche seront affichés ici après configuration dans l'onglet "Dommages Collision".
                        </div>
                      )}
                    </div>
                  </div>
                );
              }
            })()}

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
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {group.company.name}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Usage: {group.usage.nameFr}
                    </p>
                  </div>
                  {group.useMatrix && (
                    <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 rounded-lg">
                      <span className="text-xs font-semibold text-blue-800 dark:text-blue-200">
                        Méthode: MATRICE
                      </span>
                    </div>
                  )}
                  {!group.useMatrix && (
                    <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded-lg">
                      <span className="text-xs font-semibold text-green-800 dark:text-green-200">
                        Méthode: PROGRESSIVE
                      </span>
                    </div>
                  )}
                </div>
                {group.useMatrix && (
                  <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm text-amber-800 dark:text-amber-200">
                      ⚠️ <strong>Attention:</strong> Cette compagnie utilise la méthode MATRICE. Les paliers DC affichés ci-dessous ne sont pas utilisés dans les calculs. Configurez la matrice dans l'onglet <strong>"Dommages Collision"</strong>.
                    </p>
                  </div>
                )}
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
