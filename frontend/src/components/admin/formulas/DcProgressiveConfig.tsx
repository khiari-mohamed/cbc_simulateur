import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Save, Plus, Trash2, AlertCircle } from 'lucide-react';
import { AddCapitalTierModal } from '../AddCapitalTierModal';
import { AddProgressiveTierModal } from '../AddProgressiveTierModal';
import api from '../../../lib/api/client';
import toast from 'react-hot-toast';

interface GeneralParams {
  franchise: number;
  minCapital: number;
  maxCapitalPercent: number;
  maxCapitalAbsolute: number;
  basePremium: number;
  discountPercent: number;
  referenceValue: 'MARKET_VALUE' | 'NEW_VALUE';
}

interface CapitalTier {
  id: string;
  minAmount: number;
  maxAmount: number | null;
  step: number;
  companyId: string;
  usageType: string;
}

interface ProgressiveTier {
  id: string;
  tierNumber: number;
  tierRate: number;
  companyId: string;
  usageType: string;
}

interface Props {
  companyId: string;
  usageType: string;
  config: any;
}

export const DcProgressiveConfig = ({ companyId, usageType, config }: Props) => {
  const queryClient = useQueryClient();
  const [capitalTierModalOpen, setCapitalTierModalOpen] = useState(false);
  const [progressiveTierModalOpen, setProgressiveTierModalOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [generalParams, setGeneralParams] = useState<GeneralParams>({
    franchise: config?.franchise || 0,
    minCapital: config?.minCapital || 1000,
    maxCapitalPercent: config?.maxCapitalPercent || 50,
    maxCapitalAbsolute: config?.maxCapitalAbsolute || 100000,
    basePremium: config?.basePremium || 10,
    discountPercent: config?.discountPercent || 0,
    referenceValue: config?.referenceValue || 'MARKET_VALUE',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateGeneralParams = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (generalParams.franchise < 0 || generalParams.franchise > 100) {
      newErrors.franchise = 'Doit être entre 0 et 100';
    }
    if (generalParams.minCapital <= 0) {
      newErrors.minCapital = 'Doit être supérieur à 0';
    }
    if (generalParams.maxCapitalPercent <= 0 || generalParams.maxCapitalPercent > 100) {
      newErrors.maxCapitalPercent = 'Doit être entre 0 et 100';
    }
    if (generalParams.maxCapitalAbsolute <= 0) {
      newErrors.maxCapitalAbsolute = 'Doit être supérieur à 0';
    }
    if (generalParams.basePremium < 0) {
      newErrors.basePremium = 'Ne peut pas être négatif';
    }
    if (generalParams.discountPercent < 0 || generalParams.discountPercent > 100) {
      newErrors.discountPercent = 'Doit être entre 0 et 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCapitalTier = (minAmount: number, maxAmount: number | null, step: number): string | null => {
    if (minAmount <= 0) return 'Min doit être > 0';
    if (maxAmount !== null && maxAmount <= minAmount) return 'Max doit être > Min';
    if (step <= 0) return 'Pas doit être > 0';
    return null;
  };

  const validateProgressiveTierRate = (rate: number): string | null => {
    if (rate < 0 || rate > 1) return 'Le taux doit être compris entre 0 et 1';
    return null;
  };

  const handleSaveConfig = () => {
    if (!validateGeneralParams()) {
      toast.error('Veuillez corriger les erreurs de validation');
      return;
    }
    saveConfigMutation.mutate(generalParams);
  };

  useEffect(() => {
    if (config) {
      setGeneralParams({
        franchise: config.franchise || 0,
        minCapital: config.minCapital || 1000,
        maxCapitalPercent: config.maxCapitalPercent || 50,
        maxCapitalAbsolute: config.maxCapitalAbsolute || 100000,
        basePremium: config.basePremium || 10,
        discountPercent: config.discountPercent || 0,
        referenceValue: config.referenceValue || 'MARKET_VALUE',
      });
    } else {
      setGeneralParams({ franchise: 0, minCapital: 1000, maxCapitalPercent: 50, maxCapitalAbsolute: 100000, basePremium: 10, discountPercent: 0, referenceValue: 'MARKET_VALUE' });
    }
  }, [config, companyId, usageType]);

  const { data: capitalTiers, isLoading: capitalTiersLoading } = useQuery<CapitalTier[]>({
    queryKey: ['capital-tiers', companyId, usageType],
    queryFn: async () => {
      const { data } = await api.get(`/dc-config/capital-tiers/${companyId}/${usageType}`);
      return data;
    },
    enabled: !!companyId && !!usageType,
  });

  const { data: progressiveTiers, isLoading: progressiveTiersLoading } = useQuery<ProgressiveTier[]>({
    queryKey: ['progressive-tiers', companyId, usageType],
    queryFn: async () => {
      const { data } = await api.get(`/dc-config/progressive-tiers/${companyId}/${usageType}`);
      return data;
    },
    enabled: !!companyId && !!usageType,
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (values: GeneralParams) => {
      if (config) {
        const { data } = await api.patch(`/dc-config/${config.id}`, values);
        return data;
      } else {
        const { data } = await api.post('/dc-config', {
          companyId,
          usageId: usageType,
          useMatrix: false,
          ...values,
        });
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dc-config', companyId, usageType] });
      setHasUnsavedChanges(false);
      toast.success('Configuration sauvegardée');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la sauvegarde';
      toast.error(message);
    },
  });

  const saveCapitalTierMutation = useMutation({
    mutationFn: async (tier: Partial<CapitalTier>) => {
      if (tier.id) {
        const { data } = await api.patch(`/dc-config/capital-tiers/${tier.id}`, tier);
        return data;
      } else {
        const { data } = await api.post('/dc-config/capital-tiers', {
          companyId,
          usageId: usageType,
          ...tier,
        });
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-tiers', companyId, usageType] });
      toast.success('Palier sauvegardé');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la sauvegarde';
      toast.error(message);
    },
  });

  const deleteCapitalTierMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/dc-config/capital-tiers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-tiers', companyId, usageType] });
      toast.success('Palier supprimé');
    },
  });

  const saveProgressiveTierMutation = useMutation({
    mutationFn: async (tier: Partial<ProgressiveTier>) => {
      if (tier.id) {
        const { data } = await api.patch(`/dc-config/progressive-tiers/${tier.id}`, { tierRate: tier.tierRate });
        return data;
      } else {
        const { data } = await api.post('/dc-config/progressive-tiers', {
          companyId,
          usageId: usageType,
          ...tier,
        });
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progressive-tiers', companyId, usageType] });
      toast.success('Taux sauvegardé');
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la sauvegarde';
      toast.error(message);
    },
  });

  const deleteProgressiveTierMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/dc-config/progressive-tiers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progressive-tiers', companyId, usageType] });
      toast.success('Tranche supprimée');
    },
  });

  const handleParamChange = useCallback((field: keyof GeneralParams, value: number) => {
    setGeneralParams(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
    setErrors(prev => ({ ...prev, [field]: '' }));
  }, []);

  return (
    <div className="space-y-6">
      {hasUnsavedChanges && (
        <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700">
          <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
            <AlertCircle className="w-5 h-5" />
            <p className="text-sm font-medium">Modifications non sauvegardées</p>
          </div>
        </Card>
      )}

      <AddCapitalTierModal
        isOpen={capitalTierModalOpen}
        onClose={() => setCapitalTierModalOpen(false)}
        onSubmit={(data) => saveCapitalTierMutation.mutate(data)}
      />
      <AddProgressiveTierModal
        isOpen={progressiveTierModalOpen}
        onClose={() => setProgressiveTierModalOpen(false)}
        onSubmit={(data) => saveProgressiveTierMutation.mutate(data)}
        nextTierNumber={(progressiveTiers?.length || 0) + 1}
      />

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Paramètres Généraux
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Configuration des limites et paramètres de calcul pour la garantie Dommages Collision (Méthode Progressive)
        </p>

        {/* VV Selector - Selectable */}
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Valeur Véhicule (VV) utilisée:
            </span>
          </div>
          
          <div className="space-y-3">
            <div className="space-y-2">
              <label
                className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
                style={{
                  borderColor: generalParams.referenceValue === 'MARKET_VALUE' ? '#16a34a' : '#d1d5db',
                  backgroundColor: generalParams.referenceValue === 'MARKET_VALUE' ? '#f0fdf4' : 'transparent',
                }}
              >
                <input
                  type="radio"
                  name="referenceValue"
                  value="MARKET_VALUE"
                  checked={generalParams.referenceValue === 'MARKET_VALUE'}
                  onChange={(e) => {
                    setGeneralParams({ ...generalParams, referenceValue: e.target.value as 'MARKET_VALUE' });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-5 h-5 text-green-600 focus:ring-green-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Valeur Vénale (VV)
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Utilisée pour Dommages Collision
                    <span className="ml-1 text-blue-600 dark:text-blue-400 font-medium">(Recommandé)</span>
                  </div>
                </div>
              </label>

              <label
                className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
                style={{
                  borderColor: generalParams.referenceValue === 'NEW_VALUE' ? '#16a34a' : '#d1d5db',
                  backgroundColor: generalParams.referenceValue === 'NEW_VALUE' ? '#f0fdf4' : 'transparent',
                }}
              >
                <input
                  type="radio"
                  name="referenceValue"
                  value="NEW_VALUE"
                  checked={generalParams.referenceValue === 'NEW_VALUE'}
                  onChange={(e) => {
                    setGeneralParams({ ...generalParams, referenceValue: e.target.value as 'NEW_VALUE' });
                    setHasUnsavedChanges(true);
                  }}
                  className="w-5 h-5 text-green-600 focus:ring-green-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    Valeur à Neuf (VN)
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Utilisée pour Tous Risques
                  </div>
                </div>
              </label>
            </div>

            <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
              <p>
                Le système recommande automatiquement la valeur de référence selon la garantie, mais vous pouvez la modifier si nécessaire.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Franchise (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={generalParams.franchise}
              onChange={(e) => handleParamChange('franchise', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                errors.franchise ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.franchise && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.franchise}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Capital Minimum (DT)
            </label>
            <input
              type="number"
              min="1"
              value={generalParams.minCapital}
              onChange={(e) => handleParamChange('minCapital', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                errors.minCapital ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.minCapital && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.minCapital}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Capital Max % VV
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={generalParams.maxCapitalPercent}
              onChange={(e) => handleParamChange('maxCapitalPercent', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                errors.maxCapitalPercent ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.maxCapitalPercent && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.maxCapitalPercent}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Plafond Absolu (DT)
            </label>
            <input
              type="number"
              min="1"
              value={generalParams.maxCapitalAbsolute}
              onChange={(e) => handleParamChange('maxCapitalAbsolute', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                errors.maxCapitalAbsolute ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.maxCapitalAbsolute && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.maxCapitalAbsolute}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prime de Base (DT)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={generalParams.basePremium}
              onChange={(e) => handleParamChange('basePremium', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                errors.basePremium ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.basePremium && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.basePremium}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Taux Réduction (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={generalParams.discountPercent}
              onChange={(e) => handleParamChange('discountPercent', parseFloat(e.target.value) || 0)}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                errors.discountPercent ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.discountPercent && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.discountPercent}</p>
            )}
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={handleSaveConfig} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Sauvegarder Paramètres
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Paliers de Capital
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Définir les fourchettes de capital et les incréments autorisés (ex: 1000→1 0000 par pas de 1000)
            </p>
          </div>
          <Button size="sm" onClick={() => setCapitalTierModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        </div>
        {capitalTiersLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Min (DT)</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Max (DT)</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Pas (DT)</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {capitalTiers?.map((tier: any) => (
                <tr key={tier.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      defaultValue={tier.minAmount}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (isNaN(val)) {
                          toast.error('Valeur invalide');
                          e.target.value = tier.minAmount;
                          return;
                        }
                        const error = validateCapitalTier(val, tier.maxAmount, tier.step);
                        if (error) {
                          toast.error(error);
                          e.target.value = tier.minAmount;
                          return;
                        }
                        saveCapitalTierMutation.mutate({ id: tier.id, minAmount: val, maxAmount: tier.maxAmount, step: tier.step });
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      defaultValue={tier.maxAmount || ''}
                      placeholder="-"
                      onBlur={(e) => {
                        const val = e.target.value ? parseFloat(e.target.value) : null;
                        if (e.target.value !== '' && isNaN(val!)) {
                          toast.error('Valeur invalide');
                          e.target.value = tier.maxAmount || '';
                          return;
                        }
                        const error = validateCapitalTier(tier.minAmount, val, tier.step);
                        if (error) {
                          toast.error(error);
                          e.target.value = tier.maxAmount || '';
                          return;
                        }
                        saveCapitalTierMutation.mutate({ id: tier.id, minAmount: tier.minAmount, maxAmount: val, step: tier.step });
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      defaultValue={tier.step}
                      onBlur={(e) => {
                        const val = parseFloat(e.target.value);
                        if (isNaN(val)) {
                          toast.error('Valeur invalide');
                          e.target.value = tier.step;
                          return;
                        }
                        const error = validateCapitalTier(tier.minAmount, tier.maxAmount, val);
                        if (error) {
                          toast.error(error);
                          e.target.value = tier.step;
                          return;
                        }
                        saveCapitalTierMutation.mutate({ id: tier.id, minAmount: tier.minAmount, maxAmount: tier.maxAmount, step: val });
                      }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (window.confirm('Supprimer définitivement ce palier ?')) {
                          deleteCapitalTierMutation.mutate(tier.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Taux Progressifs (Par Tranche)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Taux dégressifs appliqués par tranche de 10% de la VV (ex: Tranche 1=6.7%, Tranche 2=6.3%)
            </p>
          </div>
          <Button size="sm" onClick={() => setProgressiveTierModalOpen(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Ajouter
          </Button>
        </div>
        {progressiveTiersLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {progressiveTiers?.map((tier: any) => (
            <div key={tier.id} className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tranche {tier.tierNumber}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (window.confirm('Supprimer définitivement cette tranche ?')) {
                      deleteProgressiveTierMutation.mutate(tier.id);
                    }
                  }}
                >
                  <Trash2 className="w-3 h-3 text-red-600" />
                </Button>
              </div>
              <input
                type="number"
                step="0.001"
                min="0"
                max="1"
                defaultValue={Number(tier.tierRate)}
                onBlur={(e) => {
                  const val = parseFloat(e.target.value);
                  if (isNaN(val)) {
                    toast.error('Valeur invalide');
                    e.target.value = tier.tierRate;
                    return;
                  }
                  const error = validateProgressiveTierRate(val);
                  if (error) {
                    toast.error(error);
                    e.target.value = tier.tierRate;
                    return;
                  }
                  saveProgressiveTierMutation.mutate({ id: tier.id, tierRate: val });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {(Number(tier.tierRate) * 100).toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
        )}
      </Card>
    </div>
  );
};
