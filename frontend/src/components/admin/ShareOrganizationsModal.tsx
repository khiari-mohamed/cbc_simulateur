import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Users, Building2, CheckCircle, Trash2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';

interface Organization {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

interface SharedOrganization {
  id: string;
  conventionId: string;
  organizationId: string;
  organization: Organization;
  assignedAt: string;
  assignedBy: string | null;
}

interface Convention {
  id: string;
  name: string;
  organizationId: string;
  organization: Organization;
}

interface ShareOrganizationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  convention: Convention | null;
}

export const ShareOrganizationsModal = ({ isOpen, onClose, convention }: ShareOrganizationsModalProps) => {
  const queryClient = useQueryClient();
  const [selectedOrgIds, setSelectedOrgIds] = useState<string[]>([]);

  // Fetch all organizations
  const { data: allOrganizations, isLoading: loadingOrgs } = useQuery<Organization[]>({
    queryKey: ['client-organizations'],
    queryFn: async () => {
      const { data } = await api.get('/client-organizations');
      return data;
    },
    enabled: isOpen,
  });

  // Fetch currently shared organizations
  const { data: sharedOrganizations, isLoading: loadingShared } = useQuery<SharedOrganization[]>({
    queryKey: ['convention-shared-orgs', convention?.id],
    queryFn: async () => {
      if (!convention?.id) throw new Error('Convention ID is required');
      const { data } = await api.get(`/conventions/${convention.id}/shared-organizations`);
      return data;
    },
    enabled: isOpen && !!convention?.id,
  });

  // Share mutation
  const shareMutation = useMutation({
    mutationFn: (organizationIds: string[]) => {
      if (!convention) throw new Error('Convention is required');
      return api.post(`/conventions/${convention.id}/share`, { organizationIds });
    },
    onSuccess: () => {
      if (!convention) return;
      queryClient.invalidateQueries({ queryKey: ['convention-shared-orgs', convention.id] });
      queryClient.invalidateQueries({ queryKey: ['conventions'] });
      toast.success('Convention partagée avec succès');
      setSelectedOrgIds([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors du partage');
    },
  });

  // Unshare mutation
  const unshareMutation = useMutation({
    mutationFn: (organizationId: string) => {
      if (!convention) throw new Error('Convention is required');
      return api.delete(`/conventions/${convention.id}/share/${organizationId}`);
    },
    onSuccess: () => {
      if (!convention) return;
      queryClient.invalidateQueries({ queryKey: ['convention-shared-orgs', convention.id] });
      queryClient.invalidateQueries({ queryKey: ['conventions'] });
      toast.success('Organisation retirée avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors du retrait');
    },
  });

  const handleShare = () => {
    if (selectedOrgIds.length === 0) {
      toast.error('Veuillez sélectionner au moins une organisation');
      return;
    }
    shareMutation.mutate(selectedOrgIds);
  };

  const handleUnshare = (organizationId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir retirer cette organisation ?')) {
      unshareMutation.mutate(organizationId);
    }
  };

  const toggleOrganization = (orgId: string) => {
    setSelectedOrgIds(prev => 
      prev.includes(orgId) 
        ? prev.filter(id => id !== orgId)
        : [...prev, orgId]
    );
  };

  if (!isOpen || !convention) return null;

  const sharedOrgIds = sharedOrganizations?.map((s) => s.organizationId) || [];
  const availableOrganizations = allOrganizations?.filter((org) => 
    org.id !== convention.organizationId && // Exclude primary org
    !sharedOrgIds.includes(org.id) && // Exclude already shared
    org.isActive // Only active orgs
  ) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Users className="w-5 h-5" />
              Partager la convention
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {convention.name}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Primary Organization Info */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-200">
                Organisation propriétaire
              </h3>
            </div>
            <p className="text-sm text-blue-800 dark:text-blue-300">
              {convention.organization.name}
            </p>
            <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Cette organisation est le propriétaire principal de la convention
            </p>
          </div>

          {/* Currently Shared Organizations */}
          {sharedOrganizations && sharedOrganizations.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                Organisations avec accès ({sharedOrganizations.length})
              </h3>
              <div className="space-y-2">
                {sharedOrganizations.map((shared) => (
                  <div
                    key={shared.id}
                    className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {shared.organization.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Code: {shared.organization.code}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Partagé le {new Date(shared.assignedAt).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUnshare(shared.organizationId)}
                      disabled={unshareMutation.isPending}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Organizations to Share */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Ajouter des organisations
            </h3>
            
            {loadingOrgs || loadingShared ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : availableOrganizations.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Aucune organisation disponible pour le partage
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Toutes les organisations actives ont déjà accès à cette convention
                </p>
              </div>
            ) : (
              <>
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg max-h-64 overflow-y-auto">
                  {availableOrganizations.map((org) => (
                    <label
                      key={org.id}
                      className="flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer border-b border-gray-200 dark:border-gray-700 last:border-b-0"
                    >
                      <input
                        type="checkbox"
                        checked={selectedOrgIds.includes(org.id)}
                        onChange={() => toggleOrganization(org.id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {org.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Code: {org.code}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  {selectedOrgIds.length} organisation(s) sélectionnée(s)
                </p>
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="flex-1"
          >
            Fermer
          </Button>
          {availableOrganizations.length > 0 && (
            <Button
              type="button"
              onClick={handleShare}
              disabled={selectedOrgIds.length === 0 || shareMutation.isPending}
              loading={shareMutation.isPending}
              className="flex-1"
            >
              Partager avec {selectedOrgIds.length > 0 ? `${selectedOrgIds.length} org(s)` : '...'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
