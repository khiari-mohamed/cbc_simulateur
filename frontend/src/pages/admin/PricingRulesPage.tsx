import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Filter, Shield } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';
import { PricingRuleModal } from '../../components/admin/PricingRuleModal';

export const PricingRulesPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  const [filters, setFilters] = useState({ companyId: '', guaranteeId: '', bonusMalusClass: '', usageType: '' });
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const { data: rules, isLoading } = useQuery({
    queryKey: ['pricing-rules', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.companyId) params.append('companyId', filters.companyId);
      if (filters.guaranteeId) params.append('guaranteeId', filters.guaranteeId);
      if (filters.bonusMalusClass) params.append('bonusMalusClass', filters.bonusMalusClass);
      if (filters.usageType) params.append('usageType', filters.usageType);
      const { data } = await api.get(`/pricing-rules?${params}`);
      return data;
    },
  });

  // Fetch all rules without filters to get counts per class
  const { data: allRules } = useQuery({
    queryKey: ['pricing-rules-all'],
    queryFn: async () => {
      const { data } = await api.get('/pricing-rules');
      return data;
    },
  });

  // Calculate counts per bonus-malus class
  const classCounts = allRules?.reduce((acc: any, rule: any) => {
    if (rule.bonusMalusClass) {
      acc[rule.bonusMalusClass] = (acc[rule.bonusMalusClass] || 0) + 1;
    }
    return acc;
  }, {}) || {};

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data } = await api.get('/companies');
      return data;
    },
  });

  const { data: guarantees } = useQuery({
    queryKey: ['guarantees'],
    queryFn: async () => {
      const { data } = await api.get('/guarantees');
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

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/pricing-rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      toast.success('Règle supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const handleEdit = (rule: any) => {
    setSelectedRule(rule);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Confirmer la suppression ?')) {
      deleteMutation.mutate(id);
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Règles de tarification
            </h1>
            <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-semibold rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" />
              MODULE PROTÉGÉ
            </span>
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Gérer les règles de calcul des primes - Modifiable uniquement par l'administrateur
          </p>
        </div>
        <Button
          onClick={() => {
            setSelectedRule(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Nouvelle règle</span>
          <span className="sm:hidden">Nouveau</span>
        </Button>
      </div>

      <Card className="mb-6 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <Filter className="w-5 h-5 text-gray-500 hidden sm:block" />
          <select
            value={filters.companyId}
            onChange={(e) => setFilters({ ...filters, companyId: e.target.value })}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="">Toutes les compagnies</option>
            {companies?.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <select
            value={filters.guaranteeId}
            onChange={(e) => setFilters({ ...filters, guaranteeId: e.target.value })}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="">Toutes les garanties</option>
            {guarantees?.map((g: any) => (
              <option key={g.id} value={g.id}>{g.nameFr}</option>
            ))}
          </select>
          <select
            value={filters.usageType}
            onChange={(e) => setFilters({ ...filters, usageType: e.target.value })}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="">Tous les usages</option>
            {usageTypes?.map((usage: any) => (
              <option key={usage.id} value={usage.id}>{usage.nameFr}</option>
            ))}
          </select>
          <select
            value={filters.bonusMalusClass}
            onChange={(e) => setFilters({ ...filters, bonusMalusClass: e.target.value })}
            className="w-full sm:w-auto px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
          >
            <option value="">Toutes les classes BM ({allRules?.length || 0})</option>
            <option value="1">Classe 1 ({classCounts[1] || 0})</option>
            <option value="2">Classe 2 ({classCounts[2] || 0})</option>
            <option value="3">Classe 3 ({classCounts[3] || 0})</option>
            <option value="4">Classe 4 ({classCounts[4] || 0})</option>
            <option value="5">Classe 5 ({classCounts[5] || 0})</option>
            <option value="6">Classe 6 ({classCounts[6] || 0})</option>
            <option value="7">Classe 7 ({classCounts[7] || 0})</option>
            <option value="8">Classe 8 ({classCounts[8] || 0})</option>
          </select>
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          <div className="grid gap-4">
            {rules?.slice((page - 1) * itemsPerPage, page * itemsPerPage).map((rule: any) => (
              <Card key={rule.id} className="p-6">
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3 mb-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {rule.company.name} - {rule.guarantee.nameFr}
                        </h3>
                        {rule.convention && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Convention: <span className="font-medium">{rule.convention.name}</span>
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      {rule.formulaType && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Formule:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">{rule.formulaType}</span>
                        </div>
                      )}
                      {rule.baseRate && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Taux de base:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">{Number(rule.baseRate).toFixed(2)}%</span>
                        </div>
                      )}
                      {rule.fixedPremium && (
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Prime fixe:</span>
                          <span className="ml-2 font-medium text-gray-900 dark:text-white">{Number(rule.fixedPremium).toFixed(2)} DT</span>
                        </div>
                      )}
                      {rule.reductionRate !== null && rule.reductionRate !== undefined && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded px-2 py-1">
                          <span className="text-green-700 dark:text-green-400 font-medium">Réduction: {Number(rule.reductionRate).toFixed(2)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(rule)}>
                      <Edit className="w-4 h-4" />
                      Modifier
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(rule.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {rules && rules.length > itemsPerPage && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Précédent
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Page {page} sur {Math.ceil(rules.length / itemsPerPage)}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.min(Math.ceil(rules.length / itemsPerPage), p + 1))}
                disabled={page === Math.ceil(rules.length / itemsPerPage)}
              >
                Suivant
              </Button>
            </div>
          )}
        </>
      )}

      {isModalOpen && (
        <PricingRuleModal
          rule={selectedRule}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRule(null);
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
            setIsModalOpen(false);
            setSelectedRule(null);
          }}
        />
      )}
    </div>
  );
};
