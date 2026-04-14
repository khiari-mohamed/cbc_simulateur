import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, FileText, Edit, Trash2, CheckCircle, XCircle, Shield, Calendar, Building2, Sliders, Users, HelpCircle } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { ConventionModal } from '../../../components/admin/ConventionModal';
import { ShareOrganizationsModal } from '../../../components/admin/ShareOrganizationsModal';
import { ConventionSharingHelpModal } from '../../../components/admin/ConventionSharingHelpModal';
import { useNavigate } from 'react-router-dom';
import api from '../../../lib/api/client';
import toast from 'react-hot-toast';

interface Organization {
  id: string;
  name: string;
  code: string;
  isActive: boolean;
}

interface Company {
  id: string;
  name: string;
  code: string;
}

interface ConventionCompany {
  companyId: string;
  company: Company;
}

interface SharedOrganization {
  id: string;
  organizationId: string;
  organization: Organization;
}

interface Convention {
  id: string;
  name: string;
  organizationId: string;
  organization: Organization;
  status: 'ACTIVE' | 'INACTIVE' | 'EXPIRED';
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  companies: ConventionCompany[];
  sharedWithOrganizations?: SharedOrganization[];
  _count?: {
    companies: number;
    reductionRules: number;
    sharedWithOrganizations: number;
  };
}

export const ConventionsPage = () => {
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false);
  const [editingConvention, setEditingConvention] = useState<Convention | null>(null);
  const [sharingConvention, setSharingConvention] = useState<Convention | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const queryClient = useQueryClient();

  const { data: conventions, isLoading } = useQuery<Convention[]>({
    queryKey: ['conventions', includeInactive],
    queryFn: async () => {
      const { data } = await api.get(`/conventions?includeInactive=${includeInactive}`);
      return data;
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/conventions/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conventions'] });
      toast.success('Convention désactivée');
    },
    onError: () => toast.error('Erreur lors de la désactivation'),
  });

  const handleEdit = (convention: Convention) => {
    setEditingConvention(convention);
    setIsModalOpen(true);
  };

  const handleShare = (convention: Convention) => {
    setSharingConvention(convention);
    setIsShareModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingConvention(null);
  };

  const handleCloseShareModal = () => {
    setIsShareModalOpen(false);
    setSharingConvention(null);
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Conventions</h1>
            <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-semibold rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" />
              MODULE PROTÉGÉ
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Conventions exclusives par organisation cliente
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button 
            onClick={() => setIsHelpModalOpen(true)} 
            variant="outline"
            className="flex items-center gap-2 flex-1 sm:flex-none"
            title="Guide d'utilisation du partage de conventions"
          >
            <HelpCircle className="w-4 h-4" />
            Guide
          </Button>
          <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 flex-1 sm:flex-none">
            <Plus className="w-4 h-4" />
            <span className="whitespace-nowrap">Nouvelle Convention</span>
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded border-gray-300"
          />
          Afficher les conventions inactives
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {conventions?.map((convention) => (
          <div
            key={convention.id}
            className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-4 ${
              convention.isActive ? 'border-gray-200 dark:border-gray-700' : 'border-red-200 dark:border-red-900'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{convention.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{convention.organization?.name}</p>
                  {convention.status && (
                    <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${
                      convention.status === 'ACTIVE' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      convention.status === 'INACTIVE' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                      'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {convention.status === 'ACTIVE' ? 'Active' : convention.status === 'INACTIVE' ? 'Inactive' : 'Expirée'}
                    </span>
                  )}
                </div>
              </div>
              {convention.isActive ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>

            {convention.companies && convention.companies.length > 0 && (
              <div className="mb-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-1 mb-1">
                  <Building2 className="w-3 h-3 text-blue-900 dark:text-blue-200" />
                  <p className="text-xs font-semibold text-blue-900 dark:text-blue-200">Compagnies</p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {convention.companies.map((cc) => (
                    <span key={cc.companyId} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs">
                      {cc.company.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {convention.sharedWithOrganizations && convention.sharedWithOrganizations.length > 0 && (
              <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-1 mb-1">
                  <Users className="w-3 h-3 text-green-900 dark:text-green-200" />
                  <p className="text-xs font-semibold text-green-900 dark:text-green-200">
                    Partagée avec {convention.sharedWithOrganizations.length} org(s)
                  </p>
                </div>
                <div className="flex flex-wrap gap-1">
                  {convention.sharedWithOrganizations.slice(0, 3).map((shared) => (
                    <span key={shared.id} className="px-2 py-0.5 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs">
                      {shared.organization.name}
                    </span>
                  ))}
                  {convention.sharedWithOrganizations.length > 3 && (
                    <span className="px-2 py-0.5 bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 rounded text-xs">
                      +{convention.sharedWithOrganizations.length - 3}
                    </span>
                  )}
                </div>
              </div>
            )}

            {(convention.startDate || convention.endDate) && (
              <div className="mb-3 text-xs text-gray-600 dark:text-gray-400">
                {convention.startDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Début: {new Date(convention.startDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
                {convention.endDate && (
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    <span>Fin: {new Date(convention.endDate).toLocaleDateString('fr-FR')}</span>
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 mb-3 text-sm">
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Compagnies</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {convention._count?.companies || 0}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Règles</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {convention._count?.reductionRules || 0}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">Orgs</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {convention._count?.sharedWithOrganizations || 0}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleShare(convention)}
                className="flex-1 min-w-0"
                title="Partager avec d'autres organisations"
              >
                <Users className="w-3 h-3 mr-1" />
                <span className="truncate">Partager</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/admin/conventions/${convention.id}/reduction-rules`)}
                className="flex-1 min-w-0"
              >
                <Sliders className="w-3 h-3 mr-1" />
                <span className="truncate">Paliers</span>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(convention)}
              >
                <Edit className="w-3 h-3" />
              </Button>
              {convention.isActive && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deactivateMutation.mutate(convention.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {conventions?.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucune convention
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Créez une convention pour une organisation cliente
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une convention
          </Button>
        </div>
      )}

      <ConventionModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        convention={editingConvention}
      />

      <ShareOrganizationsModal
        isOpen={isShareModalOpen}
        onClose={handleCloseShareModal}
        convention={sharingConvention}
      />

      <ConventionSharingHelpModal
        isOpen={isHelpModalOpen}
        onClose={() => setIsHelpModalOpen(false)}
      />
    </div>
  );
};
