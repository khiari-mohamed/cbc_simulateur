import { useState, useMemo } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '../../ui/Button';
import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import api from '../../../lib/api/client';
import toast from 'react-hot-toast';

interface BulkApplyModalProps {
  sourceCompanyId: string;
  sourceCompanyName: string;
  availableRules: Array<{
    id: string;
    guaranteeName: string;
    guaranteeCode: string;
    formulaType?: string;
    franchiseRate?: number;
    ratePercentage?: number;
    fixedPremium?: number;
    usageId?: string;
  }>;
  availableCompanies: Array<{
    id: string;
    name: string;
  }>;
  onClose: () => void;
}

export const BulkApplyModal = ({
  sourceCompanyId,
  sourceCompanyName,
  availableRules,
  availableCompanies,
  onClose,
}: BulkApplyModalProps) => {
  const queryClient = useQueryClient();
  const [selectedRuleIds, setSelectedRuleIds] = useState<string[]>([]);
  const [selectedCompanyIds, setSelectedCompanyIds] = useState<string[]>([]);
  const [expandedGuarantees, setExpandedGuarantees] = useState<Set<string>>(new Set());

  const { data: usages } = useQuery({
    queryKey: ['usages'],
    queryFn: async () => {
      const { data } = await api.get('/usages');
      return data;
    },
  });

  const bulkCopyMutation = useMutation({
    mutationFn: async (data: { ruleIds: string[]; targetCompanyIds: string[] }) => {
      return api.post('/pricing-rules/bulk-copy', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules-all'] });
      toast.success('Règles copiées avec succès');
      onClose();
    },
    onError: () => toast.error('Erreur lors de la copie'),
  });

  const groupedRules = useMemo(() => {
    const groups = new Map<string, typeof availableRules>();
    availableRules.forEach(rule => {
      const key = rule.guaranteeName;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(rule);
    });
    return Array.from(groups.entries()).map(([name, rules]) => ({
      guaranteeName: name,
      guaranteeCode: rules[0].guaranteeCode,
      rules,
    }));
  }, [availableRules]);

  const handleApply = () => {
    if (selectedRuleIds.length === 0) {
      toast.error('Sélectionnez au moins une règle');
      return;
    }
    if (selectedCompanyIds.length === 0) {
      toast.error('Sélectionnez au moins une compagnie cible');
      return;
    }

    bulkCopyMutation.mutate({
      ruleIds: selectedRuleIds,
      targetCompanyIds: selectedCompanyIds,
    });
  };

  const toggleRule = (ruleId: string) => {
    setSelectedRuleIds(prev =>
      prev.includes(ruleId) ? prev.filter(id => id !== ruleId) : [...prev, ruleId]
    );
  };

  const toggleCompany = (companyId: string) => {
    setSelectedCompanyIds(prev =>
      prev.includes(companyId) ? prev.filter(id => id !== companyId) : [...prev, companyId]
    );
  };

  const toggleGuarantee = (guaranteeName: string) => {
    setExpandedGuarantees(prev => {
      const next = new Set(prev);
      if (next.has(guaranteeName)) {
        next.delete(guaranteeName);
      } else {
        next.add(guaranteeName);
      }
      return next;
    });
  };

  const toggleGuaranteeSelection = (guaranteeName: string) => {
    const group = groupedRules.find(g => g.guaranteeName === guaranteeName);
    if (!group) return;
    
    const groupRuleIds = group.rules.map(r => r.id);
    const allSelected = groupRuleIds.every(id => selectedRuleIds.includes(id));
    
    if (allSelected) {
      setSelectedRuleIds(prev => prev.filter(id => !groupRuleIds.includes(id)));
    } else {
      setSelectedRuleIds(prev => [...new Set([...prev, ...groupRuleIds])]);
    }
  };

  const isGuaranteeSelected = (guaranteeName: string) => {
    const group = groupedRules.find(g => g.guaranteeName === guaranteeName);
    if (!group) return false;
    return group.rules.every(r => selectedRuleIds.includes(r.id));
  };

  const isGuaranteePartiallySelected = (guaranteeName: string) => {
    const group = groupedRules.find(g => g.guaranteeName === guaranteeName);
    if (!group) return false;
    const selectedCount = group.rules.filter(r => selectedRuleIds.includes(r.id)).length;
    return selectedCount > 0 && selectedCount < group.rules.length;
  };

  const selectAllRules = () => {
    setSelectedRuleIds(availableRules.map(r => r.id));
    setExpandedGuarantees(new Set(groupedRules.map(g => g.guaranteeName)));
  };

  const deselectAllRules = () => {
    setSelectedRuleIds([]);
  };

  const selectAllCompanies = () => {
    setSelectedCompanyIds(availableCompanies.filter(c => c.id !== sourceCompanyId).map(c => c.id));
  };

  const deselectAllCompanies = () => {
    setSelectedCompanyIds([]);
  };

  const targetCompanies = availableCompanies.filter(c => c.id !== sourceCompanyId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Appliquer les règles à d'autres compagnies
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Source: {sourceCompanyName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Rules Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Sélectionner les règles à copier ({selectedRuleIds.length}/{availableRules.length})
              </label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={selectAllRules}>
                  Tout sélectionner
                </Button>
                <Button size="sm" variant="outline" onClick={deselectAllRules}>
                  Tout désélectionner
                </Button>
              </div>
            </div>
            
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-64 overflow-y-auto">
              {groupedRules.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Aucune règle disponible
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {groupedRules.map((group) => {
                    const isExpanded = expandedGuarantees.has(group.guaranteeName);
                    const isSelected = isGuaranteeSelected(group.guaranteeName);
                    const isPartial = isGuaranteePartiallySelected(group.guaranteeName);
                    
                    return (
                      <div key={group.guaranteeName}>
                        {/* Guarantee Header */}
                        <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800/50">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            ref={el => {
                              if (el) el.indeterminate = isPartial;
                            }}
                            onChange={() => toggleGuaranteeSelection(group.guaranteeName)}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <button
                            onClick={() => toggleGuarantee(group.guaranteeName)}
                            className="flex-1 flex items-center gap-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded px-2 py-1"
                          >
                            {isExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-500" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-500" />
                            )}
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {group.guaranteeName}
                            </span>
                            <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                              {group.rules.length} règle{group.rules.length > 1 ? 's' : ''}
                            </span>
                          </button>
                        </div>

                        {/* Nested Rules */}
                        {isExpanded && (
                          <div className="bg-white dark:bg-gray-800">
                            {group.rules.map((rule) => {
                              const usageName = usages?.find((u: any) => u.id === rule.usageId)?.nameFr;
                              return (
                                <label
                                  key={rule.id}
                                  className="flex items-center gap-3 p-3 pl-12 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer border-l-2 border-gray-200 dark:border-gray-700 ml-8"
                                >
                                  <input
                                    type="checkbox"
                                    checked={selectedRuleIds.includes(rule.id)}
                                    onChange={() => toggleRule(rule.id)}
                                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      {rule.formulaType && (
                                        <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                                          {rule.formulaType}
                                        </span>
                                      )}
                                      {rule.franchiseRate !== null && rule.franchiseRate !== undefined && (
                                        <span className="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded">
                                          Franchise: {rule.franchiseRate}%
                                        </span>
                                      )}
                                      {usageName && (
                                        <span className="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded">
                                          {usageName}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex gap-3">
                                      {rule.ratePercentage && (
                                        <span>Taux: {Number(rule.ratePercentage).toFixed(4)}</span>
                                      )}
                                      {rule.fixedPremium && (
                                        <span>Prime fixe: {Number(rule.fixedPremium)} DT</span>
                                      )}
                                    </div>
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Companies Selection */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Sélectionner les compagnies cibles ({selectedCompanyIds.length}/{targetCompanies.length})
              </label>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={selectAllCompanies}>
                  Tout sélectionner
                </Button>
                <Button size="sm" variant="outline" onClick={deselectAllCompanies}>
                  Tout désélectionner
                </Button>
              </div>
            </div>
            
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg">
              {targetCompanies.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                  Aucune autre compagnie disponible
                </div>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {targetCompanies.map((company) => (
                    <label
                      key={company.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedCompanyIds.includes(company.id)}
                        onChange={() => toggleCompany(company.id)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {company.name}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Summary */}
          {selectedRuleIds.length > 0 && selectedCompanyIds.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-200">
                <span className="font-semibold">
                  {selectedRuleIds.length} règle(s)
                </span>
                {' '}seront copiées vers{' '}
                <span className="font-semibold">
                  {selectedCompanyIds.length} compagnie(s)
                </span>
                {' '}= {' '}
                <span className="font-semibold text-lg">
                  {selectedRuleIds.length * selectedCompanyIds.length} nouvelles règles
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            onClick={handleApply}
            disabled={bulkCopyMutation.isPending || selectedRuleIds.length === 0 || selectedCompanyIds.length === 0}
          >
            {bulkCopyMutation.isPending ? 'Application en cours...' : 'Appliquer les règles'}
          </Button>
        </div>
      </div>
    </div>
  );
};
