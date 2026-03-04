import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../ui/Card';
import { Button } from '../../ui/Button';
import { Save, Plus, Trash2 } from 'lucide-react';
import { AddCapitalTierModal } from '../AddCapitalTierModal';
import { AddProgressiveTierModal } from '../AddProgressiveTierModal';
import api from '../../../lib/api/client';
import toast from 'react-hot-toast';

interface Props {
  companyId: string;
  usageType: 'PRIVATE_BUSINESS' | 'COMMERCIAL';
  config: any;
}

export const DcProgressiveConfig = ({ companyId, usageType, config }: Props) => {
  const queryClient = useQueryClient();
  const [capitalTierModalOpen, setCapitalTierModalOpen] = useState(false);
  const [progressiveTierModalOpen, setProgressiveTierModalOpen] = useState(false);
  const [generalParams, setGeneralParams] = useState({
    franchise: config?.franchise || 0,
    minCapital: config?.minCapital || 1000,
    maxCapitalPercent: config?.maxCapitalPercent || 50,
    maxCapitalAbsolute: config?.maxCapitalAbsolute || 100000,
    basePremium: config?.basePremium || 10,
    discountPercent: config?.discountPercent || 0,
  });

  useEffect(() => {
    if (config) {
      setGeneralParams({
        franchise: config.franchise || 0,
        minCapital: config.minCapital || 1000,
        maxCapitalPercent: config.maxCapitalPercent || 50,
        maxCapitalAbsolute: config.maxCapitalAbsolute || 100000,
        basePremium: config.basePremium || 10,
        discountPercent: config.discountPercent || 0,
      });
    } else {
      setGeneralParams({ franchise: 0, minCapital: 1000, maxCapitalPercent: 50, maxCapitalAbsolute: 100000, basePremium: 10, discountPercent: 0 });
    }
  }, [config, companyId, usageType]);

  const { data: capitalTiers } = useQuery({
    queryKey: ['capital-tiers', companyId, usageType],
    queryFn: async () => {
      const { data } = await api.get(`/dc-config/capital-tiers/${companyId}/${usageType}`);
      return data;
    },
  });

  const { data: progressiveTiers } = useQuery({
    queryKey: ['progressive-tiers', companyId, usageType],
    queryFn: async () => {
      const { data } = await api.get(`/dc-config/progressive-tiers/${companyId}/${usageType}`);
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
          useMatrix: false,
          ...values,
        });
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dc-config'] });
      toast.success('Configuration sauvegardée');
    },
    onError: () => toast.error('Erreur lors de la sauvegarde'),
  });

  const saveCapitalTierMutation = useMutation({
    mutationFn: async (tier: any) => {
      if (tier.id) {
        const { data } = await api.patch(`/dc-config/capital-tiers/${tier.id}`, tier);
        return data;
      } else {
        const { data } = await api.post('/dc-config/capital-tiers', {
          companyId,
          usageType,
          ...tier,
        });
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-tiers'] });
      toast.success('Palier sauvegardé');
    },
    onError: () => toast.error('Erreur'),
  });

  const deleteCapitalTierMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/dc-config/capital-tiers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['capital-tiers'] });
      toast.success('Palier supprimé');
    },
  });

  const saveProgressiveTierMutation = useMutation({
    mutationFn: async (tier: any) => {
      if (tier.id) {
        const { data } = await api.patch(`/dc-config/progressive-tiers/${tier.id}`, { tierRate: tier.tierRate });
        return data;
      } else {
        const { data } = await api.post('/dc-config/progressive-tiers', {
          companyId,
          usageType,
          ...tier,
        });
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progressive-tiers'] });
      toast.success('Taux sauvegardé');
    },
    onError: () => toast.error('Erreur'),
  });

  const deleteProgressiveTierMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/dc-config/progressive-tiers/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['progressive-tiers'] });
      toast.success('Tranche supprimée');
    },
  });

  return (
    <div className="space-y-6">
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Franchise (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={generalParams.franchise}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) setGeneralParams({ ...generalParams, franchise: val });
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Capital Minimum (DT)
            </label>
            <input
              type="number"
              value={generalParams.minCapital}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) setGeneralParams({ ...generalParams, minCapital: val });
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Capital Max % VV
            </label>
            <input
              type="number"
              step="0.01"
              value={generalParams.maxCapitalPercent}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) setGeneralParams({ ...generalParams, maxCapitalPercent: val });
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Plafond Absolu (DT)
            </label>
            <input
              type="number"
              value={generalParams.maxCapitalAbsolute}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) setGeneralParams({ ...generalParams, maxCapitalAbsolute: val });
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prime de Base (DT)
            </label>
            <input
              type="number"
              step="0.01"
              value={generalParams.basePremium}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) setGeneralParams({ ...generalParams, basePremium: val });
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Taux Réduction (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={generalParams.discountPercent}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                if (!isNaN(val)) setGeneralParams({ ...generalParams, discountPercent: val });
              }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
        </div>
        <div className="mt-4">
          <Button onClick={() => saveConfigMutation.mutate(generalParams)} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            Sauvegarder Paramètres
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Paliers de Capital
          </h3>
          <Button size="sm" onClick={() => setCapitalTierModalOpen(true)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
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
                      defaultValue={tier.minAmount}
                      onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) saveCapitalTierMutation.mutate({ id: tier.id, minAmount: val, maxAmount: tier.maxAmount, step: tier.step });
                    }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      defaultValue={tier.maxAmount || ''}
                      placeholder="-"
                      onBlur={(e) => {
                      const val = e.target.value ? parseFloat(e.target.value) : null;
                      if (e.target.value === '' || !isNaN(val!)) saveCapitalTierMutation.mutate({ id: tier.id, minAmount: tier.minAmount, maxAmount: val, step: tier.step });
                    }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <input
                      type="number"
                      defaultValue={tier.step}
                      onBlur={(e) => {
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) saveCapitalTierMutation.mutate({ id: tier.id, minAmount: tier.minAmount, maxAmount: tier.maxAmount, step: val });
                    }}
                      className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </td>
                  <td className="px-4 py-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteCapitalTierMutation.mutate(tier.id)}
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
            Taux Progressifs (Par Tranche)
          </h3>
          <Button size="sm" onClick={() => setProgressiveTierModalOpen(true)}>
            <Plus className="w-4 h-4" />
          </Button>
        </div>
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
                  onClick={() => deleteProgressiveTierMutation.mutate(tier.id)}
                >
                  <Trash2 className="w-3 h-3 text-red-600" />
                </Button>
              </div>
              <input
                type="number"
                step="0.001"
                defaultValue={Number(tier.tierRate)}
                onBlur={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) saveProgressiveTierMutation.mutate({ id: tier.id, tierRate: val });
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {(Number(tier.tierRate) * 100).toFixed(2)}%
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};
