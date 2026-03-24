import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { Table, TrendingUp } from 'lucide-react';
import api from '../../../lib/api/client';
import toast from 'react-hot-toast';
import { DcProgressiveConfig } from '../../../components/admin/formulas/DcProgressiveConfig';
import { DcMatrixConfig } from '../../../components/admin/formulas/DcMatrixConfig';

export const DcConfigTab = () => {
  const queryClient = useQueryClient();
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedUsage, setSelectedUsage] = useState('');
  const [method, setMethod] = useState<'progressive' | 'matrix'>('progressive');

  const { data: companies, isLoading: companiesLoading, error: companiesError } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data } = await api.get('/companies');
      return data;
    },
  });

  const { data: usageTypes, isLoading: usageTypesLoading } = useQuery({
    queryKey: ['usage-types'],
    queryFn: async () => {
      const { data } = await api.get('/usage-types');
      return data;
    },
  });

  const { data: dcConfig, isLoading } = useQuery({
    queryKey: ['dc-config', selectedCompany, selectedUsage],
    queryFn: async () => {
      if (!selectedCompany || !selectedUsage) return null;
      const { data } = await api.get(`/dc-config?companyId=${selectedCompany}&usageId=${selectedUsage}`);
      return data[0] || null;
    },
    enabled: !!selectedCompany && !!selectedUsage,
  });

  useEffect(() => {
    if (dcConfig) {
      setMethod(dcConfig.useMatrix ? 'matrix' : 'progressive');
    }
  }, [dcConfig]);

  const updateMethodMutation = useMutation({
    mutationFn: async (useMatrix: boolean) => {
      if (!selectedCompany) {
        throw new Error('Veuillez sélectionner une compagnie');
      }
      if (!selectedUsage) {
        throw new Error('Veuillez sélectionner un type d\'usage');
      }
      if (!dcConfig) {
        const { data } = await api.post('/dc-config', {
          companyId: selectedCompany,
          usageId: selectedUsage,
          useMatrix,
        });
        return data;
      } else {
        const { data } = await api.patch(`/dc-config/${dcConfig.id}`, { useMatrix });
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dc-config'] });
      toast.success('Méthode mise à jour');
    },
    onError: (error: any) => {
      toast.error(error?.message || 'Erreur lors de la mise à jour');
    },
  });

  const handleMethodChange = (newMethod: 'progressive' | 'matrix') => {
    setMethod(newMethod);
    updateMethodMutation.mutate(newMethod === 'matrix');
  };

  if (companiesError) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-800 dark:text-red-200">Erreur lors du chargement des compagnies. Vérifiez votre connexion API.</p>
      </div>
    );
  }

  if (companiesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Sélection
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Compagnie
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Sélectionner une compagnie</option>
              {companies?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Type d'usage
            </label>
            <select
              value={selectedUsage}
              onChange={(e) => setSelectedUsage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              disabled={usageTypesLoading}
            >
              <option value="">Sélectionner un usage</option>
              {usageTypes?.map((usage: any) => (
                <option key={usage.id} value={usage.id}>{usage.nameFr}</option>
              ))}
            </select>
          </div>
        </div>
      </Card>

      {selectedCompany && selectedUsage && (
        <>
          <Card className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Méthode de Calcul
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => handleMethodChange('progressive')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  method === 'progressive'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <TrendingUp className={`w-6 h-6 ${method === 'progressive' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">Progressive (Par Palier)</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Calcul par tranches dégressives</div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => handleMethodChange('matrix')}
                className={`p-4 border-2 rounded-lg transition-all ${
                  method === 'matrix'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Table className={`w-6 h-6 ${method === 'matrix' ? 'text-blue-600' : 'text-gray-400'}`} />
                  <div className="text-left">
                    <div className="font-semibold text-gray-900 dark:text-white">Matrice (Par Taux)</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Table de correspondance VV × Capital</div>
                  </div>
                </div>
              </button>
            </div>
          </Card>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : method === 'progressive' ? (
            <DcProgressiveConfig
              companyId={selectedCompany}
              usageType={selectedUsage}
              config={dcConfig}
            />
          ) : (
            <DcMatrixConfig
              companyId={selectedCompany}
              usageType={selectedUsage}
              config={dcConfig}
            />
          )}
        </>
      )}
    </div>
  );
};
