import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, XCircle, Eye, FileText } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DocumentUpload } from '../../components/documents/DocumentUpload';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';
import { QuoteStatus } from '../../types';

export const ValidationPage = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [filter, setFilter] = useState<QuoteStatus | 'ALL'>('ALL');

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes', 'all', filter],
    queryFn: async () => {
      const { data } = await api.get('/quotes/all/stats');
      return filter === 'ALL' ? data : data.filter((q: any) => q.status === filter);
    },
  });

  const validateMutation = useMutation({
    mutationFn: (quoteId: string) => api.post(`/quotes/${quoteId}/validate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success(t('toast.validated'));
      setSelectedQuote(null);
    },
    onError: () => toast.error(t('toast.error')),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ quoteId, reason }: { quoteId: string; reason: string }) =>
      api.post(`/quotes/${quoteId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success(t('toast.rejected'));
      setSelectedQuote(null);
    },
    onError: () => toast.error(t('toast.error')),
  });

  const createContractMutation = useMutation({
    mutationFn: ({ quoteId, deliveryType }: { quoteId: string; deliveryType?: string }) => 
      api.post(`/contracts/manual/${quoteId}`, { deliveryType }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Contrat créé avec succès');
    },
    onError: () => toast.error(t('toast.error')),
  });

  const getStatusBadge = (status: QuoteStatus) => {
    const styles = {
      [QuoteStatus.GENERATED]: 'bg-gray-100 text-gray-800',
      [QuoteStatus.SUBMITTED]: 'bg-blue-100 text-blue-800',
      [QuoteStatus.VALIDATED]: 'bg-green-100 text-green-800',
      [QuoteStatus.REJECTED]: 'bg-red-100 text-red-800',
      [QuoteStatus.TRANSFORMED_TO_CONTRACT]: 'bg-purple-100 text-purple-800',
    };
    return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>{status}</span>;
  };

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('validation.title')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          {t('validation.subtitle')}
        </p>
      </div>

      <Card className="mb-6 p-4">
        <div className="flex gap-2">
          {['ALL', QuoteStatus.SUBMITTED, QuoteStatus.VALIDATED, QuoteStatus.REJECTED].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s as any)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === s
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {s === 'ALL' ? t('common.all') : s}
            </button>
          ))}
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : quotes && quotes.length > 0 ? (
        <div className="grid gap-4">
          {quotes?.map((quote: any) => (
            <Card key={quote.id} className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {t('quote.number')} {quote.quoteNumber}
                    </h3>
                    {getStatusBadge(quote.status)}
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('quote.client')}: {quote.user?.firstName} {quote.user?.lastName} ({quote.user?.email})
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('quote.company')}: {quote.company.name}
                  </p>
                  {quote.validatedBy && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Validé par: {quote.validatedBy.firstName} {quote.validatedBy.lastName} 
                      <span className="ml-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                        {quote.validatedBy.role === 'ADMINISTRATEUR_ARS' ? 'ADMIN' : 'GESTIONNAIRE'}
                      </span>
                      {quote.validatedAt && (
                        <span className="ml-2">
                          le {new Date(quote.validatedAt).toLocaleDateString('fr-FR')} à {new Date(quote.validatedAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {quote.totalAPayer.toLocaleString()} DT
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(quote.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500 block">{t('quote.netPremium')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {quote.primeNette.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">{t('quote.taxes')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {quote.taxes.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">{t('quote.fees')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {quote.frais.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">{t('quote.guarantees')}</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {quote.items?.length || 0}
                  </span>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedQuote(quote)}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  {t('quote.details')}
                </Button>
                {quote.status === QuoteStatus.SUBMITTED && (
                  <>
                    <Button
                      size="sm"
                      onClick={() => validateMutation.mutate(quote.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      {t('quote.validate')}
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => {
                        const reason = prompt('Raison du rejet:');
                        if (reason) rejectMutation.mutate({ quoteId: quote.id, reason });
                      }}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      {t('quote.reject')}
                    </Button>
                  </>
                )}
                {quote.status === QuoteStatus.VALIDATED && (
                  <Button
                    size="sm"
                    onClick={() => {
                      if (confirm('Marquer ce devis comme contrat validé et payé ?')) {
                        createContractMutation.mutate({ quoteId: quote.id, deliveryType: 'AGENCY_PICKUP' });
                      }
                    }}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Marquer comme payé
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">Aucun devis à afficher</p>
        </Card>
      )}

      {selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                {t('quote.details')} - {t('quote.number')} {selectedQuote.quoteNumber}
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{t('validation.clientInfo')}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedQuote.user?.firstName} {selectedQuote.user?.lastName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">{selectedQuote.user?.email}</p>
              </div>
              <DocumentUpload quoteId={selectedQuote.id} readonly />
              
              <div>
                <h3 className="font-semibold mb-2">{t('validation.guaranteesIncluded')}</h3>
                <div className="space-y-2">
                  {selectedQuote.items?.map((item: any) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.guarantee.nameFr}</span>
                      <span className="font-medium">{item.prime.toLocaleString()} DT</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700">
              <Button variant="outline" onClick={() => setSelectedQuote(null)} className="w-full">
                {t('common.close')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
