import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Download,  ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../../ui/Button';
import { Card } from '../../ui/Card';
import api from '../../../lib/api/client';
import toast from 'react-hot-toast';
import { GuaranteeRuleModal } from './GuaranteeRuleModal';

interface PricingRule {
  id: string
  guaranteeId: string
  formulaType?: string
  ratePercentage?: number
  fixedPremium?: number
  franchiseRate?: number
  minCapital?: number
  reductionRate?: number
  usageType?: string
  formula?: string
}

interface GuaranteeGroup {
  id: string;
  code: string;
  nameFr: string;
  rules: PricingRule[];
}



export const GuaranteesConfig = () => {
  const queryClient = useQueryClient();
  const [selectedCompany, setSelectedCompany] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
 const [selectedRule, setSelectedRule] = useState<PricingRule | null>(null);

  const [selectedGuarantee, setSelectedGuarantee] = useState<GuaranteeGroup | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  const { data: companies, isLoading: companiesLoading } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data } = await api.get('/companies');
      return data;
    },
  });

 const { data: guarantees, isLoading: guaranteesLoading } = useQuery<GuaranteeGroup[]>({
  queryKey: ['guarantees'],
  queryFn: async () => {
    const { data } = await api.get('/guarantees');
    // Exclude RC as it has its own table
    return data.filter((g: GuaranteeGroup) => g.code !== 'RC');
  },
});


  const { data: allRules, isLoading: rulesLoading } = useQuery({
    queryKey: ['pricing-rules-all', selectedCompany],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedCompany) params.append('companyId', selectedCompany);
      const { data } = await api.get(`/pricing-rules?${params}`);
      return data;
    },
    enabled: !!selectedCompany,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/pricing-rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules-all', selectedCompany] });
      toast.success('Règle supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const toggleGroup = (guaranteeId: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(guaranteeId)) {
      newExpanded.delete(guaranteeId);
    } else {
      newExpanded.add(guaranteeId);
    }
    setExpandedGroups(newExpanded);
  };

  const handleAdd = (guarantee: GuaranteeGroup) => {
    setSelectedGuarantee(guarantee);
    setSelectedRule(null);
    setIsModalOpen(true);
  };

  const handleEdit = (rule: PricingRule) => {
    setSelectedRule(rule);
    setSelectedGuarantee(guarantees?.find((g) => g.id === rule.guaranteeId) || null);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Confirmer la suppression ?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleExportAll = () => {
    if (!allRules || allRules.length === 0) {
      toast.error('Aucune donnée à exporter');
      return;
    }

    // Create CSV
    const headers = [
      'Garantie',
      'Formule',
      'Franchise (%)',
      'Taux (%)',
      'Prime Fixe (DT)',
      'Capital Min',
      'Réduction (%)',
      'Usage',
      'Formule Personnalisée'
    ];
    
    let csv = headers.join(',') + '\n';
    
    allRules.forEach((rule: PricingRule & { guarantee: { nameFr: string } }) => {
      const row = [
        rule.guarantee.nameFr,
        rule.formulaType || '',
        rule.franchiseRate || '',
        rule.ratePercentage || '',
        rule.fixedPremium || '',
        rule.minCapital || '',
        rule.reductionRate || '',
        rule.usageType || '',
        rule.formula ? `"${rule.formula.replace(/"/g, '""')}"` : ''
      ];
      csv += row.join(',') + '\n';
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Garanties_${companies?.find((c: { id: string; name: string }) => c.id === selectedCompany)?.name}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    toast.success('Export réussi');
  };

  // Group rules by guarantee
 const groupedRules = useMemo<GuaranteeGroup[]>(() => {
  if (!guarantees || !Array.isArray(guarantees)) return [];
  return guarantees.map((guarantee) => ({
    ...guarantee,
    rules: allRules?.filter((r: PricingRule) => r.guaranteeId === guarantee.id) || [],
  }));
}, [guarantees, allRules]);

  const getGuaranteeHint = (code: string) => {
    const hints: Record<string, string> = {
      'VOL': 'Formule: ((VV × taux) + prime fixe) × réduction',
      'INCENDIE': 'Formule: ((VV × taux) + prime fixe) × réduction',
      'TOUS_RISQUES_ZERO': 'Formule: ((VN × taux) + prime fixe) × réduction | Franchises: 0%, 1%, 2%, 4%',
      'CAS': 'Prime fixe par compagnie',
      'ASSISTANCE': 'Prime fixe par compagnie',
      'PERSONNES_TRANSPORTEES': 'Capital et prime par palier',
      'BG': 'Formule: capital × taux',
      'DOMMAGES_COLLISIONS': 'Voir onglet Dommages Collision pour configuration complète',
    };
    return hints[code];
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Compagnie:
            </label>
            <select
              value={selectedCompany}
              onChange={(e) => setSelectedCompany(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="">Sélectionner une compagnie</option>
              {companies?.map((c: { id: string; name: string }) => (
  <option key={c.id} value={c.id}>{c.name}</option>
))}

            </select>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAll}
            disabled={!selectedCompany || !allRules || allRules.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Exporter tout
          </Button>
        </div>
      </Card>

      {companiesLoading || guaranteesLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : selectedCompany ? (
        <>
          {rulesLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="space-y-3">
              {groupedRules.map((group) => {
                const hint = getGuaranteeHint(group.code);
                const isExpanded = expandedGroups.has(group.id);

                return (
                  <Card key={group.id} className="overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50"
                      onClick={() => toggleGroup(group.id)}
                    >
                      <div className="flex items-center gap-3 flex-1">
                        {isExpanded ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {group.nameFr}
                          </h3>
                          {hint && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {hint}
                            </p>
                          )}
                        </div>
                        <span className="ml-auto px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded">
                          {group.rules.length} règle{group.rules.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAdd(group);
                        }}
                        className="ml-4"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        Ajouter
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="border-t border-gray-200 dark:border-gray-700">
                        {group.rules.length === 0 ? (
                          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                            Aucune règle configurée
                          </div>
                        ) : (
                          <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {group.rules.map((rule: PricingRule) => (

                              <div key={rule.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/30">
                                <div className="flex justify-between items-start gap-4">
                                  <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                    {rule.formulaType && (
                                      <div>
                                        <span className="text-gray-500 dark:text-gray-400">Formule:</span>
                                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                          {rule.formulaType}
                                        </span>
                                      </div>
                                    )}
                                    {rule.franchiseRate !== null && rule.franchiseRate !== undefined && (
                                      <div>
                                        <span className="text-gray-500 dark:text-gray-400">Franchise:</span>
                                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                          {rule.franchiseRate}%
                                        </span>
                                      </div>
                                    )}
                                    {rule.ratePercentage && (
                                      <div>
                                        <span className="text-gray-500 dark:text-gray-400">Taux:</span>
                                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                          {Number(rule.ratePercentage).toFixed(4)}
                                        </span>
                                      </div>
                                    )}
                                    {rule.fixedPremium && (
                                      <div>
                                        <span className="text-gray-500 dark:text-gray-400">Prime fixe:</span>
                                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                          {Number(rule.fixedPremium).toFixed(2)} DT
                                        </span>
                                      </div>
                                    )}
                                    {rule.minCapital && (
                                      <div>
                                        <span className="text-gray-500 dark:text-gray-400">Capital:</span>
                                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                          {Number(rule.minCapital).toFixed(0)} DT
                                        </span>
                                      </div>
                                    )}
                                    {rule.reductionRate !== null && rule.reductionRate !== undefined && (
                                      <div>
                                        <span className="text-gray-500 dark:text-gray-400">Réduction:</span>
                                        <span className="ml-2 font-medium text-green-600 dark:text-green-400">
                                          {Number(rule.reductionRate).toFixed(2)}%
                                        </span>
                                      </div>
                                    )}
                                    {rule.usageType && (
                                      <div>
                                        <span className="text-gray-500 dark:text-gray-400">Usage:</span>
                                        <span className="ml-2 font-medium text-gray-900 dark:text-white">
                                          {rule.usageType}
                                        </span>
                                      </div>
                                    )}
                                    {rule.formula && (
                                      <div className="col-span-2 md:col-span-4">
                                        <span className="text-gray-500 dark:text-gray-400">Formule:</span>
                                        <code className="ml-2 text-xs bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded">
                                          {rule.formula}
                                        </code>
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex gap-2">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleEdit(rule)}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => handleDelete(rule.id)}
                                    >
                                      <Trash2 className="w-4 h-4 text-red-600" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      ) : null}

      {isModalOpen && (
        <GuaranteeRuleModal
          rule={selectedRule}
          guarantee={selectedGuarantee}
          companyId={selectedCompany}
          onClose={() => {
            setIsModalOpen(false);
            setSelectedRule(null);
            setSelectedGuarantee(null);
          }}
          onSuccess={() => {
  queryClient.invalidateQueries({ queryKey: ['pricing-rules-all', selectedCompany] });
  setIsModalOpen(false);
  setSelectedRule(null);
  setSelectedGuarantee(null);
}}
  
        />
      )}
    </div>
  );
};
