import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Shield, Trash2, Edit2, X, AlertCircle, CheckCircle, XCircle, DollarSign, HelpCircle, Eye } from 'lucide-react';
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

type AvailabilityStatus = 'GRATUIT' | 'NON_ACCORDEE' | 'DEFAULT' | 'HIDDEN';
type FormulaType = 'STANDARD' | 'DOMMAGES_COLLISIONS' | 'TOUS_RISQUES_0' | null;

interface GuaranteeAvailability {
  id: string;
  companyId: string;
  company: Company;
  guaranteeId: string;
  guarantee: Guarantee;
  formulaType: FormulaType;
  status: AvailabilityStatus;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FormData {
  companyId: string;
  guaranteeId: string;
  formulaType: string;
  status: AvailabilityStatus;
}

export const GuaranteeAvailabilityTab = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);
  const [isActivateModalOpen, setIsActivateModalOpen] = useState(false);
  const [viewingConfig, setViewingConfig] = useState<GuaranteeAvailability | null>(null);
  const [deletingConfig, setDeletingConfig] = useState<GuaranteeAvailability | null>(null);
  const [deactivatingConfig, setDeactivatingConfig] = useState<GuaranteeAvailability | null>(null);
  const [activatingConfig, setActivatingConfig] = useState<GuaranteeAvailability | null>(null);
  const [editingConfig, setEditingConfig] = useState<GuaranteeAvailability | null>(null);
  const [showInactive, setShowInactive] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    companyId: '',
    guaranteeId: '',
    formulaType: '',
    status: 'DEFAULT',
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

  const { data: configs } = useQuery<GuaranteeAvailability[]>({
    queryKey: ['guarantee-availability', showInactive],
    queryFn: async () => {
      const endpoint = showInactive 
        ? '/guarantee-availability/all-including-inactive'
        : '/guarantee-availability';
      const { data } = await api.get(endpoint);
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      return api.post('/guarantee-availability', {
        companyId: data.companyId,
        guaranteeId: data.guaranteeId,
        formulaType: data.formulaType || null,
        status: data.status,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guarantee-availability'] });
      toast.success('Configuration créée avec succès');
      closeModal();
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<FormData> & { isActive?: boolean } }) => {
      return api.patch(`/guarantee-availability/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guarantee-availability'] });
      toast.success('Configuration modifiée avec succès');
      closeEditModal();
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/guarantee-availability/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guarantee-availability'] });
      toast.success('Configuration supprimée définitivement');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/guarantee-availability/${id}/deactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guarantee-availability'] });
      toast.success('Configuration désactivée');
    },
    onError: () => toast.error('Erreur lors de la désactivation'),
  });

  const activateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/guarantee-availability/${id}/activate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guarantee-availability'] });
      toast.success('Configuration activée');
    },
    onError: () => toast.error('Erreur lors de l\'activation'),
  });

  const openModal = () => {
    setFormData({
      companyId: '',
      guaranteeId: '',
      formulaType: '',
      status: 'DEFAULT',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => setIsModalOpen(false);

  const openEditModal = (config: GuaranteeAvailability) => {
    setEditingConfig(config);
    setFormData({
      companyId: config.companyId,
      guaranteeId: config.guaranteeId,
      formulaType: config.formulaType || '',
      status: config.status,
    });
    setIsEditModalOpen(true);
  };

  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingConfig(null);
  };

  const openViewModal = (config: GuaranteeAvailability) => {
    setViewingConfig(config);
    setIsViewModalOpen(true);
  };

  const closeViewModal = () => {
    setIsViewModalOpen(false);
    setViewingConfig(null);
  };

  const openDeleteModal = (config: GuaranteeAvailability) => {
    setDeletingConfig(config);
    setIsDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setDeletingConfig(null);
  };

  const openDeactivateModal = (config: GuaranteeAvailability) => {
    setDeactivatingConfig(config);
    setIsDeactivateModalOpen(true);
  };

  const closeDeactivateModal = () => {
    setIsDeactivateModalOpen(false);
    setDeactivatingConfig(null);
  };

  const openActivateModal = (config: GuaranteeAvailability) => {
    setActivatingConfig(config);
    setIsActivateModalOpen(true);
  };

  const closeActivateModal = () => {
    setIsActivateModalOpen(false);
    setActivatingConfig(null);
  };

  const handleDeactivate = () => {
    if (deactivatingConfig) {
      deactivateMutation.mutate(deactivatingConfig.id);
      closeDeactivateModal();
    }
  };

  const handleActivate = () => {
    if (activatingConfig) {
      activateMutation.mutate(activatingConfig.id);
      closeActivateModal();
    }
  };

  const handleDelete = () => {
    if (deletingConfig) {
      deleteMutation.mutate(deletingConfig.id);
      closeDeleteModal();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.companyId || !formData.guaranteeId || !formData.status) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }
    createMutation.mutate(formData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingConfig) return;
    updateMutation.mutate({
      id: editingConfig.id,
      data: {
        status: formData.status,
        formulaType: formData.formulaType || undefined,
      },
    });
  };

  const getStatusBadge = (status: AvailabilityStatus) => {
    switch (status) {
      case 'GRATUIT':
        return (
          <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-bold rounded-full flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            GRATUIT
          </span>
        );
      case 'NON_ACCORDEE':
        return (
          <span className="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 text-xs font-bold rounded-full flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            NON ACCORDÉE
          </span>
        );
      case 'HIDDEN':
        return (
          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-xs font-bold rounded-full flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            CACHÉE
          </span>
        );
      case 'DEFAULT':
        return (
          <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-bold rounded-full flex items-center gap-1">
            <DollarSign className="w-3 h-3" />
            TARIF NORMAL
          </span>
        );
    }
  };

  const getFormulaLabel = (formulaType: FormulaType) => {
    if (!formulaType) return 'Toutes les formules';
    switch (formulaType) {
      case 'STANDARD':
        return 'Standard';
      case 'DOMMAGES_COLLISIONS':
        return 'Dommages Collision';
      case 'TOUS_RISQUES_0':
        return 'Tous Risques 0%';
      default:
        return formulaType;
    }
  };

  // Group by company
  const configsByCompany = configs?.reduce<Record<string, { company: Company; configs: GuaranteeAvailability[] }>>((acc, config) => {
    const companyId = config.companyId;
    if (!acc[companyId]) {
      acc[companyId] = {
        company: config.company,
        configs: [],
      };
    }
    acc[companyId].configs.push(config);
    return acc;
  }, {});

  // Group by guarantee to show cross-company summary
  const configsByGuarantee = configs?.reduce<Record<string, {
    guarantee: Guarantee;
    byCompany: Record<string, { status: AvailabilityStatus; formulaType: FormulaType; isActive: boolean }>;
  }>>((acc, config) => {
    const guaranteeId = config.guaranteeId;
    if (!acc[guaranteeId]) {
      acc[guaranteeId] = {
        guarantee: config.guarantee,
        byCompany: {},
      };
    }
    const key = `${config.companyId}-${config.formulaType || 'ALL'}`;
    acc[guaranteeId].byCompany[key] = {
      status: config.status,
      formulaType: config.formulaType,
      isActive: config.isActive,
    };
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Disponibilité des Garanties
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configurez le statut des garanties par compagnie et formule
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => setIsHelpModalOpen(true)}
            variant="outline"
            className="flex items-center gap-2"
          >
            <HelpCircle className="w-4 h-4" />
            Guide d'utilisation
          </Button>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            Afficher les désactivées
          </label>
          <Button onClick={openModal} className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Nouvelle Configuration
          </Button>
        </div>
      </div>

      {/* Info Banner */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800 dark:text-blue-300">
            <p className="font-semibold mb-1">💡 Comment ça fonctionne ?</p>
            <ul className="space-y-1 text-xs">
              <li><strong>GRATUIT:</strong> Garantie incluse gratuitement (prix = 0)</li>
              <li><strong>NON ACCORDÉE:</strong> Garantie visible dans le devis avec label "NON ACCORDÉE"</li>
              <li><strong>HIDDEN:</strong> Garantie complètement cachée (n'apparaît nulle part)</li>
              <li><strong>TARIF NORMAL:</strong> Utilise le module de tarification (comportement par défaut)</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Cross-Company Summary */}
      {configsByGuarantee && Object.keys(configsByGuarantee).length > 0 && (
        <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border-2 border-purple-200 dark:border-purple-700 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Vue d'ensemble : Accordé / Non Accordé par Compagnie
              </h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Résumé des garanties configurées pour toutes les compagnies
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {Object.values(configsByGuarantee).map((guaranteeGroup, idx) => {
              // Get all companies that have this guarantee configured
              const companiesWithConfig = configs
                ?.filter(c => c.guaranteeId === guaranteeGroup.guarantee.id)
                .map(c => c.company.name);
              
              // Get companies without config (accordé by default)
              const allCompanyNames = companies?.map(c => c.name) || [];
              const companiesWithoutConfig = allCompanyNames.filter(
                name => !companiesWithConfig?.includes(name)
              );

              return (
                <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg border border-purple-200 dark:border-purple-700 p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-bold text-gray-900 dark:text-white">
                        {guaranteeGroup.guarantee.nameFr}
                      </h4>
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                        {guaranteeGroup.guarantee.code}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* NON ACCORDÉE */}
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                        <span className="text-xs font-bold text-red-900 dark:text-red-200">NON ACCORDÉE</span>
                      </div>
                      <div className="space-y-1">
                        {configs
                          ?.filter(c => c.guaranteeId === guaranteeGroup.guarantee.id && c.status === 'NON_ACCORDEE' && (showInactive || c.isActive))
                          .map((config, i) => (
                            <div key={i} className="text-xs text-red-800 dark:text-red-300">
                              • {config.company.name}
                              {config.formulaType && (
                                <span className="text-red-600 dark:text-red-400 ml-1">
                                  ({getFormulaLabel(config.formulaType)})
                                </span>
                              )}
                              {!config.isActive && (
                                <span className="text-red-500 dark:text-red-400 ml-1 italic">
                                  (inactive)
                                </span>
                              )}
                            </div>
                          ))}
                        {configs?.filter(c => c.guaranteeId === guaranteeGroup.guarantee.id && c.status === 'NON_ACCORDEE' && (showInactive || c.isActive)).length === 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic">Aucune</p>
                        )}
                      </div>
                    </div>

                    {/* GRATUIT */}
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                        <span className="text-xs font-bold text-green-900 dark:text-green-200">GRATUIT</span>
                      </div>
                      <div className="space-y-1">
                        {configs
                          ?.filter(c => c.guaranteeId === guaranteeGroup.guarantee.id && c.status === 'GRATUIT' && (showInactive || c.isActive))
                          .map((config, i) => (
                            <div key={i} className="text-xs text-green-800 dark:text-green-300">
                              • {config.company.name}
                              {config.formulaType && (
                                <span className="text-green-600 dark:text-green-400 ml-1">
                                  ({getFormulaLabel(config.formulaType)})
                                </span>
                              )}
                              {!config.isActive && (
                                <span className="text-green-500 dark:text-green-400 ml-1 italic">
                                  (inactive)
                                </span>
                              )}
                            </div>
                          ))}
                        {configs?.filter(c => c.guaranteeId === guaranteeGroup.guarantee.id && c.status === 'GRATUIT' && (showInactive || c.isActive)).length === 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic">Aucune</p>
                        )}
                      </div>
                    </div>

                    {/* ACCORDÉE (TARIF NORMAL) */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-xs font-bold text-blue-900 dark:text-blue-200">ACCORDÉE (Tarif normal)</span>
                      </div>
                      <div className="space-y-1">
                        {/* Companies with DEFAULT status */}
                        {configs
                          ?.filter(c => c.guaranteeId === guaranteeGroup.guarantee.id && c.status === 'DEFAULT' && (showInactive || c.isActive))
                          .map((config, i) => (
                            <div key={i} className="text-xs text-blue-800 dark:text-blue-300">
                              • {config.company.name}
                              {config.formulaType && (
                                <span className="text-blue-600 dark:text-blue-400 ml-1">
                                  ({getFormulaLabel(config.formulaType)})
                                </span>
                              )}
                              {!config.isActive && (
                                <span className="text-blue-500 dark:text-blue-400 ml-1 italic">
                                  (inactive)
                                </span>
                              )}
                            </div>
                          ))}
                        {/* Companies without any config (default behavior) */}
                        {companiesWithoutConfig.map((companyName, i) => (
                          <div key={`default-${i}`} className="text-xs text-blue-800 dark:text-blue-300">
                            • {companyName} <span className="text-blue-600 dark:text-blue-400">(par défaut)</span>
                          </div>
                        ))}
                        {configs?.filter(c => c.guaranteeId === guaranteeGroup.guarantee.id && c.status === 'DEFAULT' && (showInactive || c.isActive)).length === 0 && companiesWithoutConfig.length === 0 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic">Aucune</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Configs List */}
      <div className="space-y-6">
        {!configsByCompany || Object.keys(configsByCompany).length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <Shield className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucune configuration
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Créez des règles pour contrôler la disponibilité des garanties
            </p>
            <Button onClick={openModal}>
              <Plus className="w-4 h-4 mr-2" />
              Créer la première configuration
            </Button>
          </div>
        ) : (
          Object.values(configsByCompany).map((companyGroup, idx) => (
            <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              {/* Company Header */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                    <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                      {companyGroup.company.name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {companyGroup.configs.length} configuration(s)
                    </p>
                  </div>
                </div>
              </div>

              {/* Configs Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Garantie
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Formule
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        État
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {companyGroup.configs.map((config) => (
                      <tr key={config.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {config.guarantee.nameFr}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {config.guarantee.code}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-medium rounded">
                            {getFormulaLabel(config.formulaType)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(config.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {config.isActive ? (
                            <span className="text-green-600 dark:text-green-400 text-xs font-medium">✓ Active</span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs font-medium">○ Inactive</span>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => openViewModal(config)}
                              className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                              title="Voir les détails"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openEditModal(config)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              title="Modifier"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {config.isActive ? (
                              <button
                                onClick={() => openDeactivateModal(config)}
                                className="text-orange-600 hover:text-orange-800 dark:text-orange-400 dark:hover:text-orange-300"
                                title="Désactiver"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            ) : (
                              <button
                                onClick={() => openActivateModal(config)}
                                className="text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                                title="Activer"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => openDeleteModal(config)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              title="Supprimer définitivement"
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
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Nouvelle Configuration
                </h2>
                <button onClick={closeModal} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
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
                  Garantie *
                </label>
                <select
                  value={formData.guaranteeId}
                  onChange={(e) => setFormData({ ...formData, guaranteeId: e.target.value })}
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Formule (optionnel)
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Statut *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="status"
                      value="GRATUIT"
                      checked={formData.status === 'GRATUIT'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AvailabilityStatus })}
                      className="w-4 h-4 text-green-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">GRATUIT</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Garantie incluse gratuitement (prix = 0)
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="status"
                      value="NON_ACCORDEE"
                      checked={formData.status === 'NON_ACCORDEE'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AvailabilityStatus })}
                      className="w-4 h-4 text-orange-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">NON ACCORDÉE</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Visible dans le devis avec label "NON ACCORDÉE"
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="status"
                      value="HIDDEN"
                      checked={formData.status === 'HIDDEN'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AvailabilityStatus })}
                      className="w-4 h-4 text-gray-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">CACHÉE</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Complètement cachée (n'apparaît nulle part)
                      </p>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="status"
                      value="DEFAULT"
                      checked={formData.status === 'DEFAULT'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AvailabilityStatus })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">TARIF NORMAL</span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Utilise le module de tarification (comportement par défaut)
                      </p>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                  Annuler
                </Button>
                <Button type="submit" loading={createMutation.isPending} className="flex-1">
                  Créer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Details Modal */}
      {isViewModalOpen && viewingConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                    <Eye className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Détails de la Configuration
                  </h2>
                </div>
                <button onClick={closeViewModal} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Company Info */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <h3 className="font-bold text-gray-900 dark:text-white">Compagnie</h3>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Nom</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{viewingConfig.company.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Code</p>
                    <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{viewingConfig.company.code}</p>
                  </div>
                </div>
              </div>

              {/* Guarantee Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3">Garantie</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Nom</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{viewingConfig.guarantee.nameFr}</p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">Code</p>
                    <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">{viewingConfig.guarantee.code}</p>
                  </div>
                </div>
              </div>

              {/* Configuration Details */}
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Formule</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {getFormulaLabel(viewingConfig.formulaType)}
                    </p>
                  </div>
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-medium rounded">
                    {getFormulaLabel(viewingConfig.formulaType)}
                  </span>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Statut</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {viewingConfig.status === 'GRATUIT' && 'Garantie gratuite (prix = 0 DT)'}
                      {viewingConfig.status === 'NON_ACCORDEE' && 'Garantie non disponible (bloquée)'}
                      {viewingConfig.status === 'DEFAULT' && 'Tarif normal (module de tarification)'}
                    </p>
                  </div>
                  {getStatusBadge(viewingConfig.status)}
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">État</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {viewingConfig.isActive ? 'Configuration active' : 'Configuration désactivée'}
                    </p>
                  </div>
                  {viewingConfig.isActive ? (
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-bold rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      ACTIVE
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300 text-xs font-bold rounded-full flex items-center gap-1">
                      <XCircle className="w-3 h-3" />
                      INACTIVE
                    </span>
                  )}
                </div>
              </div>

              {/* Metadata */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 text-sm">Informations système</h3>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">Créée le</p>
                    <p className="font-mono text-gray-900 dark:text-white">
                      {new Date(viewingConfig.createdAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600 dark:text-gray-400 mb-1">Modifiée le</p>
                    <p className="font-mono text-gray-900 dark:text-white">
                      {new Date(viewingConfig.updatedAt).toLocaleString('fr-FR')}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-gray-600 dark:text-gray-400 mb-1">ID</p>
                    <p className="font-mono text-xs text-gray-900 dark:text-white break-all">
                      {viewingConfig.id}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <Button onClick={closeViewModal} variant="outline" className="flex-1">
                Fermer
              </Button>
              <Button onClick={() => { closeViewModal(); openEditModal(viewingConfig); }} className="flex-1">
                <Edit2 className="w-4 h-4 mr-2" />
                Modifier
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Deactivate Confirmation Modal */}
      {isDeactivateModalOpen && deactivatingConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <XCircle className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Désactiver cette configuration ?
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Elle ne sera plus utilisée mais restera dans l'historique
                  </p>
                </div>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4 mb-4">
                <p className="text-sm text-orange-800 dark:text-orange-300 mb-3">
                  Configuration à désactiver :
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-orange-700 dark:text-orange-400">Compagnie :</span>
                    <span className="font-bold text-orange-900 dark:text-orange-200">{deactivatingConfig.company.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-700 dark:text-orange-400">Garantie :</span>
                    <span className="font-bold text-orange-900 dark:text-orange-200">{deactivatingConfig.guarantee.nameFr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-orange-700 dark:text-orange-400">Formule :</span>
                    <span className="font-bold text-orange-900 dark:text-orange-200">{getFormulaLabel(deactivatingConfig.formulaType)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-blue-800 dark:text-blue-300">
                    <strong>Info :</strong> Vous pourrez réactiver cette configuration à tout moment. Elle restera visible dans l'historique.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={closeDeactivateModal} variant="outline" className="flex-1">
                  Annuler
                </Button>
                <Button 
                  onClick={handleDeactivate} 
                  className="flex-1 bg-orange-600 hover:bg-orange-700 text-white"
                  loading={deactivateMutation.isPending}
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Désactiver
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Activate Confirmation Modal */}
      {isActivateModalOpen && activatingConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Réactiver cette configuration ?
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Elle sera à nouveau utilisée par le système
                  </p>
                </div>
              </div>

              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4 mb-4">
                <p className="text-sm text-green-800 dark:text-green-300 mb-3">
                  Configuration à réactiver :
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-400">Compagnie :</span>
                    <span className="font-bold text-green-900 dark:text-green-200">{activatingConfig.company.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-400">Garantie :</span>
                    <span className="font-bold text-green-900 dark:text-green-200">{activatingConfig.guarantee.nameFr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-400">Formule :</span>
                    <span className="font-bold text-green-900 dark:text-green-200">{getFormulaLabel(activatingConfig.formulaType)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-green-700 dark:text-green-400">Statut :</span>
                    {getStatusBadge(activatingConfig.status)}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={closeActivateModal} variant="outline" className="flex-1">
                  Annuler
                </Button>
                <Button 
                  onClick={handleActivate} 
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                  loading={activateMutation.isPending}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Réactiver
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && deletingConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    Supprimer définitivement ?
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Cette action est irréversible
                  </p>
                </div>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-4">
                <p className="text-sm text-red-800 dark:text-red-300 mb-3">
                  Vous êtes sur le point de supprimer cette configuration :
                </p>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-red-700 dark:text-red-400">Compagnie :</span>
                    <span className="font-bold text-red-900 dark:text-red-200">{deletingConfig.company.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700 dark:text-red-400">Garantie :</span>
                    <span className="font-bold text-red-900 dark:text-red-200">{deletingConfig.guarantee.nameFr}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-red-700 dark:text-red-400">Formule :</span>
                    <span className="font-bold text-red-900 dark:text-red-200">{getFormulaLabel(deletingConfig.formulaType)}</span>
                  </div>
                </div>
              </div>

              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mb-4">
                <div className="flex gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-800 dark:text-yellow-300">
                    <strong>Conseil :</strong> Utilisez plutôt "Désactiver" pour conserver l'historique et pouvoir réactiver plus tard.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={closeDeleteModal} variant="outline" className="flex-1">
                  Annuler
                </Button>
                <Button 
                  onClick={handleDelete} 
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                  loading={deleteMutation.isPending}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer définitivement
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Help Modal */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <HelpCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                    Guide d'utilisation - Disponibilité des Garanties
                  </h2>
                </div>
                <button onClick={() => setIsHelpModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Introduction */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-5">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-blue-600" />
                  Qu'est-ce que ce module ?
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  Ce module vous permet de <strong>contrôler la disponibilité des garanties</strong> pour chaque compagnie d'assurance et formule. 
                  Vous pouvez décider si une garantie est <strong>gratuite</strong>, <strong>non disponible</strong>, ou utilise le <strong>tarif normal</strong>.
                </p>
              </div>

              {/* Les 3 statuts */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">📋 Les 3 statuts disponibles</h3>
                <div className="space-y-3">
                  <div className="border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-green-900 dark:text-green-200 mb-2">GRATUIT</h4>
                        <p className="text-sm text-green-800 dark:text-green-300 mb-2">
                          La garantie est <strong>incluse automatiquement</strong> dans le devis avec un <strong>prix de 0 DT</strong>.
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-400 italic">
                          Exemple : Bris de Glaces gratuit pour la formule Tous Risques 0%
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-red-900 dark:text-red-200 mb-2">NON ACCORDÉE</h4>
                        <p className="text-sm text-red-800 dark:text-red-300 mb-2">
                          La garantie est <strong>bloquée</strong> et <strong>n'apparaît pas</strong> dans la liste des garanties disponibles pour cette compagnie.
                        </p>
                        <p className="text-xs text-red-700 dark:text-red-400 italic">
                          Exemple : Incendie suite émeute non accordée pour ALBARAKA
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <DollarSign className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-blue-900 dark:text-blue-200 mb-2">TARIF NORMAL (par défaut)</h4>
                        <p className="text-sm text-blue-800 dark:text-blue-300 mb-2">
                          Le système utilise le <strong>module de tarification</strong> pour calculer le prix de la garantie normalement.
                        </p>
                        <p className="text-xs text-blue-700 dark:text-blue-400 italic">
                          C'est le comportement par défaut si aucune configuration n'existe
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Comment tester */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🧪 Comment tester vos configurations ?</h3>
                <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <ol className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</span>
                      <div>
                        <strong>Créez une configuration</strong> (ex: ALBARAKA + Incendie suite émeute = NON ACCORDÉE)
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</span>
                      <div>
                        <strong>Allez dans "Simulations"</strong> et créez un nouveau devis
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</span>
                      <div>
                        <strong>Sélectionnez la compagnie ALBARAKA</strong>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">4</span>
                      <div>
                        <strong>Vérifiez l'étape "Garanties"</strong> : la garantie "Incendie suite émeute" ne doit <strong>PAS apparaître</strong>
                      </div>
                    </li>
                  </ol>
                </div>
              </div>

              {/* Impact sur le système */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">⚡ Impact sur le système</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <p>
                      <strong>Étape de sélection des garanties :</strong> Les garanties NON ACCORDÉES sont cachées, les garanties GRATUITES affichent "Inclus gratuitement"
                    </p>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <p>
                      <strong>Calcul du prix :</strong> Les garanties GRATUITES ont un prix de 0 DT, les autres utilisent le module de tarification
                    </p>
                  </div>
                  <div className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
                    <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
                    <p>
                      <strong>Devis final :</strong> Seules les garanties disponibles et sélectionnées apparaissent dans le devis
                    </p>
                  </div>
                </div>
              </div>

              {/* Guide de configuration initiale */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">🚀 Configuration initiale : Incendie suite émeute pour ALBARAKA</h3>
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border-2 border-indigo-300 dark:border-indigo-700 rounded-lg p-5">
                  <p className="text-sm text-gray-800 dark:text-gray-200 mb-4 font-semibold">
                    📝 Voici comment créer la configuration demandée par le client :
                  </p>
                  <div className="bg-white dark:bg-gray-800 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 dark:text-gray-300">Cliquez sur <strong>"Nouvelle Configuration"</strong></p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">Remplissez le formulaire :</p>
                        <div className="bg-gray-50 dark:bg-gray-900 rounded p-3 space-y-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Compagnie :</span>
                            <span className="font-bold text-gray-900 dark:text-white">ALBARAKA</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Garantie :</span>
                            <span className="font-bold text-gray-900 dark:text-white">Incendie suite émeute</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Formule :</span>
                            <span className="font-bold text-gray-900 dark:text-white">Toutes les formules</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-600 dark:text-gray-400">Statut :</span>
                            <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-bold rounded">NON ACCORDÉE</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</span>
                      <div className="flex-1">
                        <p className="text-sm text-gray-700 dark:text-gray-300">Cliquez sur <strong>"Créer"</strong></p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <span className="flex-shrink-0 w-7 h-7 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">✓</span>
                      <div className="flex-1">
                        <p className="text-sm text-green-700 dark:text-green-300 font-semibold">
                          Résultat : La garantie "Incendie suite émeute" ne sera plus proposée pour ALBARAKA
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Exemples pratiques */}
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">💡 Autres exemples pratiques</h3>
                <div className="space-y-3">
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                    <p className="text-sm text-yellow-900 dark:text-yellow-200 font-semibold mb-2">Exemple 1 : Bloquer une garantie pour toutes les formules</p>
                    <p className="text-xs text-yellow-800 dark:text-yellow-300">
                      Compagnie : <strong>ALBARAKA</strong> | Garantie : <strong>Incendie suite émeute</strong> | Formule : <strong>Toutes</strong> | Statut : <strong className="text-red-600">NON ACCORDÉE</strong>
                    </p>
                    <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-2 italic">
                      → Cette garantie ne sera jamais proposée pour ALBARAKA (aucune formule)
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                    <p className="text-sm text-green-900 dark:text-green-200 font-semibold mb-2">Exemple 2 : Rendre une garantie gratuite pour une formule spécifique</p>
                    <p className="text-xs text-green-800 dark:text-green-300">
                      Compagnie : <strong>LLOYD</strong> | Garantie : <strong>Bris de Glaces</strong> | Formule : <strong>Tous Risques 0%</strong> | Statut : <strong className="text-green-600">GRATUIT</strong>
                    </p>
                    <p className="text-xs text-green-700 dark:text-green-400 mt-2 italic">
                      → BG sera inclus gratuitement uniquement pour TR0% chez LLOYD (payant pour les autres formules)
                    </p>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                    <p className="text-sm text-purple-900 dark:text-purple-200 font-semibold mb-2">Exemple 3 : Règles différentes par formule</p>
                    <p className="text-xs text-purple-800 dark:text-purple-300 mb-1">
                      <strong>Configuration 1 :</strong> AMANA | Vol | Standard | <strong className="text-red-600">NON ACCORDÉE</strong>
                    </p>
                    <p className="text-xs text-purple-800 dark:text-purple-300">
                      <strong>Configuration 2 :</strong> AMANA | Vol | Tous Risques 0% | <strong className="text-blue-600">TARIF NORMAL</strong>
                    </p>
                    <p className="text-xs text-purple-700 dark:text-purple-400 mt-2 italic">
                      → Vol bloqué pour Standard mais disponible avec tarif normal pour TR0%
                    </p>
                  </div>
                </div>
              </div>

              {/* Conseils */}
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg p-4">
                <h3 className="text-lg font-bold text-orange-900 dark:text-orange-200 mb-3 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Conseils importants
                </h3>
                <ul className="space-y-2 text-sm text-orange-800 dark:text-orange-300">
                  <li className="flex gap-2">
                    <span className="text-orange-600">•</span>
                    <span>Testez toujours vos configurations en créant un devis de simulation</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-600">•</span>
                    <span>Utilisez "Désactiver" au lieu de "Supprimer" pour garder l'historique</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-600">•</span>
                    <span>Si aucune configuration n'existe, le système utilise le tarif normal par défaut</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-orange-600">•</span>
                    <span>Les configurations spécifiques à une formule ont priorité sur "Toutes les formules"</span>
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

      {/* Edit Modal */}
      {isEditModalOpen && editingConfig && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-lg w-full max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Modifier la Configuration
                </h2>
                <button onClick={closeEditModal} className="text-gray-500 hover:text-gray-700">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  <strong>Compagnie:</strong> {editingConfig.company.name}<br />
                  <strong>Garantie:</strong> {editingConfig.guarantee.nameFr}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Formule
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
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Statut *
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="status"
                      value="GRATUIT"
                      checked={formData.status === 'GRATUIT'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AvailabilityStatus })}
                      className="w-4 h-4 text-green-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">GRATUIT</span>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="status"
                      value="NON_ACCORDEE"
                      checked={formData.status === 'NON_ACCORDEE'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AvailabilityStatus })}
                      className="w-4 h-4 text-orange-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">NON ACCORDÉE</span>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="status"
                      value="HIDDEN"
                      checked={formData.status === 'HIDDEN'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AvailabilityStatus })}
                      className="w-4 h-4 text-gray-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-gray-600" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">CACHÉE</span>
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center gap-3 p-3 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                    <input
                      type="radio"
                      name="status"
                      value="DEFAULT"
                      checked={formData.status === 'DEFAULT'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as AvailabilityStatus })}
                      className="w-4 h-4 text-blue-600"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">TARIF NORMAL</span>
                      </div>
                    </div>
                  </label>
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
    </div>
  );
};
