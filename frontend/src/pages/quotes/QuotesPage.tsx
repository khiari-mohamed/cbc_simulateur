import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FileText, Download, Calendar, Building2, GitCompare, ChevronLeft, ChevronRight, History } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';
import { QuoteStatus } from '../../types';

export const QuotesPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [selectedQuotes, setSelectedQuotes] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCV, setSelectedCV] = useState<string>('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const itemsPerPage = 20;

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      const { data } = await api.get('/quotes');
      // Group quotes by simulationId to detect if any quote from same simulation is already transformed
      const quotesWithSimulationStatus = data.map((quote: any) => {
        const hasSiblingContract = data.some(
          (q: any) => 
            q.simulationId === quote.simulationId && 
            q.id !== quote.id && 
            q.status === QuoteStatus.TRANSFORMED_TO_CONTRACT
        );
        return { ...quote, hasSiblingContract };
      });
      return quotesWithSimulationStatus;
    },
  });

  const transformedQuotes = quotes?.filter((q: any) => q.status === QuoteStatus.TRANSFORMED_TO_CONTRACT) || [];

  // Filter quotes by date range and CV and exclude TRANSFORMED_TO_CONTRACT
  const filteredQuotes = quotes?.filter((quote: any) => {
    // Exclude quotes that have been transformed to contracts
    if (quote.status === QuoteStatus.TRANSFORMED_TO_CONTRACT) {
      return false;
    }
    
    // Date filter
    let dateMatch = true;
    if (startDate || endDate) {
      const quoteNumber = quote.quoteNumber;
      const timestampStr = quoteNumber.substring(5, 18);
      const quoteTimestamp = parseInt(timestampStr);
      const quoteDate = new Date(quoteTimestamp);
      
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateMatch = quoteDate >= start && quoteDate <= end;
      } else if (startDate) {
        const start = new Date(startDate);
        dateMatch = quoteDate >= start;
      } else if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        dateMatch = quoteDate <= end;
      }
    }
    
    // CV filter
    let cvMatch = true;
    if (selectedCV) {
      const vehicleCV = quote.simulation?.vehicle?.fiscalHorsepower;
      if (vehicleCV) {
        if (selectedCV === '4') cvMatch = vehicleCV <= 4;
        else if (selectedCV === '5-6') cvMatch = vehicleCV >= 5 && vehicleCV <= 6;
        else if (selectedCV === '7-10') cvMatch = vehicleCV >= 7 && vehicleCV <= 10;
        else if (selectedCV === '11-14') cvMatch = vehicleCV >= 11 && vehicleCV <= 14;
        else if (selectedCV === '15+') cvMatch = vehicleCV >= 15;
      }
    }
    
    return dateMatch && cvMatch;
  }) || [];

  // Pagination
  const totalPages = Math.ceil(filteredQuotes.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedQuotes = filteredQuotes.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleDateFilter = () => {
    setCurrentPage(1);
  };

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
          <div className="flex gap-2">
            {transformedQuotes.length > 0 && (
              <Button
                variant="outline"
                onClick={() => setShowHistoryModal(true)}
                className="flex items-center gap-2"
              >
                <History className="w-5 h-5" />
                Historique ({transformedQuotes.length})
              </Button>
            )}
            {selectedQuotes.length > 0 && (
              <Button onClick={handleCompare} className="flex items-center gap-2 w-full sm:w-auto">
                <GitCompare className="w-5 h-5" />
                {t('quotes.compare')} ({selectedQuotes.length})
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date de début
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  handleDateFilter();
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date de fin
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  handleDateFilter();
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Classe (CV)
              </label>
              <select
                value={selectedCV}
                onChange={(e) => {
                  setSelectedCV(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Toutes les classes</option>
                <option value="4">≤ 4 CV</option>
                <option value="5-6">5 à 6 CV</option>
                <option value="7-10">7 à 10 CV</option>
                <option value="11-14">11 à 14 CV</option>
                <option value="15+">≥ 15 CV</option>
              </select>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                setSelectedCV('');
                setCurrentPage(1);
              }}
            >
              Réinitialiser
            </Button>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            {filteredQuotes.length} devis trouvé{filteredQuotes.length > 1 ? 's' : ''}
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : quotes && quotes.length > 0 ? (
          <>
            <div className="grid gap-4">
              {paginatedQuotes.map((quote: any) => (
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
                            Devis N° {quote.displayNumber ? `DEVIS-${String(quote.displayNumber).padStart(5, '0')}` : quote.quoteNumber}
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
                            {quote.simulation.vehicle.registration && (
                              <span className="font-semibold text-blue-600 dark:text-blue-400">Immat: {quote.simulation.vehicle.registration}</span>
                            )}
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
                            .map((item: any) => {
                              const isNotCovered = item.isNotCovered || false;
                              return (
                            <span
                              key={item.id}
                              className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
                            >
                              {item.guarantee.nameFr}
                              {isNotCovered && (
                                <span className="ml-1 text-red-600 dark:text-red-400 font-bold">
                                  (NON ACCORDÉE)
                                </span>
                              )}
                            </span>
                          );}
                          )}
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

                    {quote.effectiveDate && (quote.status === QuoteStatus.VALIDATED || quote.status === QuoteStatus.SUBMITTED) && (
                      <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                        <p className="text-xs font-medium text-green-900 dark:text-green-100 mb-1">
                          📅 Date d'effet du contrat :
                        </p>
                        <p className="text-sm font-semibold text-green-800 dark:text-green-200">
                          {new Date(quote.effectiveDate).toLocaleDateString('fr-FR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                          {quote.status === QuoteStatus.SUBMITTED ? 'En attente de validation gestionnaire' : 'Date validée par le gestionnaire'}
                        </p>
                      </div>
                    )}

                    {quote.status === QuoteStatus.VALIDATED && (
                      <div className="mt-4">
                        {quote.hasSiblingContract ? (
                          <div className="p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                            <p className="text-sm text-orange-800 dark:text-orange-200">
                              ⚠️ Un autre devis de cette simulation a déjà été transformé en contrat. Vous ne pouvez pas acheter ce devis.
                            </p>
                          </div>
                        ) : (
                          <Button
                            onClick={() => navigate(`/quotes/${quote.id}/checkout`)}
                            className="w-full bg-green-600 hover:bg-green-700 flex items-center justify-center gap-2"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                            </svg>
                            Acheter ce devis
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Page {currentPage} sur {totalPages} ({filteredQuotes.length} devis)
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Précédent
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-1"
                  >
                    Suivant
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
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

        {/* History Modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <History className="w-6 h-6" />
                  Historique - Devis transformés en contrats
                </h2>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  ✕
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {transformedQuotes.map((quote: any) => (
                    <div
                      key={quote.id}
                      className="bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 p-4"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              Devis N° {quote.displayNumber ? `DEVIS-${String(quote.displayNumber).padStart(5, '0')}` : quote.quoteNumber}
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
                              {quote.simulation.vehicle.registration && (
                                <span className="font-semibold">Immat: {quote.simulation.vehicle.registration}</span>
                              )}
                              <span>VN: {quote.simulation.vehicle.newValue.toLocaleString()} DT</span>
                              <span>VV: {quote.simulation.vehicle.marketValue.toLocaleString()} DT</span>
                              <span>CV: {quote.simulation.vehicle.fiscalHorsepower}</span>
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total TTC</p>
                          <p className="text-xl font-bold text-gray-600 dark:text-gray-400">
                            {quote.totalAPayer.toLocaleString()} DT
                          </p>
                        </div>
                      </div>
                      <div className="pt-3 border-t border-gray-300 dark:border-gray-600">
                        <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                          ✓ Ce devis a été transformé en contrat
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
    </div>
  );
};
