import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { FileCheck, Clock, CheckCircle, XCircle, AlertCircle, History, Calendar, Building2 } from 'lucide-react';
import api from '../../lib/api/client';
import { Link } from 'react-router-dom';

export const GestionnaireDashboard = () => {
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const { data: stats } = useQuery({
    queryKey: ['gestionnaire-stats'],
    queryFn: async () => {
      // Use the same pending quotes data to ensure consistency
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { data: allQuotes } = await api.get('/quotes/all/stats');
      
      // Count by status - adjust based on your actual status values
      const pending = allQuotes.filter((q: any) => 
        q.status === 'PENDING' || q.status === 'SUBMITTED' || q.status === 'GENERATED'
      ).length;
      
      const validatedToday = allQuotes.filter((q: any) => {
        if (q.status !== 'VALIDATED' && q.status !== 'TRANSFORMED_TO_CONTRACT') return false;
        const updatedDate = new Date(q.updatedAt);
        updatedDate.setHours(0, 0, 0, 0);
        return updatedDate.getTime() === today.getTime();
      }).length;
      
      const rejectedToday = allQuotes.filter((q: any) => {
        if (q.status !== 'REJECTED') return false;
        const updatedDate = new Date(q.updatedAt);
        updatedDate.setHours(0, 0, 0, 0);
        return updatedDate.getTime() === today.getTime();
      }).length;
      
      // Total traités = validated + rejected + transformed (all processed)
      const total = allQuotes.filter((q: any) => 
        q.status === 'VALIDATED' || q.status === 'REJECTED' || q.status === 'TRANSFORMED_TO_CONTRACT'
      ).length;
      
      return { pending, validatedToday, rejected: rejectedToday, total };
    },
  });

  const { data: processedQuotes } = useQuery({
    queryKey: ['processed-quotes'],
    queryFn: async () => {
      const { data } = await api.get('/quotes/all/stats');
      return data.filter((q: any) => 
        q.status === 'VALIDATED' || q.status === 'REJECTED' || q.status === 'TRANSFORMED_TO_CONTRACT'
      );
    },
  });

  const { data: pendingQuotes } = useQuery({
    queryKey: ['pending-quotes'],
    queryFn: async () => {
      const { data } = await api.get('/quotes/all/stats');
      return data.filter((q: any) => 
        q.status === 'PENDING' || q.status === 'SUBMITTED' || q.status === 'GENERATED'
      );
    },
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      VALIDATED: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      REJECTED: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
      TRANSFORMED_TO_CONTRACT: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
    };
    const labels: Record<string, string> = {
      VALIDATED: 'Validé',
      REJECTED: 'Rejeté',
      TRANSFORMED_TO_CONTRACT: 'Contrat',
    };
    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
        {labels[status] || status}
      </span>
    );
  };

  return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Tableau de bord Gestionnaire
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Vérification et validation des devis soumis par les clients
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-orange-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  En attente validation
                </p>
                <p className="text-3xl font-bold text-orange-600">
                  {stats?.pending || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Devis à traiter
                </p>
              </div>
              <Clock className="w-12 h-12 text-orange-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-green-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Validés aujourd'hui
                </p>
                <p className="text-3xl font-bold text-green-600">
                  {stats?.validatedToday || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Prêts pour achat
                </p>
              </div>
              <CheckCircle className="w-12 h-12 text-green-500 opacity-20" />
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-red-500 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Rejetés
                </p>
                <p className="text-3xl font-bold text-red-600">
                  {stats?.rejected || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Avec motif
                </p>
              </div>
              <XCircle className="w-12 h-12 text-red-500 opacity-20" />
            </div>
          </div>

          <button
            onClick={() => setShowHistoryModal(true)}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border-l-4 border-blue-500 p-6 hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Total traités
                </p>
                <p className="text-3xl font-bold text-blue-600">
                  {stats?.total || 0}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Tous statuts
                </p>
              </div>
              <FileCheck className="w-12 h-12 text-blue-500 opacity-20" />
            </div>
          </button>
        </div>

        {/* Alert if pending quotes */}
        {pendingQuotes && pendingQuotes.length > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 mb-8">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-orange-600 dark:text-orange-400 mt-0.5 mr-3 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-orange-800 dark:text-orange-200 mb-1">
                  Action requise
                </h3>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  {pendingQuotes.length} devis en attente de validation. Les clients attendent votre vérification.
                </p>
              </div>
              <Link
                to="/admin/gestionnaire-validation"
                className="ml-4 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white text-sm font-medium rounded-lg transition-colors flex-shrink-0"
              >
                Traiter maintenant
              </Link>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link
            to="/admin/gestionnaire-validation"
            className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg shadow-lg p-6 transition-all transform hover:scale-105"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold mb-2">Valider les devis</h3>
                <p className="text-orange-100 text-sm mb-3">
                  Vérifier documents et conformité
                </p>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-semibold">
                    {stats?.pending || 0} en attente
                  </span>
                </div>
              </div>
              <Clock className="w-16 h-16 opacity-30" />
            </div>
          </Link>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              Mes responsabilités
            </h3>
            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400">
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Vérifier les documents justificatifs (CIN, Permis, Carte grise, Vignette, Visite technique)</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Valider la conformité des devis selon la politique de souscription</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Modifier les devis avec notes explicatives si nécessaire</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                <span>Changer le statut en "Validé" ou "Refusé" avec motif</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Pending Quotes List */}
        {pendingQuotes && pendingQuotes.length > 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="w-6 h-6 text-orange-600" />
                Devis en attente de validation ({pendingQuotes.length})
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Cliquez sur un devis pour vérifier les documents et valider
              </p>
            </div>
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {pendingQuotes.map((quote: any) => (
                <Link
                  key={quote.id}
                  to={`/admin/quotes/${quote.id}/edit`}
                  className="block p-6 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          Devis N° {quote.quoteNumber}
                        </p>
                        <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 text-xs font-medium rounded-full">
                          En attente
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 dark:text-gray-400">
                        <div>
                          <span className="font-medium">Compagnie:</span> {quote.company?.name}
                        </div>
                        <div>
                          <span className="font-medium">Montant:</span> {quote.totalAPayer} DT
                        </div>
                        <div>
                          <span className="font-medium">Date:</span> {new Date(quote.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                        <div>
                          <span className="font-medium">Client:</span> {quote.simulation?.user?.email}
                        </div>
                      </div>
                    </div>
                    <div className="ml-4">
                      <span className="text-blue-600 dark:text-blue-400 font-medium text-sm">
                        Vérifier →
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Aucun devis en attente
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Tous les devis ont été traités. Vous serez notifié lors de nouvelles soumissions.
            </p>
          </div>
        )}

        {/* History Modal */}
        {showHistoryModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <History className="w-6 h-6" />
                  Historique des devis traités
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
                  {processedQuotes && processedQuotes.length > 0 ? (
                    processedQuotes.map((quote: any) => (
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
                                {new Date(quote.updatedAt).toLocaleDateString('fr-FR')}
                              </span>
                            </div>
                            {quote.user && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Client: {quote.user.firstName} {quote.user.lastName}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Montant</p>
                            <p className="text-xl font-bold text-gray-600 dark:text-gray-400">
                              {quote.totalAPayer.toLocaleString()} DT
                            </p>
                          </div>
                        </div>
                        {quote.rejectionReason && (
                          <div className="pt-3 border-t border-gray-300 dark:border-gray-600">
                            <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">
                              Motif de rejet:
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">
                              {quote.rejectionReason}
                            </p>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                      Aucun devis traité
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
};
