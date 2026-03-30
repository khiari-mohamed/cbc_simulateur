import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../../lib/api/client';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal';
import UsageTypeModal from '../../../components/admin/UsageTypeModal';
import toast from 'react-hot-toast';

interface UsageType {
  id: string;
  code: string;
  nameFr: string;
  nameAr?: string;
  nameEn?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  usageFeeConfigs?: Array<{
    id: string;
    contractFees: number;
    fpac: number;
    fssr: number;
    fg: number;
    company: {
      id: string;
      name: string;
      code: string;
    };
  }>;
}

interface UsageTypePayload {
  code: string;
  nameFr: string;
  nameAr?: string;
  nameEn?: string;
  isActive?: boolean;
  feeConfigs?: Array<{
    companyId: string;
    contractFees: number;
    fpac: number;
    fssr: number;
    fg: number;
  }>;
}

interface UpdateMutationParams {
  id: string;
  payload: UsageTypePayload;
}

const UsageTypesPage = () => {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<UsageType | null>(null);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'deactivate' | 'activate';
    usage: UsageType;
  } | null>(null);

  const { data: usages, isLoading: isLoadingUsages } = useQuery<UsageType[]>({
    queryKey: ['usage-types'],
    queryFn: async () => {
      const { data } = await api.get('/usage-types?includeInactive=true');
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload: UsageTypePayload) => {
      const { data } = await api.post('/usage-types', payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage-types'] });
      toast.success('Usage créé avec succès');
      setIsOpen(false);
      setEditing(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: UpdateMutationParams) => {
      const { data } = await api.patch(`/usage-types/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage-types'] });
      toast.success('Usage modifié avec succès');
      setIsOpen(false);
      setEditing(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/usage-types/${id}/permanent`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage-types'] });
      toast.success('Usage supprimé avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data } = await api.patch(`/usage-types/${id}`, { isActive });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['usage-types'] });
      toast.success('Statut modifié avec succès');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification du statut');
    },
  });

  const isLoading = createMutation.isPending || updateMutation.isPending || deleteMutation.isPending;

  const handleCreate = () => {
    setEditing(null);
    setIsOpen(true);
  };

  const handleEdit = (usage: UsageType) => {
    setEditing(usage);
    setIsOpen(true);
  };

  const handleDelete = (usage: UsageType) => {
    setConfirmAction({ type: 'delete', usage });
  };

  const handleToggleActive = (usage: UsageType) => {
    if (!usage.isActive) {
      setConfirmAction({ type: 'activate', usage });
    } else {
      setConfirmAction({ type: 'deactivate', usage });
    }
  };

  const executeConfirmAction = () => {
    if (!confirmAction) return;
    
    const { type, usage } = confirmAction;
    
    switch (type) {
      case 'delete':
        deleteMutation.mutate(usage.id);
        break;
      case 'activate':
        toggleActiveMutation.mutate({ id: usage.id, isActive: true });
        break;
      case 'deactivate':
        toggleActiveMutation.mutate({ id: usage.id, isActive: false });
        break;
    }
    
    setConfirmAction(null);
  };

  const getConfirmationProps = () => {
    if (!confirmAction) return null;
    
    const { type, usage } = confirmAction;
    
    switch (type) {
      case 'delete':
        return {
          title: 'Supprimer l\'usage',
          message: `Êtes-vous sûr de vouloir SUPPRIMER DÉFINITIVEMENT l'usage "${usage.nameFr}" ?\n\nCette action est irréversible et supprimera toutes les données associées.`,
          confirmText: 'Supprimer',
          variant: 'danger' as const
        };
      case 'deactivate':
        return {
          title: 'Désactiver l\'usage',
          message: `Êtes-vous sûr de vouloir désactiver l'usage "${usage.nameFr}" ?\n\nIl ne sera plus disponible dans les formulaires mais pourra être réactivé plus tard.`,
          confirmText: 'Désactiver',
          variant: 'warning' as const
        };
      case 'activate':
        return {
          title: 'Activer l\'usage',
          message: `Êtes-vous sûr de vouloir activer l'usage "${usage.nameFr}" ?\n\nIl sera à nouveau disponible dans les formulaires.`,
          confirmText: 'Activer',
          variant: 'info' as const
        };
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Types d'Usage</h2>
        <Button onClick={handleCreate}>+ Créer Usage</Button>
      </Card>

      <Card className="p-4">
        {isLoadingUsages ? (
          <div className="text-center py-8 text-gray-500">Chargement...</div>
        ) : !usages || usages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">Aucun usage trouvé</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2 px-2">Code</th>
                <th className="text-left py-2 px-2">Nom (FR)</th>
                <th className="text-left py-2 px-2">Compagnies configurées</th>
                <th className="text-left py-2 px-2">Statut</th>
                <th className="text-left py-2 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {usages.map((usage) => (
                <tr key={usage.id} className="border-t hover:bg-gray-50">
                  <td className="py-2 px-2 font-mono text-sm">{usage.code}</td>
                  <td className="py-2 px-2">{usage.nameFr}</td>
                  <td className="py-2 px-2">
                    <div className="flex flex-wrap gap-1">
                      {usage.usageFeeConfigs && usage.usageFeeConfigs.length > 0 ? (
                        usage.usageFeeConfigs.map((config) => (
                          <span
                            key={config.id}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            title={`Frais: ${config.contractFees} DT | FPAC: ${config.fpac}% | FSSR: ${config.fssr}% | FG: ${config.fg} DT`}
                          >
                            {config.company.name} · {config.contractFees} DT
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">Non configuré</span>
                      )}
                    </div>
                  </td>
                  <td className="py-2 px-2">
                    <button
                      onClick={() => handleToggleActive(usage)}
                      disabled={toggleActiveMutation.isPending}
                      className="flex items-center gap-2 hover:opacity-70 disabled:opacity-50"
                      title={usage.isActive ? 'Cliquer pour désactiver' : 'Cliquer pour activer'}
                    >
                      <span className="text-lg">{usage.isActive ? '✅' : '❌'}</span>
                      <span className="text-xs text-gray-600">
                        {usage.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </button>
                  </td>
                  <td className="py-2 px-2">
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(usage)}
                        disabled={isLoading}
                      >
                        Modifier
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDelete(usage)}
                        disabled={isLoading}
                        className="text-red-600 hover:text-red-700 hover:border-red-300"
                      >
                        Supprimer
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {isOpen && (
        <UsageTypeModal
          isOpen={isOpen}
          onClose={() => {
            setIsOpen(false);
            setEditing(null);
          }}
          onCreate={(payload: UsageTypePayload) => createMutation.mutate(payload)}
          onUpdate={(id: string, payload: UsageTypePayload) => updateMutation.mutate({ id, payload })}
          editing={editing}
          isLoading={isLoading}
        />
      )}

      {confirmAction && (
        <ConfirmationModal
          isOpen={true}
          onClose={() => setConfirmAction(null)}
          onConfirm={executeConfirmAction}
          isLoading={isLoading}
          {...getConfirmationProps()!}
        />
      )}
    </div>
  );
};

export default UsageTypesPage;
