import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { ReductionRuleModal } from '../../components/admin/ReductionRuleModal';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';

export const ConventionReductionRulesPage = () => {
  const { conventionId } = useParams<{ conventionId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);

  const { data: convention } = useQuery({
    queryKey: ['convention', conventionId],
    queryFn: async () => {
      const { data } = await api.get(`/conventions/${conventionId}`);
      return data;
    },
  });

  const { data: rules, isLoading } = useQuery({
    queryKey: ['convention-reduction-rules', conventionId],
    queryFn: async () => {
      const { data } = await api.get(`/convention-reduction-rules/convention/${conventionId}`);
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/convention-reduction-rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convention-reduction-rules', conventionId] });
      toast.success('Règle supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const handleEdit = (rule: any) => {
    setEditingRule(rule);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRule(null);
  };

  const getMetricLabel = (metric: string) => {
    const labels: Record<string, string> = {
      NEW_VALUE: 'Valeur à neuf',
      MARKET_VALUE: 'Valeur vénale',
      DC_CAPITAL: 'Capital DC',
      CAPITAL_OVER_VV_PERCENT: 'Capital/VV %',
    };
    return labels[metric] || metric;
  };

  const getFormulaLabel = (formula: string | null) => {
    if (!formula) return 'Toutes';
    const labels: Record<string, string> = {
      STANDARD: 'Standard',
      TOUS_RISQUES_0: 'Tous Risques 0%',
      DOMMAGES_COLLISIONS: 'Dommages Collision',
    };
    return labels[formula] || formula;
  };

  const getUsageLabel = (usage: string | null) => {
    if (!usage) return 'Tous';
    const labels: Record<string, string> = {
      PRIVATE_BUSINESS: 'Privé/Affaires',
      COMMERCIAL: 'Commercial',
      TAXI: 'Taxi',
      RENTAL: 'Location',
    };
    return labels[usage] || usage;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/admin/conventions')}
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux conventions
        </Button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Paliers de réduction
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {convention?.name} - {convention?.organization?.name}
            </p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nouveau palier
          </Button>
        </div>
      </div>

      {rules?.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun palier de réduction
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Créez des règles de réduction pour cette convention
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter un palier
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {rules?.map((rule: any) => (
            <div
              key={rule.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {rule.guarantee.nameFr}
                    </h3>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-semibold rounded">
                      -{rule.discountPercent}%
                    </span>
                    {rule.company && (
                      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded">
                        {rule.company.name}
                      </span>
                    )}
                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs rounded">
                      Priorité: {rule.priority}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Métrique</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getMetricLabel(rule.metric)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Plage</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {rule.minValue ? `${rule.minInclusive ? '≥' : '>'} ${rule.minValue}` : '∞'} 
                        {' → '}
                        {rule.maxValue ? `${rule.maxInclusive ? '≤' : '<'} ${rule.maxValue}` : '∞'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Formule</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getFormulaLabel(rule.formulaType)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">Usage</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {getUsageLabel(rule.usageType)}
                      </p>
                    </div>
                  </div>

                  {(rule.validFrom || rule.validTo) && (
                    <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                      Valide du {new Date(rule.validFrom).toLocaleDateString('fr-FR')}
                      {rule.validTo && ` au ${new Date(rule.validTo).toLocaleDateString('fr-FR')}`}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(rule)}
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteMutation.mutate(rule.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <ReductionRuleModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        conventionId={conventionId!}
        convention={convention}
        rule={editingRule}
      />
    </div>
  );
};
