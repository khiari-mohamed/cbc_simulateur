import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Calendar, Building2, GitCompare } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';
import { QuoteStatus } from '../../types';

export const QuotesPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      const { data } = await api.get('/quotes');
      return data;
    },
  });

  const toggleQuoteSelection = (quoteId: string) => {
    setSelectedQuotes(prev =>
      prev.includes(quoteId)
        ? prev.filter(id => id !== quoteId)
        : [...prev, quoteId]
    );
  };

  const handleCompare = () => {
    if (selectedQuotes.length < 2) {
      toast.error('Sélectionnez au moins 2 devis pour comparer');
      return;
    }
    navigate(`/quotes/compare?ids=${selectedQuotes.join(',')}`);
  };

  const getStatusBadge = (status: QuoteStatus) => {
    const styles = {
      [QuoteStatus.GENERATED]: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
      [QuoteStatus.SUBMITTED]: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      [QuoteStatus.VALIDATED]: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      [QuoteStatus.REJECTED]: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      [QuoteStatus.TRANSFORMED_TO_CONTRACT]: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
    };

    const labels = {
      [QuoteStatus.GENERATED]: 'Généré',
      [QuoteStatus.SUBMITTED]: 'Soumis',
      [QuoteStatus.VALIDATED]: 'Validé',
      [QuoteStatus.REJECTED]: 'Rejeté',
      [QuoteStatus.TRANSFORMED_TO_CONTRACT]: 'Contrat',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const downloadQuote = async (quoteId: string) => {
    try {
      const { data } = await api.get(`/quotes/${quoteId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `devis-${quoteId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Devis téléchargé');
    } catch (error) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  return (
    <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t('quotes.title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              {t('quotes.subtitle')}
            </p>
          </div>
          {selectedQuotes.length > 0 && (
            <Button onClick={handleCompare} className="flex items-center gap-2 w-full sm:w-auto">
              <GitCompare className="w-5 h-5" />
              {t('quotes.compare')} ({selectedQuotes.length})
            </Button>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : quotes && quotes.length > 0 ? (
          <div className="grid gap-4">
            {quotes.map((quote: any) => (
              <div
                key={quote.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border-2 p-6 transition-all ${
                  selectedQuotes.includes(quote.id)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={selectedQuotes.includes(quote.id)}
                    onChange={() => toggleQuoteSelection(quote.id)}
                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Devis N° {quote.quoteNumber}
                          </h3>
                          {getStatusBadge(quote.status)}
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <Building2 className="w-4 h-4" />
                            {quote.company.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(quote.createdAt).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        {quote.simulation?.vehicle && (
                          <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400 mt-2">
                            <span>VN: {quote.simulation.vehicle.newValue.toLocaleString()} DT</span>
                            <span>VV: {quote.simulation.vehicle.marketValue.toLocaleString()} DT</span>
                            <span>CV: {quote.simulation.vehicle.fiscalHorsepower}</span>
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total TTC</p>
                        <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {quote.totalAPayer.toLocaleString()} DT
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Prime nette</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {quote.primeNette.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Frais</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {quote.frais.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Taxes</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {quote.taxes.toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">FPAC + FSSR + FG</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {(quote.fpac + quote.fssr + quote.fg).toLocaleString()}
                        </p>
                      </div>
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadQuote(quote.id)}
                          className="w-full flex items-center justify-center gap-2"
                        >
                          <Download className="w-4 h-4" />
                          PDF
                        </Button>
                      </div>
                    </div>

                    {quote.items && quote.items.length > 0 && (
                      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Garanties incluses
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {quote.items
                            .filter((item: any) => {
                              // Hide TR and DC lines for STANDARD formula
                              if (quote.simulation?.formulaType === 'STANDARD') {
                                return item.guarantee.code !== 'TOUS_RISQUES_0' && item.guarantee.code !== 'DOMMAGES_COLLISIONS';
                              }
                              return true;
                            })
                            .map((item: any) => (
                            <span
                              key={item.id}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                            >
                              {item.guarantee.nameFr}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {quote.status === QuoteStatus.REJECTED && quote.rejectionReason && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-xs font-medium text-red-900 dark:text-red-100 mb-1">
                          ⚠️ Motif de rejet :
                        </p>
                        <p className="text-sm text-red-800 dark:text-red-200">
                          {quote.rejectionReason}
                        </p>
                      </div>
                    )}

                    {quote.modificationNote && (
                      <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">
                          📝 Note du gestionnaire :
                        </p>
                        <p className="text-sm text-blue-800 dark:text-blue-200">
                          {quote.modificationNote}
                        </p>
                      </div>
                    )}

                    {quote.status === QuoteStatus.VALIDATED && (
                      <div className="mt-4">
                        <Button
                          onClick={() => navigate(`/quotes/${quote.id}/checkout`)}
                          className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                          </svg>
                          Acheter ce devis
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('quotes.none')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('quotes.noneDesc')}
            </p>
            <Button onClick={() => navigate('/simulations/new')} className="mx-auto">
              {t('simulations.create')}
            </Button>
          </div>
        )}
    </div>
  );
};
