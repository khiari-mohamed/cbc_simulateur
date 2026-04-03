import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import { Plus, Edit, Trash2, Shield, X } from 'lucide-react';
import api from '../../../lib/api/client';
import toast from 'react-hot-toast';

export const GuaranteesPage = () => {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGuarantee, setSelectedGuarantee] = useState<any>(null);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'deactivate' | 'reactivate' | 'delete' | null;
    guarantee: any;
  }>({ isOpen: false, type: null, guarantee: null });
  const [formData, setFormData] = useState({
    code: '',
    nameFr: '',
    nameAr: '',
    nameEn: '',
    isOptional: false,
    systemRole: '',
  });

  const { data: guarantees, isLoading } = useQuery({
    queryKey: ['guarantees', 'all'],
    queryFn: async () => {
      const { data } = await api.get('/guarantees?includeInactive=true');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      if (selectedGuarantee) {
        await api.patch(`/guarantees/${selectedGuarantee.id}`, data);
      } else {
        await api.post('/guarantees', data);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guarantees'] });
      toast.success(selectedGuarantee ? 'Garantie modifiée' : 'Garantie créée');
      closeModal();
    },
    onError: () => {
      toast.error('Erreur lors de la sauvegarde');
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/guarantees/${id}/deactivate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guarantees'] });
      toast.success('Garantie désactivée avec succès');
      setConfirmModal({ isOpen: false, type: null, guarantee: null });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la désactivation';
      toast.error(message);
      setConfirmModal({ isOpen: false, type: null, guarantee: null });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/guarantees/${id}/reactivate`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guarantees'] });
      toast.success('Garantie réactivée avec succès');
      setConfirmModal({ isOpen: false, type: null, guarantee: null });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la réactivation';
      toast.error(message);
      setConfirmModal({ isOpen: false, type: null, guarantee: null });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const response = await api.delete(`/guarantees/${id}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['guarantees'] });
      toast.success('Garantie supprimée définitivement');
      setConfirmModal({ isOpen: false, type: null, guarantee: null });
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || 'Erreur lors de la suppression';
      toast.error(message);
      setConfirmModal({ isOpen: false, type: null, guarantee: null });
    },
  });

  const openModal = (guarantee?: any) => {
    if (guarantee) {
      setSelectedGuarantee(guarantee);
      setFormData({
        code: guarantee.code,
        nameFr: guarantee.nameFr,
        nameAr: guarantee.nameAr || '',
        nameEn: guarantee.nameEn || '',
        isOptional: guarantee.isOptional,
        systemRole: guarantee.systemRole || '',
      });
    } else {
      setSelectedGuarantee(null);
      setFormData({
        code: '',
        nameFr: '',
        nameAr: '',
        nameEn: '',
        isOptional: false,
        systemRole: '',
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedGuarantee(null);
    setFormData({
      code: '',
      nameFr: '',
      nameAr: '',
      nameEn: '',
      isOptional: false,
      systemRole: '',
    });
  };

  const handleConfirmAction = () => {
    if (!confirmModal.guarantee) return;

    switch (confirmModal.type) {
      case 'deactivate':
        deactivateMutation.mutate(confirmModal.guarantee.id);
        break;
      case 'reactivate':
        reactivateMutation.mutate(confirmModal.guarantee.id);
        break;
      case 'delete':
        deleteMutation.mutate(confirmModal.guarantee.id);
        break;
    }
  };

  const getConfirmModalConfig = () => {
    switch (confirmModal.type) {
      case 'deactivate':
        return {
          title: 'Désactiver la garantie',
          message: `Êtes-vous sûr de vouloir désactiver la garantie "${confirmModal.guarantee?.nameFr}" ?\n\nElle ne sera plus disponible pour les nouveaux devis.`,
          confirmText: 'Désactiver',
          variant: 'warning' as const,
        };
      case 'reactivate':
        return {
          title: 'Réactiver la garantie',
          message: `Êtes-vous sûr de vouloir réactiver la garantie "${confirmModal.guarantee?.nameFr}" ?\n\nElle sera à nouveau disponible pour les nouveaux devis.`,
          confirmText: 'Réactiver',
          variant: 'info' as const,
        };
      case 'delete':
        return {
          title: 'Supprimer définitivement',
          message: `ATTENTION: Voulez-vous vraiment supprimer définitivement la garantie "${confirmModal.guarantee?.nameFr}" ?\n\nCette action est irréversible et échouera si la garantie est utilisée dans des règles de tarification, devis ou contrats.`,
          confirmText: 'Supprimer',
          variant: 'danger' as const,
        };
      default:
        return {
          title: '',
          message: '',
          confirmText: 'Confirmer',
          variant: 'warning' as const,
        };
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate code format
    if (!/^[A-Z_]+$/.test(formData.code)) {
      toast.error('Le code doit contenir uniquement des lettres majuscules et des underscores (_)');
      return;
    }
    
    createMutation.mutate(formData);
  };

  return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Garanties</h1>
              <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-semibold rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3" />
                MODULE PROTÉGÉ
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Gérez les garanties d'assurance disponibles
            </p>
          </div>
          <Button onClick={() => openModal()} className="flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Nouvelle garantie
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid gap-4">
            {guarantees?.map((guarantee: any) => (
              <div
                key={guarantee.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                      <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {guarantee.nameFr}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            guarantee.isActive
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                          }`}
                        >
                          {guarantee.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            guarantee.isOptional
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                              : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                          }`}
                        >
                          {guarantee.isOptional ? 'Optionnelle' : 'Obligatoire'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                        Code: <span className="font-mono">{guarantee.code}</span>
                      </p>
                      {guarantee.systemRole && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                          Rôle: <span className="font-mono text-blue-600 dark:text-blue-400">{guarantee.systemRole}</span>
                        </p>
                      )}
                      {guarantee.nameAr && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          AR: {guarantee.nameAr}
                        </p>
                      )}
                      {guarantee.nameEn && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          EN: {guarantee.nameEn}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openModal(guarantee)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    {guarantee.isActive ? (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-orange-600 hover:text-orange-700 hover:border-orange-600"
                        onClick={() => setConfirmModal({ isOpen: true, type: 'deactivate', guarantee })}
                      >
                        Désactiver
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-green-600 hover:text-green-700 hover:border-green-600"
                        onClick={() => setConfirmModal({ isOpen: true, type: 'reactivate', guarantee })}
                      >
                        Réactiver
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:border-red-600"
                      onClick={() => setConfirmModal({ isOpen: true, type: 'delete', guarantee })}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {selectedGuarantee ? 'Modifier la garantie' : 'Nouvelle garantie'}
                </h2>
                <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <Input
                    label="Code *"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="RC, VOL, INCENDIE..."
                    required
                    disabled={!!selectedGuarantee}
                  />
                  <p className="text-xs text-gray-500 mt-1">Lettres majuscules et underscores uniquement (ex: RC, VOL_INCENDIE)</p>
                </div>

                <Input
                  label="Nom (Français) *"
                  value={formData.nameFr}
                  onChange={(e) => setFormData({ ...formData, nameFr: e.target.value })}
                  placeholder="Responsabilité Civile"
                  required
                />

                <Input
                  label="Nom (Arabe)"
                  value={formData.nameAr}
                  onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                  placeholder="المسؤولية المدنية"
                />

                <Input
                  label="Nom (Anglais)"
                  value={formData.nameEn}
                  onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                  placeholder="Civil Liability"
                />

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Rôle Système (pour les 14 garanties prédéfinies)
                  </label>
                  <select
                    value={formData.systemRole}
                    onChange={(e) => setFormData({ ...formData, systemRole: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Aucun (pour nouvelles garanties optionnelles)</option>
                    <optgroup label="Garanties Obligatoires">
                      <option value="MANDATORY_RC">RC - Responsabilité Civile</option>
                      <option value="MANDATORY_VOL">VOL - Vol</option>
                      <option value="MANDATORY_INCENDIE">INCENDIE - Incendie</option>
                      <option value="MANDATORY_CAS">CAS - CAS / Défense et Recours</option>
                      <option value="MANDATORY_PERSONNES_TRANSPORTEES">PTA - Personnes Transportées</option>
                      <option value="MANDATORY_ASSISTANCE">ASSISTANCE - Assistance Remorquage</option>
                    </optgroup>
                    <optgroup label="Garanties Optionnelles">
                      <option value="OPTIONAL_TOUS_RISQUES">TR - Tous Risques 0%</option>
                      <option value="OPTIONAL_DOMMAGES_COLLISIONS">DC - Dommages Collision</option>
                      <option value="OPTIONAL_BRIS_GLACES">BG - Bris de Glaces</option>
                      <option value="OPTIONAL_CATASTROPHES_NATURELLES">CATNAT - Catastrophes Naturelles</option>
                      <option value="OPTIONAL_DOMMAGES_EMEUTES">GEMP - Dommages Émeutes</option>
                      <option value="OPTIONAL_INCENDIE_EMEUTES">INCENDIE_EMEUTES - Incendie Émeutes</option>
                      <option value="OPTIONAL_DEFENSE_RECOURS">DR - Défense et Recours</option>
                      <option value="OPTIONAL_ASSURANCE_CONDUCTEUR">IAC - Assurance Conducteur</option>
                    </optgroup>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    ⚠️ Requis pour les 14 garanties prédéfinies. Laissez vide pour les nouvelles garanties optionnelles.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isOptional"
                    checked={formData.isOptional}
                    onChange={(e) => setFormData({ ...formData, isOptional: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isOptional" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Garantie optionnelle
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="button" variant="outline" onClick={closeModal} className="flex-1">
                    Annuler
                  </Button>
                  <Button type="submit" loading={createMutation.isPending} className="flex-1">
                    {selectedGuarantee ? 'Modifier' : 'Créer'}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Confirmation Modal */}
        <ConfirmationModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, type: null, guarantee: null })}
          onConfirm={handleConfirmAction}
          isLoading={deactivateMutation.isPending || reactivateMutation.isPending || deleteMutation.isPending}
          {...getConfirmModalConfig()}
        />
      </div>
  );
};
