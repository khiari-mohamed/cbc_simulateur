import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Building2, Edit, Trash2, CheckCircle, XCircle, Shield } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { CompanyModal } from '../../../components/admin/CompanyModal';
import { useLanguage } from '../../../contexts/LanguageContext';
import api from '../../../lib/api/client';
import toast from 'react-hot-toast';
import type { Company } from '../../../types';

export const CompaniesPage = () => {
  const { t } = useLanguage();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const queryClient = useQueryClient();

  const { data: companies, isLoading } = useQuery({
    queryKey: ['companies', includeInactive],
    queryFn: async () => {
      const { data } = await api.get(`/companies?includeInactive=${includeInactive}`);
      return data as Company[];
    },
  });

  const deactivateMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/companies/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Compagnie désactivée');
    },
    onError: () => toast.error('Erreur lors de la désactivation'),
  });

  const reactivateMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/companies/${id}/reactivate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Compagnie réactivée');
    },
    onError: () => toast.error('Erreur lors de la réactivation'),
  });

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCompany(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">{t('admin.companies')}</h1>
            <span className="px-2 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-semibold rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" />
              MODULE PROTÉGÉ
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            {t('admin.companiesSubtitle')}
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 w-full sm:w-auto">
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">{t('admin.newCompany')}</span>
          <span className="sm:hidden">{t('common.new')}</span>
        </Button>
      </div>

      <div className="mb-4">
        <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={includeInactive}
            onChange={(e) => setIncludeInactive(e.target.checked)}
            className="rounded border-gray-300"
          />
          {t('admin.showInactive')}
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {companies?.map((company) => (
          <div
            key={company.id}
            className={`bg-white dark:bg-gray-800 rounded-lg border-2 p-4 ${
              company.isActive ? 'border-gray-200 dark:border-gray-700' : 'border-red-200 dark:border-red-900'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{company.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{company.code}</p>
                </div>
              </div>
              {company.isActive ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-red-500" />
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('admin.conventions')}</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {company.conventions?.length || 0}
                </p>
              </div>
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('admin.quotes')}</p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {company._count?.quotes || 0}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEdit(company)}
                className="flex-1"
              >
                <Edit className="w-3 h-3 mr-1" />
                Modifier
              </Button>
              {company.isActive ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => deactivateMutation.mutate(company.id)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => reactivateMutation.mutate(company.id)}
                  className="text-green-600 hover:text-green-700"
                >
                  <CheckCircle className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      {companies?.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucune compagnie
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Commencez par ajouter une compagnie d'assurance partenaire
          </p>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une compagnie
          </Button>
        </div>
      )}

      <CompanyModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        company={editingCompany}
      />
    </div>
  );
};
