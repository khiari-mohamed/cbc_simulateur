import { useState, } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Calendar, Shield, Filter, X, Copy } from 'lucide-react';
import api from '../../lib/api/client';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import toast from 'react-hot-toast';

interface FormulaEligibilityRule {
  id: string;
  companyId: string;
  usageId: string;
  formulaType: 'STANDARD' | 'TOUS_RISQUES_0' | 'DOMMAGES_COLLISIONS';
  minAgeYears?: number;
  maxAgeYears?: number;
  description?: string;
  isActive: boolean;
  company: {
    id: string;
    name: string;
    code: string;
  };
  usage: {
    id: string;
    code: string;
    nameFr: string;
  };
}

interface Company {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

interface Usage {
  id: string;
  code: string;
  nameFr: string;
  isActive: boolean;
}

const FORMULA_TYPE_LABELS = {
  STANDARD: 'Standard',
  TOUS_RISQUES_0: 'Tous Risques 0%',
  DOMMAGES_COLLISIONS: 'Dommages Collision',
};

export const FormulaEligibilityPage = () => {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<FormulaEligibilityRule | null>(null);
  const [filterCompany, setFilterCompany] = useState('');
  const [filterUsage, setFilterUsage] = useState('');
  const [filterFormula, setFilterFormula] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    companyId: '',
    usageId: '',
    formulaType: '' as '' | 'STANDARD' | 'TOUS_RISQUES_0' | 'DOMMAGES_COLLISIONS',
    minAgeYears: undefined as number | undefined,
    maxAgeYears: undefined as number | undefined,
    description: '',
    isActive: true,
  });

  // Fetch rules
  const { data: rules, isLoading } = useQuery({
    queryKey: ['formula-eligibility-rules', filterCompany, filterUsage, filterFormula],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterCompany) params.append('companyId', filterCompany);
      if (filterUsage) params.append('usageId', filterUsage);
      if (filterFormula) params.append('formulaType', filterFormula);
      
      const { data } = await api.get(`/formula-eligibility/rules?${params.toString()}`);
      return data as FormulaEligibilityRule[];
    },
  });

  // Fetch companies
  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data } = await api.get('/companies');
      return data.filter((c: Company) => c.isActive);
    },
  });

  // Fetch usages
  const { data: usages } = useQuery({
    queryKey: ['usage-types'],
    queryFn: async () => {
      const { data } = await api.get('/usage-types');
      return data.filter((u: Usage) => u.isActive);
    },
  });

  // Create mutation
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { data: result } = await api.post('/formula-eligibility/rules', data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formula-eligibility-rules'] });
      toast.success('Règle créée avec succès');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<typeof formData> }) => {
      const { data: result } = await api.patch(`/formula-eligibility/rules/${id}`, data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formula-eligibility-rules'] });
      toast.success('Règle modifiée avec succès');
      closeModal();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/formula-eligibility/rules/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formula-eligibility-rules'] });
      toast.success('Règle supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    },
  });

  const openModal = (rule?: FormulaEligibilityRule, isDuplicate = false) => {
    if (rule) {
      setEditingRule(isDuplicate ? null : rule);
      setFormData({
        companyId: rule.companyId,
        usageId: rule.usageId,
        formulaType: isDuplicate ? '' : rule.formulaType,
        minAgeYears: rule.minAgeYears,
        maxAgeYears: rule.maxAgeYears,
        description: rule.description || '',
        isActive: rule.isActive,
      });
    } else {
      setEditingRule(null);
      setFormData({
        companyId: '',
        usageId: '',
        formulaType: '',
        minAgeYears: undefined,
        maxAgeYears: undefined,
        description: '',
        isActive: true,
      });
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingRule(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyId || !formData.usageId || !formData.formulaType) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!formData.minAgeYears && !formData.maxAgeYears) {
      toast.error('Veuillez spécifier au moins un âge minimum ou maximum');
      return;
    }

    if (editingRule) {
      updateMutation.mutate({ id: editingRule.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette règle ?')) {
      deleteMutation.mutate(id);
    }
  };

  const clearFilters = () => {
    setFilterCompany('');
    setFilterUsage('');
    setFilterFormula('');
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Règles d'Éligibilité par Âge
            </h1>
            <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-semibold rounded-full flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              ÂGE VÉHICULE
            </span>
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Configurez les restrictions d'âge pour chaque formule par compagnie et usage
          </p>
        </div>
        <Button onClick={() => openModal()} className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Ajouter une Règle
        </Button>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-1">
              Comment ça fonctionne ?
            </h3>
            <p className="text-xs text-blue-800 dark:text-blue-300">
              Définissez l'âge maximum du véhicule pour chaque formule. Par exemple : "Tous Risques 0%" uniquement pour véhicules &lt; 2 ans.
              Si aucune règle n'existe, la formule est disponible sans restriction d'âge.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 mb-6">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Filtres</h3>
          {(filterCompany || filterUsage || filterFormula) && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <X className="w-3 h-3" />
              Effacer
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Compagnie"
            value={filterCompany}
            onChange={(e) => setFilterCompany(e.target.value)}
            options={[
              { value: '', label: 'Toutes les compagnies' },
              ...(companies?.map((c: Company) => ({ value: c.id, label: c.name })) || []),
            ]}
          />
          <Select
            label="Usage"
            value={filterUsage}
            onChange={(e) => setFilterUsage(e.target.value)}
            options={[
              { value: '', label: 'Tous les usages' },
              ...(usages?.map((u: Usage) => ({ value: u.id, label: u.nameFr })) || []),
            ]}
          />
          <Select
            label="Formule"
            value={filterFormula}
            onChange={(e) => setFilterFormula(e.target.value)}
            options={[
              { value: '', label: 'Toutes les formules' },
              { value: 'STANDARD', label: 'Standard' },
              { value: 'TOUS_RISQUES_0', label: 'Tous Risques 0%' },
              { value: 'DOMMAGES_COLLISIONS', label: 'Dommages Collision' },
            ]}
          />
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            Chargement...
          </div>
        ) : !rules || rules.length === 0 ? (
          <div className="p-8 text-center">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">Aucune règle configurée</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              Cliquez sur "Ajouter une Règle" pour commencer
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Compagnie
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Usage
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Formule
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Restriction d'Âge
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {rules.map((rule) => (
                  <tr
                    key={rule.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-white">
                      {rule.company.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">
                      {rule.usage.nameFr}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {FORMULA_TYPE_LABELS[rule.formulaType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                      {rule.minAgeYears !== null && rule.minAgeYears !== undefined && rule.maxAgeYears !== null && rule.maxAgeYears !== undefined ? (
                        <span>{rule.minAgeYears} - {rule.maxAgeYears} ans</span>
                      ) : rule.minAgeYears !== null && rule.minAgeYears !== undefined ? (
                        <span>≥ {rule.minAgeYears} ans</span>
                      ) : rule.maxAgeYears !== null && rule.maxAgeYears !== undefined ? (
                        <span>&lt; {rule.maxAgeYears} ans</span>
                      ) : (
                        <span className="text-gray-400">Aucune</span>
                      )}
                      {rule.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{rule.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          rule.isActive
                            ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                        }`}
                      >
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(rule, true)}
                          className="p-1.5 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                          title="Dupliquer"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openModal(rule)}
                          className="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {editingRule ? 'Modifier la Règle' : 'Ajouter une Règle'}
              </h2>
              {!editingRule && formData.companyId && (
                <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                  💡 Astuce : Vous dupliquez une règle existante
                </p>
              )}
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Select
                label="Compagnie"
                value={formData.companyId}
                onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                options={[
                  { value: '', label: 'Sélectionner une compagnie' },
                  ...(companies?.map((c: Company) => ({ value: c.id, label: c.name })) || []),
                ]}
                required
              />

              <Select
                label="Usage"
                value={formData.usageId}
                onChange={(e) => setFormData({ ...formData, usageId: e.target.value })}
                options={[
                  { value: '', label: 'Sélectionner un usage' },
                  ...(usages?.map((u: Usage) => ({ value: u.id, label: u.nameFr })) || []),
                ]}
                required
              />

              <Select
                label="Formule"
                value={formData.formulaType}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    formulaType: e.target.value as typeof formData.formulaType,
                  })
                }
                options={[
                  { value: '', label: 'Sélectionner une formule' },
                  { value: 'STANDARD', label: 'Standard' },
                  { value: 'TOUS_RISQUES_0', label: 'Tous Risques 0%' },
                  { value: 'DOMMAGES_COLLISIONS', label: 'Dommages Collision' },
                ]}
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Âge Minimum (années)
                </label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={formData.minAgeYears || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, minAgeYears: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                  placeholder="Ex: 2 (optionnel)"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Le véhicule doit avoir AU MOINS cet âge (optionnel)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Âge Maximum (années)
                </label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={formData.maxAgeYears || ''}
                  onChange={(e) =>
                    setFormData({ ...formData, maxAgeYears: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                  placeholder="Ex: 10 (optionnel)"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Le véhicule doit avoir MOINS de cet âge (optionnel)
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Ex: Réservé aux véhicules récents..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white resize-none"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Description optionnelle de la règle
                </p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700 dark:text-gray-300">
                  Règle active
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeModal}
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1"
                >
                  {createMutation.isPending || updateMutation.isPending
                    ? 'Enregistrement...'
                    : editingRule
                    ? 'Modifier'
                    : 'Créer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormulaEligibilityPage;
