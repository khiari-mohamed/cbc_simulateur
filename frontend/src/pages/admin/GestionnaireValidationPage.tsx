import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, XCircle, Eye, FileText, AlertCircle, Edit, Download } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { DocumentUpload } from '../../components/documents/DocumentUpload';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';
import { QuoteStatus } from '../../types';

export const GestionnaireValidationPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedQuote, setSelectedQuote] = useState<any>(null);
  const [showDocuments, setShowDocuments] = useState(false);
  const [viewingDocument, setViewingDocument] = useState<any>(null);
  const [documentUrl, setDocumentUrl] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showContractModal, setShowContractModal] = useState(false);

  // CDC: Gestionnaire sees SUBMITTED quotes (not VALIDATED)
  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes', 'pending'],
    queryFn: async () => {
      const { data } = await api.get('/quotes/pending');
      return data;
    },
  });

  // Also fetch VALIDATED quotes for manual contract creation
  const { data: validatedQuotes, isLoading: validatedLoading } = useQuery({
    queryKey: ['quotes', 'validated'],
    queryFn: async () => {
      const { data } = await api.get('/quotes/all/stats');
      return data.filter((q: any) => q.status === 'VALIDATED');
    },
  });

  const { data: documents } = useQuery({
    queryKey: ['documents', selectedQuote?.id],
    queryFn: async () => {
      if (!selectedQuote) return [];
      const { data } = await api.get(`/documents/quote/${selectedQuote.id}`);
      return data;
    },
    enabled: !!selectedQuote,
  });

  const validateDocumentMutation = useMutation({
    mutationFn: (docId: string) => api.post(`/documents/${docId}/validate`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documents'] });
      toast.success('Document validé');
    },
  });

  const rejectMutation = useMutation({
    mutationFn: ({ quoteId, reason }: { quoteId: string; reason: string }) =>
      api.post(`/quotes/${quoteId}/reject`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Devis rejeté avec succès');
      setShowRejectModal(false);
      setRejectReason('');
      setSelectedQuote(null);
    },
  });

  const createContractMutation = useMutation({
    mutationFn: (quoteId: string) => api.post(`/contracts/manual/${quoteId}`, { deliveryType: 'AGENCY_PICKUP' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Contrat créé avec succès - Client payé à l\'agence');
      setShowContractModal(false);
      setSelectedQuote(null);
    },
    onError: () => {
      toast.error('Erreur lors de la création du contrat');
    },
  });

  const allDocumentsValidated = documents?.every((doc: any) => doc.isValidated);
  const hasDocuments = documents && documents.length > 0;

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          Validation Gestionnaire
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
          Vérification et validation des devis soumis par les clients
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6">
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">En attente</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {quotes?.length || 0}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Validés</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {validatedQuotes?.length || 0}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="grid gap-4">
          {quotes?.map((quote: any) => (
            <Card key={quote.id} className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                      Devis N° {quote.quoteNumber}
                    </h3>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                      En attente validation
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Client: {quote.user?.firstName} {quote.user?.lastName} ({quote.user?.email})
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Compagnie: {quote.company.name}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                    Véhicule: {quote.simulation?.vehicle?.registrationNumber || 'N/A'} | V.neuf: {quote.simulation?.vehicle?.newValue?.toLocaleString()} DT | V.vénale: {quote.simulation?.vehicle?.marketValue?.toLocaleString()} DT
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {quote.totalAPayer.toLocaleString()} DT
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/admin/quotes/${quote.id}/edit`)}
                  className="w-full sm:w-auto"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSelectedQuote(quote);
                    setShowDocuments(true);
                  }}
                  className="w-full sm:w-auto"
                >
                  <Eye className="w-4 h-4 mr-2" />
                  Vérifier documents
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedQuote(quote);
                    setShowRejectModal(true);
                  }}
                  className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Rejeter
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && quotes?.length === 0 && (
        <Card className="p-8 sm:p-12 text-center">
          <FileText className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900 dark:text-white mb-2">
            Aucun devis en attente
          </h3>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Tous les devis soumis ont été traités
          </p>
        </Card>
      )}

      {/* VALIDATED QUOTES - Ready for manual contract creation */}
      {!validatedLoading && validatedQuotes && validatedQuotes.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Devis validés - En attente de paiement
          </h2>
          <div className="grid gap-4">
            {validatedQuotes.map((quote: any) => (
              <Card key={quote.id} className="p-4 sm:p-6 border-2 border-green-200 dark:border-green-800">
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">
                        Devis N° {quote.quoteNumber}
                      </h3>
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                        Validé
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Client: {quote.user?.firstName} {quote.user?.lastName} ({quote.user?.email})
                    </p>
                    <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                      Compagnie: {quote.company.name}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                      {quote.totalAPayer.toLocaleString()} DT
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedQuote(quote);
                    setShowContractModal(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Marquer comme payé à l'agence
                </Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Rejeter le devis
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Devis N° {selectedQuote.quoteNumber}
              </p>
            </div>
            <div className="p-6">
              <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
                Motif du rejet (obligatoire)
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Exemple: Documents non conformes, informations manquantes, etc."
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white min-h-[120px]"
              />
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-3 mt-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-orange-800 dark:text-orange-200">
                    Le client recevra une notification avec ce motif de rejet.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectReason('');
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  if (!rejectReason.trim()) {
                    toast.error('Le motif du rejet est obligatoire');
                    return;
                  }
                  rejectMutation.mutate({ quoteId: selectedQuote.id, reason: rejectReason });
                }}
                loading={rejectMutation.isPending}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                Confirmer le rejet
              </Button>
            </div>
          </div>
        </div>
      )}

      {showDocuments && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
                Validation technique - Devis N° {selectedQuote.quoteNumber}
              </h2>
            </div>
            
            <div className="p-4 sm:p-6 space-y-6">
              <div>
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">
                  Informations client
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedQuote.user?.firstName} {selectedQuote.user?.lastName}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedQuote.user?.email}
                </p>
              </div>

              <DocumentUpload quoteId={selectedQuote.id} readonly />

              {documents && documents.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Actions sur les documents
                  </h3>
                  {documents.map((doc: any) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <span className="text-sm text-gray-900 dark:text-white flex-1">
                        {doc.fileName}
                      </span>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              const response = await api.get(`/documents/${doc.id}/view`, { responseType: 'blob' });
                              const url = window.URL.createObjectURL(response.data);
                              setDocumentUrl(url);
                              setViewingDocument(doc);
                            } catch (error) {
                              toast.error('Erreur lors de l\'ouverture du document');
                            }
                          }}
                          className="border-blue-600 text-blue-600 hover:bg-blue-50"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          Voir
                        </Button>
                        {!doc.isValidated && (
                          <Button
                            size="sm"
                            onClick={() => validateDocumentMutation.mutate(doc.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Valider
                          </Button>
                        )}
                        {doc.isValidated && (
                          <span className="text-xs text-green-600 flex items-center gap-1 px-3">
                            <CheckCircle className="w-4 h-4" />
                            Validé
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!hasDocuments && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      Aucun document téléchargé. Demandez au client de fournir les documents requis.
                    </p>
                  </div>
                </div>
              )}

              {hasDocuments && !allDocumentsValidated && (
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-orange-600" />
                    <p className="text-sm text-orange-800 dark:text-orange-200">
                      Tous les documents doivent être validés avant de pouvoir modifier le devis.
                    </p>
                  </div>
                </div>
              )}

              {allDocumentsValidated && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <p className="text-sm text-green-800 dark:text-green-200">
                      Tous les documents sont validés. Vous pouvez modifier et valider le devis.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowDocuments(false);
                  setSelectedQuote(null);
                }}
                className="flex-1"
              >
                Fermer
              </Button>
              <Button
                onClick={() => navigate(`/admin/quotes/${selectedQuote.id}/edit`)}
                disabled={!allDocumentsValidated}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Edit className="w-4 h-4 mr-2" />
                Modifier et valider
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Document Viewer Modal */}
      {viewingDocument && documentUrl && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-5xl w-full max-h-[95vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                {viewingDocument.fileName}
              </h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  window.URL.revokeObjectURL(documentUrl);
                  setDocumentUrl('');
                  setViewingDocument(null);
                }}
              >
                Fermer
              </Button>
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

      {/* Contract Creation Confirmation Modal */}
      {showContractModal && selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Confirmer le paiement
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Devis N° {selectedQuote.quoteNumber}
              </p>
            </div>
            <div className="p-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-2">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      Le client a payé à l'agence
                    </p>
                    <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                      Cette action va créer le contrat et notifier le client.
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Client:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {selectedQuote.user?.firstName} {selectedQuote.user?.lastName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Montant:</span>
                  <span className="font-bold text-green-600 dark:text-green-400">
                    {selectedQuote.totalAPayer.toLocaleString()} DT
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Livraison:</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    Retrait à l'agence (gratuit)
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  setShowContractModal(false);
                  setSelectedQuote(null);
                }}
                className="flex-1"
              >
                Annuler
              </Button>
              <Button
                onClick={() => createContractMutation.mutate(selectedQuote.id)}
                loading={createContractMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                Confirmer le paiement
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
