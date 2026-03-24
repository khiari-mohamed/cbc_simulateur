import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, Trash2, Info, X, AlertCircle, Edit2, Eye, HelpCircle, ArrowRight, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import api from '../../../lib/api/client';
import toast from 'react-hot-toast';

interface Company {
  id: string;
  name: string;
  code: string;
}

interface Guarantee {
  id: string;
  code: string;
  nameFr: string;
}

interface GuaranteeBundling {
  id: string;
  companyId: string;
  company: Company;
  parentGuaranteeId: string;
  parentGuarantee: Guarantee;
  includedGuaranteeId: string;
  includedGuarantee: Guarantee;
  formulaType: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  id?: string;
  companyId: string;
  parentGuaranteeId: string;
  includedGuaranteeIds: string[];
  formulaType: string;
}

interface EditFormData {
  formulaType: string | null;
  isActive: boolean;
}

export const GuaranteeBundlingsTab = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false);
  const [viewingGroup, setViewingGroup] = useState<BundlingGroup | null>(null);
  const [viewingCompany, setViewingCompany] = useState<Company | null>(null);
  const [editingBundling, setEditingBundling] = useState<GuaranteeBundling | null>(null);
  const [formData, setFormData] = useState<FormData>({
    companyId: '',
    parentGuaranteeId: '',
    includedGuaranteeIds: [],
    formulaType: '',
  });
  const [editFormData, setEditFormData] = useState<EditFormData>({
    formulaType: null,
    isActive: true,
  });

  const { data: companies } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data } = await api.get('/companies');
      return data;
    },
  });

  const { data: guarantees } = useQuery<Guarantee[]>({
    queryKey: ['guarantees'],
    queryFn: async () => {
      const { data } = await api.get('/guarantees');
      return data;
    },
  });

  const { data: bundlings } = useQuery<GuaranteeBundling[]>({
    queryKey: ['guarantee-bundlings'],
    queryFn: async () => {
      const { data } = await api.get('/guarantee-bundlings');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      // Create multiple bundlings (one for each included guarantee)
      const promises = data.includedGuaranteeIds.map((includedId: string) =>
        api.post('/guarantee-bundlings', {
          companyId: data.companyId,
          parentGuaranteeId: data.parentGuaranteeId,
          includedGuaranteeId: includedId,
          formulaType: data.formulaType || null,
        })
      );
      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guarantee-bundlings'] });
      toast.success('Règle(s) de groupement créée(s)');
      closeModal();
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: EditFormData }) => {
      return api.patch(`/guarantee-bundlings/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guarantee-bundlings'] });
      toast.success('Règle modifiée avec succès');
      closeEditModal();
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/guarantee-bundlings/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guarantee-bundlings'] });
      toast.success('Règle supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const openModal = () => {
    setFormData({
      companyId: '',
      parentGuaranteeId: '',
      includedGuaranteeIds: [],
      formulaType: '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
  };

  const openEditModal = (bundling: GuaranteeBundling) => {
    setEditingBundling(bundling);
    setEditFormData({
      formulaType: bundling.formulaType,
      isActive: bundling.isActive,
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingBundling(null);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBundling) return;
    
    updateMutation.mutate({
      id: editingBundling.id,
      data: editFormData,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.companyId || !formData.parentGuaranteeId || formData.includedGuaranteeIds.length === 0) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (formData.includedGuaranteeIds.includes(formData.parentGuaranteeId)) {
      toast.error('Une garantie ne peut pas être groupée avec elle-même');
      return;
    }

    createMutation.mutate(formData);
  };

  const toggleIncludedGuarantee = (guaranteeId: string) => {
    setFormData(prev => ({
      ...prev,
      includedGuaranteeIds: prev.includedGuaranteeIds.includes(guaranteeId)
        ? prev.includedGuaranteeIds.filter(id => id !== guaranteeId)
        : [...prev.includedGuaranteeIds, guaranteeId],
    }));
  };

  // Group bundlings by company
  interface CompanyGroup {
    company: Company;
    bundlings: GuaranteeBundling[];
  }

  interface BundlingsByCompany {
    [key: string]: CompanyGroup;
  }

  const bundlingsByCompany = bundlings?.reduce<BundlingsByCompany>((acc, bundling) => {
    const companyId = bundling.companyId;
    if (!acc[companyId]) {
      acc[companyId] = {
        company: bundling.company,
        bundlings: [],
      };
    }
    acc[companyId].bundlings.push(bundling);
    return acc;
  }, {});

  // Group by parent guarantee within each company (including formulaType)
  interface BundlingGroup {
    parent: Guarantee;
    included: GuaranteeBundling[];
    formulaType: string | null;
  }

  interface GroupedByParent {
    [key: string]: BundlingGroup;
  }

  interface CompanyGroupWithGroups {
    company: Company;
    groups: BundlingGroup[];
  }

  const groupedBundlings: CompanyGroupWithGroups[] = Object.values(bundlingsByCompany || {}).map((companyGroup) => {
    const byParent = companyGroup.bundlings.reduce<GroupedByParent>((acc, bundling) => {
      // Create composite key: parentId + formulaType
      const key = `${bundling.parentGuaranteeId}_${bundling.formulaType || 'null'}`;
      if (!acc[key]) {
        acc[key] = {
          parent: bundling.parentGuarantee,
          included: [],
          formulaType: bundling.formulaType,
        };
      }
      acc[key].included.push(bundling);
      return acc;
    }, {});

    return {
      company: companyGroup.company,
      groups: Object.values(byParent),
    };
  });

  return (
    <div className="space-y-6">
      {/* Header with Help Button Only */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Règles de Groupement Configurées
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Gérez les garanties automatiquement incluses dans d'autres garanties
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => setIsHelpModalOpen(true)}
            className="flex items-center gap-2"
          >
            <HelpCircle className="w-4 h-4" />
            Guide Complet
          </Button>
          <Button onClick={() => openModal()} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle Règle
          </Button>
        </div>
      </div>

      {/* Bundlings List */}
      <div className="space-y-6">
        {groupedBundlings.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucune règle de groupement
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Créez des règles pour grouper automatiquement des garanties
            </p>
            <Button onClick={() => openModal()}>
              <Plus className="w-4 h-4 mr-2" />
              Créer la première règle
            </Button>
          </div>
        ) : (
          groupedBundlings.map((companyGroup, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Company Header */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {companyGroup.company.name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {companyGroup.groups.length} règle(s) de groupement
                    </p>
                  </div>
                </div>
              </div>

              {/* Bundling Groups */}
              <div className="p-6 space-y-4">
                {companyGroup.groups.map((group, groupIdx) => {
                  // Check if this is the current Lloyd bundling rule
                  const isCurrentLloydRule = companyGroup.company.code === 'LLOYD' && 
                    group.parent.code === 'DOMMAGES_EMEUTES' && 
                    group.included.some(b => b.includedGuarantee.code === 'CATASTROPHES_NATURELLES');
                  
                  return (
                  <div key={groupIdx} className={`rounded-lg border p-4 ${
                    isCurrentLloydRule 
                      ? 'bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-400 dark:border-green-600 shadow-lg' 
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                  }`}>
                    {isCurrentLloydRule && (
                      <div className="mb-3 bg-green-100 dark:bg-green-900/40 border border-green-300 dark:border-green-700 rounded-lg px-3 py-2">
                        <p className="text-xs font-bold text-green-800 dark:text-green-200 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          ✅ RÈGLE ACTUELLEMENT ACTIVE - Comportement du système en production
                        </p>
                      </div>
                    )}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm font-semibold text-gray-900 dark:text-white">
                            📦 Garantie Principale:
                          </span>
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-sm font-medium rounded">
                            {group.parent.nameFr}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs text-gray-600 dark:text-gray-400">
                            Formule:
                          </span>
                          <span className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-medium rounded">
                            {group.formulaType === 'STANDARD' ? 'Standard' :
                             group.formulaType === 'DOMMAGES_COLLISIONS' ? 'Dommages Collision' :
                             group.formulaType === 'TOUS_RISQUES_0' ? 'Tous Risques 0%' : 'Toutes les formules'}
                          </span>
                        </div>
                        <div className="mt-3">
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
                            ✓ Inclut automatiquement:
                          </span>
                          <div className="flex flex-wrap gap-2">
                            {group.included.map((bundling) => (
                              <div key={bundling.id} className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded px-3 py-1.5">
                                <span className="text-xs text-green-800 dark:text-green-300 font-medium">
                                  {bundling.includedGuarantee.nameFr}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => openEditModal(bundling)}
                                    className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                                    title="Modifier"
                                  >
                                    <Edit2 className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm('Supprimer cette règle de groupement ?')) {
                                        deleteMutation.mutate(bundling.id);
                                      }
                                    }}
                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                                    title="Supprimer"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setViewingGroup(group);
                          setViewingCompany(companyGroup.company);
                          setIsViewDetailsModalOpen(true);
                        }}
                        className="flex items-center gap-2 ml-4"
                      >
                        <Eye className="w-4 h-4" />
                        Voir Détails
                      </Button>
                    </div>
                  </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Nouvelle Règle de Groupement
                </h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Compagnie *
                </label>
                <select
                  value={formData.companyId}
                  onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Sélectionner une compagnie</option>
                  {companies?.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Garantie Principale *
                </label>
                <select
                  value={formData.parentGuaranteeId}
                  onChange={(e) => setFormData({ ...formData, parentGuaranteeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  required
                >
                  <option value="">Sélectionner une garantie</option>
                  {guarantees?.map((guarantee) => (
                    <option key={guarantee.id} value={guarantee.id}>
                      {guarantee.nameFr}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  ℹ️ La garantie qui inclut d'autres garanties
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Garanties Incluses * (sélection multiple)
                </label>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-48 overflow-y-auto bg-white dark:bg-gray-800">
                  {guarantees
                    ?.filter((g) => g.id !== formData.parentGuaranteeId)
                    .map((guarantee) => (
                      <label key={guarantee.id} className="flex items-center gap-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded px-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.includedGuaranteeIds.includes(guarantee.id)}
                          onChange={() => toggleIncludedGuarantee(guarantee.id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {guarantee.nameFr}
                        </span>
                      </label>
                    ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  ℹ️ Sélectionnez les garanties qui seront automatiquement incluses
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type de Formule (optionnel)
                </label>
                <select
                  value={formData.formulaType}
                  onChange={(e) => setFormData({ ...formData, formulaType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Toutes les formules</option>
                  <option value="STANDARD">Standard</option>
                  <option value="DOMMAGES_COLLISIONS">Dommages Collision</option>
                  <option value="TOUS_RISQUES_0">Tous Risques 0%</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  ℹ️ Laissez vide pour appliquer à toutes les formules
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                      💡 Comportement
                    </p>
                    <p className="text-xs text-yellow-800 dark:text-yellow-300">
                      Quand un client sélectionne la garantie principale, le système inclura 
                      automatiquement les garanties sélectionnées ci-dessus sans frais supplémentaires.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" loading={createMutation.isPending} className="flex-1">
                  Créer la règle
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && editingBundling && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Modifier la Règle de Groupement
                </h2>
                <button onClick={closeEditModal} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Eye className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-blue-800 dark:text-blue-300">
                    <p className="font-semibold mb-1">Règle actuelle:</p>
                    <p><strong>Compagnie:</strong> {editingBundling.company.name}</p>
                    <p><strong>Garantie principale:</strong> {editingBundling.parentGuarantee.nameFr}</p>
                    <p><strong>Garantie incluse:</strong> {editingBundling.includedGuarantee.nameFr}</p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type de Formule
                </label>
                <select
                  value={editFormData.formulaType || ''}
                  onChange={(e) => setEditFormData({ ...editFormData, formulaType: e.target.value || null })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Toutes les formules</option>
                  <option value="STANDARD">Standard</option>
                  <option value="DOMMAGES_COLLISIONS">Dommages Collision</option>
                  <option value="TOUS_RISQUES_0">Tous Risques 0%</option>
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  ℹ️ Laissez vide pour appliquer à toutes les formules
                </p>
              </div>

              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFormData.isActive}
                    onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">
                    Règle active
                  </span>
                </label>
                <p className="text-xs text-gray-500 mt-1 ml-6">
                  ℹ️ Décochez pour désactiver temporairement cette règle
                </p>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                      ⚠️ Attention
                    </p>
                    <p className="text-xs text-yellow-800 dark:text-yellow-300">
                      La modification de la formule peut créer un conflit si une règle identique existe déjà.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={closeEditModal} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" loading={updateMutation.isPending} className="flex-1">
                  Enregistrer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isViewDetailsModalOpen && viewingGroup && viewingCompany && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-600" />
                  Détails de la Règle de Groupement
                </h2>
                <button onClick={() => setIsViewDetailsModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Company Info */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Compagnie</p>
                    <p className="text-lg font-bold text-gray-900 dark:text-white">{viewingCompany.name}</p>
                  </div>
                </div>
              </div>

              {/* Main Guarantee */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border-2 border-blue-300 dark:border-blue-700">
                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-2">📦 GARANTIE PRINCIPALE</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white mb-2">{viewingGroup.parent.nameFr}</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-600 dark:text-gray-400">Formule applicable:</span>
                  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-medium rounded">
                    {viewingGroup.formulaType === 'STANDARD' ? 'Standard' :
                     viewingGroup.formulaType === 'DOMMAGES_COLLISIONS' ? 'Dommages Collision' :
                     viewingGroup.formulaType === 'TOUS_RISQUES_0' ? 'Tous Risques 0%' : 'Toutes les formules'}
                  </span>
                </div>
              </div>

              {/* Arrow */}
              <div className="flex justify-center">
                <div className="bg-green-100 dark:bg-green-900 rounded-full p-3">
                  <ArrowRight className="w-8 h-8 text-green-600 dark:text-green-400" />
                </div>
              </div>

              {/* Included Guarantees */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border-2 border-green-300 dark:border-green-700">
                <p className="text-xs text-green-600 dark:text-green-400 font-semibold mb-3">✓ GARANTIES INCLUSES AUTOMATIQUEMENT</p>
                <div className="space-y-2">
                  {viewingGroup.included.map((bundling) => (
                    <div key={bundling.id} className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-700">
                      <p className="text-sm font-bold text-green-900 dark:text-green-100">{bundling.includedGuarantee.nameFr}</p>
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">Sans frais supplémentaires</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Behavior Explanation */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg p-4 border border-yellow-200 dark:border-yellow-700">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-yellow-900 dark:text-yellow-200 mb-2">💡 Comportement du Système</p>
                    <p className="text-sm text-yellow-800 dark:text-yellow-300 leading-relaxed">
                      Quand un client de <strong>{viewingCompany.name}</strong> sélectionne la garantie 
                      <strong> "{viewingGroup.parent.nameFr}"</strong>, le système inclura automatiquement 
                      {viewingGroup.included.map((b, idx) => (
                        <span key={b.id}>
                          {idx > 0 && (idx === viewingGroup.included.length - 1 ? ' et ' : ', ')}
                          <strong>"{b.includedGuarantee.nameFr}"</strong>
                        </span>
                      ))}
                      {' '}sans frais supplémentaires.
                    </p>
                  </div>
                </div>
              </div>

              {/* Example Scenario */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  Exemple Concret
                </p>
                <div className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">1.</span>
                    <span>Le client choisit la garantie <strong>"{viewingGroup.parent.nameFr}"</strong></span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">2.</span>
                    <span>Le système ajoute automatiquement {viewingGroup.included.map((b) => `"${b.includedGuarantee.nameFr}"`).join(', ')}</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">3.</span>
                    <span>Le client ne paie que le prix de la garantie principale</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-bold">4.</span>
                    <span>Les garanties incluses apparaissent dans le devis avec la mention "Inclus"</span>
                  </div>
                </div>
              </div>

              {/* Technical Details */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                <p className="text-xs font-bold text-gray-900 dark:text-white mb-3">📋 DÉTAILS TECHNIQUES</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Nombre de garanties incluses</p>
                    <p className="font-bold text-gray-900 dark:text-white">{viewingGroup.included.length}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Statut</p>
                    <p className="font-bold text-green-600 dark:text-green-400">✓ Active</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Type de formule</p>
                    <p className="font-bold text-gray-900 dark:text-white">
                      {viewingGroup.formulaType || 'Toutes les formules'}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400">Compagnie</p>
                    <p className="font-bold text-gray-900 dark:text-white">{viewingCompany.code}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button onClick={() => setIsViewDetailsModalOpen(false)} className="w-full">
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Help/Guide Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700 z-10">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <HelpCircle className="w-6 h-6 text-blue-600" />
                  Guide Complet - Garanties Groupées
                </h2>
                <button onClick={() => setIsHelpModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Section 1: Qu'est-ce qu'une Garantie Groupée */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5 text-blue-600" />
                  1. Qu'est-ce qu'une Garantie Groupée ?
                </h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-4">
                  Une <strong>garantie groupée</strong> est un mécanisme qui permet d'inclure automatiquement 
                  une ou plusieurs garanties secondaires lorsqu'un client sélectionne une garantie principale, 
                  <strong> sans frais supplémentaires</strong>.
                </p>
                <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2 font-semibold">Exemple concret :</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Pour <strong>Lloyd Tunisien</strong>, la garantie "Dommages suite émeutes" (30 DT) inclut 
                    automatiquement "Extension Catastrophes Naturelles". Le client paie 30 DT et bénéficie 
                    des deux garanties.
                  </p>
                </div>
              </div>

              {/* Section 2: Diagramme de Fonctionnement */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-purple-600" />
                  2. Comment ça fonctionne ?
                </h3>
                
                {/* Diagramme Visuel */}
                <div className="space-y-6">
                  {/* Cas 1: Avec Groupement (Lloyd) */}
                  <div className="border-2 border-green-300 dark:border-green-700 rounded-lg p-4 bg-green-50 dark:bg-green-900/10">
                    <p className="text-sm font-bold text-green-900 dark:text-green-200 mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Avec Groupement (Exemple: Lloyd)
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="bg-blue-100 dark:bg-blue-900 px-4 py-3 rounded-lg border-2 border-blue-500 min-w-[200px]">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">Garantie Principale</p>
                        <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Dommages suite émeutes</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Prix: 30 DT</p>
                      </div>
                      <ArrowRight className="w-6 h-6 text-green-600 dark:text-green-400" />
                      <div className="bg-green-100 dark:bg-green-900 px-4 py-3 rounded-lg border-2 border-green-500 min-w-[200px]">
                        <p className="text-xs text-green-600 dark:text-green-400 font-semibold mb-1">✓ Inclus Automatiquement</p>
                        <p className="text-sm font-bold text-green-900 dark:text-green-100">Catastrophes Naturelles</p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">Prix: 0 DT (inclus)</p>
                      </div>
                      <div className="ml-auto bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg">
                        <p className="text-xs font-semibold">Total Client</p>
                        <p className="text-lg font-bold">30 DT</p>
                      </div>
                    </div>
                  </div>

                  {/* Cas 2: Sans Groupement (Amana) */}
                  <div className="border-2 border-orange-300 dark:border-orange-700 rounded-lg p-4 bg-orange-50 dark:bg-orange-900/10">
                    <p className="text-sm font-bold text-orange-900 dark:text-orange-200 mb-3 flex items-center gap-2">
                      <XCircle className="w-4 h-4" />
                      Sans Groupement (Exemple: Amana)
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="bg-blue-100 dark:bg-blue-900 px-4 py-3 rounded-lg border-2 border-blue-500 min-w-[200px]">
                        <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">Garantie 1</p>
                        <p className="text-sm font-bold text-blue-900 dark:text-blue-100">Dommages suite émeutes</p>
                        <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">Prix: 30 DT</p>
                      </div>
                      <Plus className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                      <div className="bg-purple-100 dark:bg-purple-900 px-4 py-3 rounded-lg border-2 border-purple-500 min-w-[200px]">
                        <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">Garantie 2 (Séparée)</p>
                        <p className="text-sm font-bold text-purple-900 dark:text-purple-100">Catastrophes Naturelles</p>
                        <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">Prix: 40 DT</p>
                      </div>
                      <div className="ml-auto bg-gradient-to-r from-orange-500 to-orange-600 text-white px-4 py-2 rounded-lg">
                        <p className="text-xs font-semibold">Total Client</p>
                        <p className="text-lg font-bold">70 DT</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Avantages */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border border-green-200 dark:border-green-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  3. Avantages pour la Compagnie
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                    <span><strong>Offre commerciale attractive :</strong> Proposer plus de couverture au même prix</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                    <span><strong>Simplification :</strong> Le client n'a pas à sélectionner plusieurs garanties</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                    <span><strong>Flexibilité :</strong> Configurable par compagnie et par formule</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                    <span><strong>Gestion centralisée :</strong> Modification en temps réel sans code</span>
                  </li>
                </ul>
              </div>

              {/* Section 4: Configuration */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-indigo-600" />
                  4. Comment Configurer une Règle ?
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-700 dark:text-indigo-300 font-bold text-sm">1</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Sélectionner la Compagnie</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Choisir pour quelle compagnie (Lloyd, Amana, etc.)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-700 dark:text-indigo-300 font-bold text-sm">2</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Définir la Garantie Principale</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">La garantie que le client va sélectionner</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-700 dark:text-indigo-300 font-bold text-sm">3</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Choisir les Garanties Incluses</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Les garanties qui seront automatiquement ajoutées (sélection multiple possible)</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-100 dark:bg-indigo-900 rounded-full w-8 h-8 flex items-center justify-center flex-shrink-0">
                      <span className="text-indigo-700 dark:text-indigo-300 font-bold text-sm">4</span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Spécifier la Formule (Optionnel)</p>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Laisser vide pour toutes les formules, ou choisir une formule spécifique (Standard, TR 0%, etc.)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 5: Cas d'Usage */}
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-6 border border-purple-200 dark:border-purple-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Eye className="w-5 h-5 text-purple-600" />
                  5. Cas d'Usage Réels
                </h3>
                <div className="space-y-3">
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                    <p className="text-sm font-bold text-purple-900 dark:text-purple-200 mb-2">📌 Cas 1: Lloyd Tunisien</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      <strong>Règle:</strong> Dommages suite émeutes → Inclut Catastrophes Naturelles<br/>
                      <strong>Formule:</strong> Toutes<br/>
                      <strong>Résultat:</strong> Client paie 30 DT et obtient les deux garanties
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                    <p className="text-sm font-bold text-purple-900 dark:text-purple-200 mb-2">📌 Cas 2: Amana</p>
                    <p className="text-xs text-gray-700 dark:text-gray-300">
                      <strong>Règle:</strong> Aucune règle de groupement<br/>
                      <strong>Résultat:</strong> Chaque garantie est facturée séparément (30 DT + 40 DT = 70 DT)
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 6: Current System Behavior */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-6 border-2 border-green-300 dark:border-green-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  6. Comportement Actuel du Système (Production)
                </h3>
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-green-200 dark:border-green-700">
                    <p className="text-sm font-bold text-green-900 dark:text-green-200 mb-2 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Lloyd Tunisien - AVEC GROUPEMENT
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                      <strong>Règle active:</strong> Dommages suite émeutes (30 DT) → Inclut automatiquement Catastrophes Naturelles
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-300">
                      ✅ Le client paie 30 DT et bénéficie des deux garanties
                    </p>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-orange-200 dark:border-orange-700">
                    <p className="text-sm font-bold text-orange-900 dark:text-orange-200 mb-2 flex items-center gap-2">
                      <Package className="w-4 h-4" />
                      Assurances Amana - SANS GROUPEMENT
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">
                      <strong>Règle:</strong> Aucune règle de groupement configurée
                    </p>
                    <p className="text-xs text-orange-700 dark:text-orange-300">
                      ⚠️ Chaque garantie est facturée séparément (30 DT + 40 DT = 70 DT)
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 7: How to Add New Rule */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-blue-600" />
                  7. Comment Ajouter une Nouvelle Règle ?
                </h3>
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-700">
                    <p className="text-sm font-bold text-blue-900 dark:text-blue-200 mb-3">📝 Étapes détaillées :</p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">1</div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Cliquer sur "Nouvelle Règle"</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Bouton en haut à droite de la page</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">2</div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Sélectionner la compagnie</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Exemple: Lloyd, Amana, Baraka, etc.</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">3</div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Choisir la garantie principale</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">La garantie que le client va sélectionner (celle qui a un prix)</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">4</div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Cocher les garanties à inclure</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Sélection multiple possible - ces garanties seront gratuites</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">5</div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Choisir la formule (optionnel)</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Laisser vide = toutes les formules | Choisir une formule = uniquement pour cette formule</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center flex-shrink-0 text-xs font-bold">6</div>
                        <div>
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Cliquer sur "Créer la règle"</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">La règle prend effet immédiatement</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-700">
                    <p className="text-xs text-yellow-800 dark:text-yellow-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span><strong>Impact immédiat:</strong> Dès la création, toutes les nouvelles simulations utiliseront cette règle. Les simulations existantes ne sont pas affectées.</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 8: How to Modify Existing Rule */}
              <div className="bg-white dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Edit2 className="w-5 h-5 text-purple-600" />
                  8. Comment Modifier une Règle Existante ?
                </h3>
                <div className="space-y-4">
                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                    <p className="text-sm font-bold text-purple-900 dark:text-purple-200 mb-3">✏️ Deux options disponibles :</p>
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Option 1: Modifier la formule ou le statut</p>
                        <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                          <p>• Cliquer sur l'icône <Edit2 className="w-3 h-3 inline" /> (crayon) sur la garantie incluse</p>
                          <p>• Modifier le type de formule (Toutes → Standard, TR 0%, etc.)</p>
                          <p>• Activer/Désactiver temporairement la règle</p>
                          <p>• Cliquer sur "Enregistrer"</p>
                        </div>
                      </div>
                      <div className="bg-white dark:bg-gray-900 rounded-lg p-3 border border-purple-200 dark:border-purple-700">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Option 2: Supprimer et recréer</p>
                        <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                          <p>• Cliquer sur l'icône <Trash2 className="w-3 h-3 inline" /> (poubelle) pour supprimer</p>
                          <p>• Créer une nouvelle règle avec les nouveaux paramètres</p>
                          <p>• Utile pour changer la garantie principale ou les garanties incluses</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-700">
                    <p className="text-xs text-orange-800 dark:text-orange-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span><strong>Impact de la modification:</strong> Les changements sont appliqués immédiatement. Les simulations en cours ne sont pas affectées, mais les nouvelles simulations utiliseront la règle modifiée.</span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Section 9: Real-World Scenarios */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg p-6 border border-indigo-200 dark:border-indigo-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Package className="w-5 h-5 text-indigo-600" />
                  9. Scénarios Réels de Changement
                </h3>
                <div className="space-y-4">
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700">
                    <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200 mb-3">🔄 Scénario 1: Changement de politique commerciale</p>
                    <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                      <p><strong>Situation:</strong> Lloyd décide de ne plus inclure gratuitement "Catastrophes Naturelles"</p>
                      <p><strong>Action:</strong> Supprimer la règle de groupement Lloyd → Dommages émeutes → Catastrophes Naturelles</p>
                      <p><strong>Résultat:</strong> Les clients devront payer séparément pour chaque garantie (comme Amana)</p>
                      <p className="text-red-600 dark:text-red-400"><strong>⚠️ Important:</strong> Créer une règle de tarification pour "Catastrophes Naturelles" chez Lloyd avant de supprimer le groupement</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700">
                    <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200 mb-3">🔄 Scénario 2: Nouvelle compagnie avec groupement</p>
                    <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                      <p><strong>Situation:</strong> Baraka rejoint le système et veut grouper "CAS" avec "Défense et Recours"</p>
                      <p><strong>Action:</strong> Créer une nouvelle règle: Baraka → CAS → Défense et Recours</p>
                      <p><strong>Résultat:</strong> Les clients Baraka qui choisissent CAS obtiennent automatiquement Défense et Recours</p>
                      <p className="text-green-600 dark:text-green-400"><strong>✅ Avantage:</strong> Offre commerciale attractive sans modifier le code</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700">
                    <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200 mb-3">🔄 Scénario 3: Groupement uniquement pour Tous Risques</p>
                    <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                      <p><strong>Situation:</strong> Amana veut grouper "Assistance" avec "Vol" mais uniquement pour la formule Tous Risques 0%</p>
                      <p><strong>Action:</strong> Créer règle: Amana → Vol → Assistance | Formule: Tous Risques 0%</p>
                      <p><strong>Résultat:</strong> Le groupement s'applique uniquement aux clients qui choisissent Tous Risques 0%</p>
                      <p className="text-blue-600 dark:text-blue-400"><strong>💡 Flexibilité:</strong> Différentes règles pour différentes formules</p>
                    </div>
                  </div>
                  <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-indigo-200 dark:border-indigo-700">
                    <p className="text-sm font-bold text-indigo-900 dark:text-indigo-200 mb-3">🔄 Scénario 4: Désactivation temporaire</p>
                    <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300">
                      <p><strong>Situation:</strong> Lloyd veut tester l'impact de supprimer le groupement pendant 1 mois</p>
                      <p><strong>Action:</strong> Modifier la règle → Décocher "Règle active"</p>
                      <p><strong>Résultat:</strong> Le groupement est désactivé sans supprimer la règle (peut être réactivé facilement)</p>
                      <p className="text-purple-600 dark:text-purple-400"><strong>🎯 Pratique:</strong> Test A/B sans perte de configuration</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 10: Important Warnings */}
              <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6 border border-red-200 dark:border-red-700">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                  10. Points Critiques à Respecter
                </h3>
                <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400 font-bold">⚠</span>
                    <span><strong>Tarification:</strong> La garantie incluse ne doit PAS avoir de règle de tarification pour la compagnie concernée (sinon conflit de prix)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400 font-bold">⚠</span>
                    <span><strong>Unicité:</strong> Une même combinaison (compagnie + garantie principale + garantie incluse + formule) ne peut exister qu'une seule fois</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400 font-bold">⚠</span>
                    <span><strong>Auto-groupement:</strong> Une garantie ne peut pas être groupée avec elle-même (validation automatique)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400 font-bold">⚠</span>
                    <span><strong>Effet immédiat:</strong> Toute modification/création/suppression prend effet immédiatement pour les nouvelles simulations</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 dark:text-red-400 font-bold">⚠</span>
                    <span><strong>Audit:</strong> Toutes les modifications sont enregistrées dans l'historique avec l'utilisateur et la date</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white dark:bg-gray-800 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button onClick={() => setIsHelpModalOpen(false)} className="w-full">
                J'ai compris
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
