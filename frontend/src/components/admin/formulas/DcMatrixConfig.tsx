import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Save, Plus, Trash2, AlertCircle } from 'lucide-react';
import { AddVvRangeModal, AddCapitalColumnModal } from '../AddMatrixModals';
import api from '../../../lib/api/client';
import toast from 'react-hot-toast';

interface Props {
  companyId: string;
  usageType: 'PRIVATE_BUSINESS' | 'COMMERCIAL';
  config: any;
}

export const DcMatrixConfig = ({ companyId, usageType, config }: Props) => {
  const queryClient = useQueryClient();
  const [vvRangeModalOpen, setVvRangeModalOpen] = useState(false);
  const [capitalModalOpen, setCapitalModalOpen] = useState(false);
  const [generalParams, setGeneralParams] = useState({
    basePremium: config?.basePremium || 10,
    discountPercent: config?.discountPercent || 0,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateGeneralParams = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (generalParams.basePremium < 0) {
      newErrors.basePremium = 'Ne peut pas être négatif';
    }
    if (generalParams.discountPercent < 0 || generalParams.discountPercent > 100) {
      newErrors.discountPercent = 'Doit être entre 0 et 100';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveConfig = () => {
    if (!validateGeneralParams()) {
      toast.error('Veuillez corriger les erreurs de validation');
      return;
    }
    saveConfigMutation.mutate(generalParams);
  };

  const validateVvRange = (minVv: number, maxVv: number | null): string | null => {
    if (minVv <= 0) return 'Min VV doit être > 0';
    if (maxVv !== null && maxVv <= minVv) return 'Max VV doit être > Min VV';
    
    // Check for overlaps
    const overlaps = vvRanges?.some((range: any) => {
      if (maxVv === null) return false;
      const rangeMax = range.maxVv || Infinity;
      return (
        (minVv >= range.minVv && minVv < rangeMax) ||
        (maxVv > range.minVv && maxVv <= rangeMax)
      );
    });
    
    if (overlaps) return 'Chevauchement avec une tranche existante';
    return null;
  };

  const validateCapital = (amount: number): string | null => {
    if (amount <= 0) return 'Capital doit être > 0';
    return null;
  };

  useEffect(() => {
    if (config) {
      setGeneralParams({
        basePremium: config.basePremium || 10,
        discountPercent: config.discountPercent || 0,
      });
    } else {
      setGeneralParams({ basePremium: 10, discountPercent: 0 });
    }
  }, [config, companyId, usageType]);

  const { data: vvRanges } = useQuery({
    queryKey: ['matrix-vv-ranges', companyId, usageType],
    queryFn: async () => {
      const { data } = await api.get(`/dc-config/matrix-vv-ranges/${companyId}/${usageType}`);
      return data;
    },
  });

  const { data: capitals } = useQuery({
    queryKey: ['matrix-capitals', companyId, usageType],
    queryFn: async () => {
      const { data } = await api.get(`/dc-config/matrix-capitals/${companyId}/${usageType}`);
      return data;
    },
  });

  const { data: matrixPrices } = useQuery({
    queryKey: ['matrix-prices', companyId, usageType],
    queryFn: async () => {
      const { data } = await api.get(`/dc-config/matrix-prices/${companyId}/${usageType}`);
      return data;
    },
  });

  const saveConfigMutation = useMutation({
    mutationFn: async (values: any) => {
      if (config) {
        const { data } = await api.patch(`/dc-config/${config.id}`, values);
        return data;
      } else {
        const { data } = await api.post('/dc-config', {
          companyId,
          usageType,
          useMatrix: true,
          ...values,
        });
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dc-config'] });
      toast.success('Configuration sauvegardée');
    },
  });

  const saveVvRangeMutation = useMutation({
    mutationFn: async (range: any) => {
      if (range.id) {
        const { data } = await api.patch(`/dc-config/matrix-vv-ranges/${range.id}`, range);
        return data;
      } else {
        const { data } = await api.post('/dc-config/matrix-vv-ranges', { companyId, usageType, ...range });
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-vv-ranges'] });
      toast.success('Tranche VV sauvegardée');
    },
  });

  const deleteVvRangeMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/dc-config/matrix-vv-ranges/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-vv-ranges'] });
      toast.success('Tranche supprimée');
    },
  });

  const saveCapitalMutation = useMutation({
    mutationFn: async (capital: any) => {
      if (capital.id) {
        const { data } = await api.patch(`/dc-config/matrix-capitals/${capital.id}`, capital);
        return data;
      } else {
        const { data } = await api.post('/dc-config/matrix-capitals', { companyId, usageType, ...capital });
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-capitals'] });
      toast.success('Capital sauvegardé');
    },
  });

  const deleteCapitalMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/dc-config/matrix-capitals/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-capitals'] });
      toast.success('Capital supprimé');
    },
  });

  const savePriceMutation = useMutation({
    mutationFn: async (price: any) => {
      const { data } = await api.post('/dc-config/matrix-prices', price);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matrix-prices'] });
      toast.success('Prix sauvegardé');
    },
  });

  const getPrice = (vvRangeId: string, capitalId: string) => {
    return matrixPrices?.find((p: any) => p.vvRangeId === vvRangeId && p.capitalId === capitalId);
  };

  return (
    <div className="space-y-6">
      <AddVvRangeModal
        isOpen={vvRangeModalOpen}
        onClose={() => setVvRangeModalOpen(false)}
        onSubmit={(data) => saveVvRangeMutation.mutate(data)}
      />
      <AddCapitalColumnModal
        isOpen={capitalModalOpen}
        onClose={() => setCapitalModalOpen(false)}
        onSubmit={(data) => saveCapitalMutation.mutate(data)}
        nextOrder={(capitals?.length || 0) + 1}
      />

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Paramètres Généraux
        </h3>

        {/* VV Indicator */}
        <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Valeur Véhicule (VV) utilisée:
            </span>
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
              <div className="w-5 h-5 rounded-full border-2 border-green-600 bg-green-600 flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Valeur Vénale (VV)
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Utilisée pour Dommages Collision (Méthode Matrice)
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2 rounded bg-gray-100 dark:bg-gray-800 opacity-60">
              <div className="w-5 h-5 rounded-full border-2 border-gray-400 dark:border-gray-600 flex items-center justify-center">
              </div>
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Valeur à Neuf (VN)
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Non utilisée pour cette garantie
                </div>
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 italic">
            ℹ️ Le type de VV est automatiquement choisi selon la garantie. Cette sélection ne peut pas être modifiée.
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prime de Base (DT)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={generalParams.basePremium}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                  setGeneralParams({ ...generalParams, basePremium: val });
                  setErrors({ ...errors, basePremium: '' });
                }
              }}
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
              Taux Réduction Global (%)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              value={generalParams.discountPercent}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) {
                  setGeneralParams({ ...generalParams, discountPercent: val });
                  setErrors({ ...errors, discountPercent: '' });
                }
              }}
              className={`w-full px-3 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                errors.discountPercent ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.discountPercent && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.discountPercent}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Utilisé si aucune réduction spécifique n'est définie par tranche VV
            </p>
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
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Tranches VV
          </h3>
          <Button size="sm" onClick={() => setVvRangeModalOpen(true)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Min VV</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Max VV</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Réduction (%)</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vvRanges?.map((range: any) => (
                <tr key={range.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      defaultValue={range.minVv}
                      onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) saveVvRangeMutation.mutate({ id: range.id, minVv: val, maxVv: range.maxVv, reductionRate: range.reductionRate });
                    }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      defaultValue={range.maxVv || ''}
                      placeholder="∞"
                      onBlur={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) : null;
                      if (e.target.value === '' || !isNaN(val!)) saveVvRangeMutation.mutate({ id: range.id, minVv: range.minVv, maxVv: val, reductionRate: range.reductionRate });
                    }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      defaultValue={range.reductionRate || ''}
                      placeholder="Global"
                      onBlur={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) : null;
                      if (e.target.value === '' || !isNaN(val!)) saveVvRangeMutation.mutate({ id: range.id, minVv: range.minVv, maxVv: range.maxVv, reductionRate: val });
                    }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      title="Laisser vide pour utiliser le taux global"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteVvRangeMutation.mutate(range.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Colonnes de Capital
          </h3>
          <Button size="sm" onClick={() => setCapitalModalOpen(true)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Capital (DT)</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Ordre</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              {capitals?.map((capital: any) => (
                <tr key={capital.id} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      defaultValue={capital.amount}
                      onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) saveCapitalMutation.mutate({ id: capital.id, amount: val, order: capital.order });
                    }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      defaultValue={capital.order}
                      onBlur={(e) => {
                      const val = parseInt(e.target.value);
                      if (!isNaN(val)) saveCapitalMutation.mutate({ id: capital.id, amount: capital.amount, order: val });
                    }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteCapitalMutation.mutate(capital.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Matrice de Prix
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                  VV \ Capital
                </th>
                {capitals?.map((capital: any) => (
                  <th key={capital.id} className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {capital.amount} DT
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vvRanges?.map((range: any) => (
                <tr key={range.id}>
                  <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-700 dark:text-gray-300">
                    {range.minVv} - {range.maxVv || '∞'}
                  </td>
                  {capitals?.map((capital: any) => {
                    const price = getPrice(range.id, capital.id);
                    return (
                      <td key={capital.id} className="border border-gray-300 dark:border-gray-600 p-1">
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={price?.prime || ''}
                          placeholder="Prix"
                          onBlur={(e) => {
                            const value = parseFloat(e.target.value);
                            if (!isNaN(value)) {
                              savePriceMutation.mutate({
                                companyId,
                                usageType,
                                vvRangeId: range.id,
                                capitalId: capital.id,
                                prime: value,
                              });
                            }
                          }}
                          className="w-full px-2 py-1 text-sm border-0 bg-transparent text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 rounded"
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
