import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FileCheck, Download, Calendar, Building2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';
import { ContractStatus } from '../../types';

export const ContractsPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { data: contracts, isLoading } = useQuery({
    queryKey: ['contracts'],
    queryFn: async () => {
      const { data } = await api.get('/contracts');
      return data;
    },
  });

  const getStatusBadge = (status: ContractStatus) => {
    const styles = {
      [ContractStatus.ACTIVE]: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      [ContractStatus.SUSPENDED]: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
      [ContractStatus.CANCELLED]: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      [ContractStatus.EXPIRED]: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
    };

    const labels = {
      [ContractStatus.ACTIVE]: 'Actif',
      [ContractStatus.SUSPENDED]: 'Suspendu',
      [ContractStatus.CANCELLED]: 'Annulé',
      [ContractStatus.EXPIRED]: 'Expiré',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const downloadContract = async (contractId: string) => {
    try {
      const { data } = await api.get(`/contracts/${contractId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `contrat-${contractId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Contrat téléchargé');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('contracts.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('contracts.subtitle')}
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : contracts && contracts.length > 0 ? (
        <div className="grid gap-4">
          {contracts.map((contract: any) => (
            <div
              key={contract.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      Contrat N° {contract.contractNumber}
                    </h3>
                    {getStatusBadge(contract.status)}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-4 h-4" />
                      {contract.quote?.company?.name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(contract.startDate).toLocaleDateString('fr-FR')} - {new Date(contract.endDate).toLocaleDateString('fr-FR')}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Prime annuelle</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {contract.quote?.totalAPayer?.toLocaleString()} DT
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/contracts/${contract.contractNumber}`)}
                  className="flex items-center gap-2"
                >
                  <FileCheck className="w-4 h-4" />
                  Voir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => downloadContract(contract.id)}
                  className="flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Télécharger PDF
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
          <FileCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            {t('contracts.none')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {t('contracts.noneDesc')}
          </p>
          <Button 
            onClick={() => {
              localStorage.removeItem('simulationStep');
              localStorage.removeItem('simulationData');
              localStorage.removeItem('simulationId');
              navigate('/simulations/new');
            }} 
            className="mx-auto"
          >
            {t('simulations.create')}
          </Button>
        </div>
      )}
    </div>
  );
};
