import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FileCheck, Download, Calendar, Building2, FileText, Eye, X, User } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';
import { ContractStatus } from '../../types';

export const ContractsPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  const [documentUrl, setDocumentUrl] = useState<string>('');

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

  const downloadDocument = async (docId: string, fileName: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const { data } = await api.get(`/documents/${docId}/view?token=${token}`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Document téléchargé');
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
        <>
          <div className="grid gap-4">
            {contracts.map((contract: any) => (
              <ContractCard
                key={contract.id}
                contract={contract}
                getStatusBadge={getStatusBadge}
                downloadContract={downloadContract}
                navigate={navigate}
                setViewingDocument={setViewingDocument}
                setDocumentUrl={setDocumentUrl}
              />
            ))}
          </div>

          {viewingDocument && documentUrl && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {viewingDocument.fileName}
                  </h2>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadDocument(viewingDocument.id, viewingDocument.fileName)}
                      className="flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.URL.revokeObjectURL(documentUrl);
                        setDocumentUrl('');
                        setViewingDocument(null);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 overflow-auto p-4 bg-gray-100 dark:bg-gray-900">
                  {viewingDocument.fileName.toLowerCase().endsWith('.pdf') ? (
                    <iframe
                      src={documentUrl}
                      className="w-full h-full min-h-[600px] border-0"
                      title={viewingDocument.fileName}
                    />
                  ) : (
                    <img
                      src={documentUrl}
                      alt={viewingDocument.fileName}
                      className="max-w-full h-auto mx-auto"
                    />
                  )}
                </div>
              </div>
            </div>
          )}
        </>
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

const ContractCard = ({ contract, getStatusBadge, downloadContract, navigate, setViewingDocument, setDocumentUrl }: any) => {
  const { data: documents } = useQuery({
    queryKey: ['contract-documents', contract.quoteId],
    queryFn: async () => {
      const { data } = await api.get(`/documents/quote/${contract.quoteId}`);
      return data.filter((doc: any) => doc.type === 'CONTRACT_DOCUMENT');
    },
  });

  const openDocument = async (doc: any) => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await api.get(`/documents/${doc.id}/view?token=${token}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(response.data);
      setDocumentUrl(url);
      setViewingDocument(doc);
    } catch (error) {
      toast.error('Erreur lors de l\'ouverture du document');
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Contrat N° {contract.contractNumber}
            </h3>
            {getStatusBadge(contract.status)}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Building2 className="w-4 h-4" />
              <span>{contract.quote?.company?.name}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Calendar className="w-4 h-4" />
              <span>{new Date(contract.startDate).toLocaleDateString('fr-FR')} - {new Date(contract.endDate).toLocaleDateString('fr-FR')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <User className="w-4 h-4" />
              <span>{contract.user?.firstName} {contract.user?.lastName}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <FileText className="w-4 h-4" />
              <span>Devis: {contract.quote?.displayNumber ? `DEVIS-${String(contract.quote.displayNumber).padStart(5, '0')}` : contract.quote?.quoteNumber}</span>
            </div>
            {contract.quote?.simulation?.vehicle?.registration && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Immatriculation: {contract.quote.simulation.vehicle.registration}
              </p>
            )}
            {contract.quittanceNumber && (
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Quittance: {contract.quittanceNumber}
              </p>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Prime annuelle</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {contract.quote?.totalAPayer?.toLocaleString()} DT
          </p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(`/contracts/${contract.contractNumber}`)}
          className="flex items-center gap-2"
        >
          <FileCheck className="w-4 h-4" />
          Voir détails
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

      {documents && documents.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Documents du contrat ({documents.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {documents.map((doc: any) => (
              <Button
                key={doc.id}
                variant="outline"
                size="sm"
                onClick={() => openDocument(doc)}
                className="flex items-center gap-2 border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900"
              >
                <Eye className="w-4 h-4" />
                {doc.fileName}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
