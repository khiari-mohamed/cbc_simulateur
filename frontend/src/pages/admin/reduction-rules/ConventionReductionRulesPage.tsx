import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, ArrowLeft, Trash2, Edit, Sliders } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import api from '../../../lib/api/client';
import toast from 'react-hot-toast';

export const ConventionReductionRulesPage = () => {
  const { conventionId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<any | null>(null);
  const [formData, setFormData] = useState({
    companyId: '',
    guaranteeId: '',
    metric: 'MARKET_VALUE',
    minValue: '',
    maxValue: '',
    minInclusive: true,
    maxInclusive: false,
    discountPercent: '',
    priority: '0',
  });

  const { data: convention } = useQuery({
    queryKey: ['conventions', conventionId],
    queryFn: async () => {
      const { data } = await api.get(`/conventions/${conventionId}`);
      return data;
    },
  });

  const { data: rules } = useQuery({
    queryKey: ['convention-reduction-rules', conventionId],
    queryFn: async () => {
      const { data } = await api.get(`/convention-reduction-rules/convention/${conventionId}`);
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

  const createMutation = useMutation({
    mutationFn: (data: any) => 
      editingRule 
        ? api.put(`/convention-reduction-rules/${editingRule.id}`, data)
        : api.post('/convention-reduction-rules', { ...data, conventionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convention-reduction-rules'] });
      toast.success(editingRule ? 'Règle modifiée' : 'Règle créée');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/convention-reduction-rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convention-reduction-rules'] });
      toast.success('Règle supprimée');
    },
    onError: () => toast.error('Erreur'),
  });

  const openModal = (rule?: any) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        companyId: rule.companyId || '',
        guaranteeId: rule.guaranteeId,
        metric: rule.metric,
        minValue: rule.minValue || '',
        maxValue: rule.maxValue || '',
        minInclusive: rule.minInclusive,
        maxInclusive: rule.maxInclusive,
        discountPercent: rule.discountPercent,
        priority: rule.priority.toString(),
      });
    } else {
      setEditingRule(null);
      setFormData({
        companyId: '',
        guaranteeId: '',
        metric: 'MARKET_VALUE',
        minValue: '',
        maxValue: '',
        minInclusive: true,
        maxInclusive: false,
        discountPercent: '',
        priority: '0',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingRule(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...formData,
      companyId: formData.companyId || null,
      minValue: formData.minValue ? parseFloat(formData.minValue) : null,
      maxValue: formData.maxValue ? parseFloat(formData.maxValue) : null,
      discountPercent: parseFloat(formData.discountPercent),
      priority: parseInt(formData.priority),
    };
    createMutation.mutate(payload);
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mb-6">
        <Button variant="outline" onClick={() => navigate('/admin/conventions')} className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Retour aux conventions
        </Button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Règles de Réduction</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Convention: {convention?.name}
            </p>
          </div>
          <Button onClick={() => openModal()} className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nouvelle Règle
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        {rules?.map((rule: any) => (
          <div key={rule.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <Sliders className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {rule.guarantee.nameFr}
                  </h3>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium rounded">
                    {rule.discountPercent}% de réduction
                  </span>
                  {rule.company && (
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium rounded">
                      {rule.company.name}
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Métrique:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {rule.metric === 'MARKET_VALUE' ? 'Valeur Vénale' : 
                       rule.metric === 'NEW_VALUE' ? 'Valeur à Neuf' : 
                       rule.metric === 'DC_CAPITAL' ? 'Capital DC' : 'Capital/VV %'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Min:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {rule.minValue ? `${rule.minInclusive ? '≥' : '>'} ${rule.minValue}` : 'Aucun'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Max:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {rule.maxValue ? `${rule.maxInclusive ? '≤' : '<'} ${rule.maxValue}` : 'Aucun'}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Priorité:</span>
                    <span className="ml-2 font-medium text-gray-900 dark:text-white">
                      {rule.priority}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => openModal(rule)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    if (confirm('Supprimer cette règle ?')) {
                      deleteMutation.mutate(rule.id);
                    }
                  }}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {rules?.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <Sliders className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucune règle de réduction
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Créez des paliers de réduction pour cette convention
          </p>
          <Button onClick={() => openModal()}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une règle
          </Button>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingRule ? 'Modifier la règle' : 'Nouvelle règle de réduction'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Compagnie (optionnel - laissez vide pour toutes)
                </label>
                <select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Toutes les compagnies</option>
                  {convention?.companies?.map((cc: any) => (
                    <option key={cc.companyId} value={cc.companyId}>{cc.company.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Garantie *
                </label>
                <select
                  value={formData.guaranteeId}
                  onChange={(e) => setFormData({ ...formData, guaranteeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Sélectionner une garantie</option>
                  {guarantees?.filter((g: any) => ['TOUS_RISQUES_ZERO', 'DOMMAGES_COLLISIONS', 'VOL', 'INCENDIE'].includes(g.code)).map((g: any) => (
                    <option key={g.id} value={g.id}>{g.nameFr}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Métrique *
                </label>
                <select
                  value={formData.metric}
                  onChange={(e) => setFormData({ ...formData, metric: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                >
                  <option value="MARKET_VALUE">Valeur Vénale</option>
                  <option value="NEW_VALUE">Valeur à Neuf</option>
                  <option value="DC_CAPITAL">Capital DC</option>
                  <option value="CAPITAL_OVER_VV_PERCENT">Capital/VV %</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Valeur Min (optionnel)"
                  type="number"
                  step="0.01"
                  value={formData.minValue}
                  onChange={(e) => setFormData({ ...formData, minValue: e.target.value })}
                  placeholder="Ex: 90000"
                />
                <Input
                  label="Valeur Max (optionnel)"
                  type="number"
                  step="0.01"
                  value={formData.maxValue}
                  onChange={(e) => setFormData({ ...formData, maxValue: e.target.value })}
                  placeholder="Ex: 500000"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.minInclusive}
                    onChange={(e) => setFormData({ ...formData, minInclusive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Min inclusif (≥)</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.maxInclusive}
                    onChange={(e) => setFormData({ ...formData, maxInclusive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">Max inclusif (≤)</span>
                </label>
              </div>

              <Input
                label="Pourcentage de réduction * (ex: 35 pour 35%)"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={formData.discountPercent}
                onChange={(e) => setFormData({ ...formData, discountPercent: e.target.value })}
                placeholder="Ex: 35"
                required
              />

              <Input
                label="Priorité (plus élevé = prioritaire)"
                type="number"
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                placeholder="0"
              />

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" loading={createMutation.isPending} className="flex-1">
                  {editingRule ? 'Modifier' : 'Créer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
