import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { CheckCircle, Download, Send, Eye } from 'lucide-react';
import { Button } from '../ui/Button';
import { DocumentUpload } from '../documents/DocumentUpload';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';

interface ConfirmationStepProps {
  simulationId: string;
  onBack: () => void;
}

export const ConfirmationStep = ({ simulationId, onBack }: ConfirmationStepProps) => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const { data: simulation, isLoading } = useQuery({
    queryKey: ['simulations', simulationId],
    queryFn: async () => {
      const { data } = await api.get(`/simulations/${simulationId}`);
      return data;
    },
  });

  const { data: documents } = useQuery({
    queryKey: ['documents', simulation?.quotes?.[0]?.id],
    queryFn: async () => {
      if (!simulation?.quotes?.[0]?.id) return [];
      const { data } = await api.get(`/documents/quote/${simulation.quotes[0].id}`);
      return data;
    },
    enabled: !!simulation?.quotes?.[0]?.id,
  });

  // Determine required documents based on customer type
  const requiredDocs = ['CARTE_GRISE', 'CIN']; // Per CDC notes: only these 2 are mandatory
  const uploadedTypes = documents?.map((d: any) => d.type) || [];
  const missingDocs = requiredDocs.filter(type => !uploadedTypes.includes(type));
  const canSubmit = missingDocs.length === 0;

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!simulation?.quotes || simulation.quotes.length === 0) throw new Error('No quotes found');
      // Submit all quotes
      const promises = simulation.quotes.map((quote: any) => 
        api.post(`/quotes/${quote.id}/submit`)
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['simulations'] });
      toast.success('Devis soumis pour validation');
      // Clear simulation data from localStorage
      localStorage.removeItem('simulationStep');
      localStorage.removeItem('simulationData');
      localStorage.removeItem('simulationId');
      navigate('/quotes');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la soumission');
    },
  });

  useEffect(() => {
    if (simulation?.quotes?.[0]) {
      loadPdfPreview(simulation.quotes[0].id);
    }
  }, [simulation]);

  const loadPdfPreview = async (quoteId: string) => {
    try {
      const { data } = await api.get(`/quotes/${quoteId}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([data], { type: 'application/pdf' }));
      setPdfUrl(url);
    } catch (error: any) {
      console.error('Error loading PDF preview:', error);
    }
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
    } catch (error: any) {
      toast.error('Erreur lors du téléchargement');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
          <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Confirmation et soumission
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vérifiez vos devis et soumettez pour validation ARS
          </p>
        </div>
      </div>

      {simulation?.quotes && simulation.quotes.length > 0 && (
        <>
          {pdfUrl && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Aperçu du devis
                </h3>
              </div>
              <iframe
                src={pdfUrl}
                className="w-full h-[600px] border border-gray-300 dark:border-gray-600 rounded"
                title="Aperçu du devis"
              />
            </div>
          )}

          <div className="space-y-3">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Vos devis ({simulation.quotes.length})
            </h3>
          {simulation.quotes.map((quote: any) => (
            <div
              key={quote.id}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    {quote.company.name}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    N° {quote.displayNumber ? `DEVIS-${String(quote.displayNumber).padStart(5, '0')}` : quote.quoteNumber}
                  </p>
                  {simulation.vehicle && (
                    <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {simulation.vehicle.registration && (
                        <span className="font-semibold text-blue-600 dark:text-blue-400">Immat: {simulation.vehicle.registration}</span>
                      )}
                      <span>VN: {simulation.vehicle.newValue.toLocaleString()} DT</span>
                      <span>VV: {simulation.vehicle.marketValue.toLocaleString()} DT</span>
                      <span>CV: {simulation.vehicle.fiscalHorsepower}</span>
                      {quote.eligibilitySnapshot && (
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          Âge: {quote.eligibilitySnapshot.vehicleAge} an(s)
                          {quote.eligibilitySnapshot.ruleApplied && (
                            <span className="text-green-600 dark:text-green-400 ml-1">
                              (✓ &lt; {quote.eligibilitySnapshot.maxAgeYears} ans)
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {quote.totalAPayer.toLocaleString()} DT
                  </p>
                  <span className="inline-block px-2 py-1 text-xs rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    {quote.status}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block">Prime nette</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {quote.primeNette.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block">Taxes</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {quote.taxes.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600 dark:text-gray-400 block">Frais</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {quote.frais.toLocaleString()}
                  </span>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => downloadQuote(quote.id)}
                className="w-full flex items-center justify-center gap-2"
              >
                <Download className="w-4 h-4" />
                Télécharger le PDF
              </Button>
            </div>
          ))}
          </div>

          {simulation.quotes[0] && (
            <DocumentUpload quoteId={simulation.quotes[0].id} />
          )}
        </>
      )}

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          ⚠️ <strong>Important :</strong> En soumettant cette simulation, vous acceptez que l'équipe ARS 
          vérifie votre dossier et vous contacte pour les documents nécessaires (carte grise, permis, CIN).
        </p>
      </div>

      {!canSubmit && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">
            ⚠️ <strong>Documents manquants :</strong> Vous devez télécharger tous les documents obligatoires avant de soumettre.
          </p>
          <ul className="list-disc list-inside mt-2 text-xs text-red-700 dark:text-red-300">
            {missingDocs.map(doc => (
              <li key={doc}>{doc.replace('_', ' ')}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex-1"
        >
          Retour
        </Button>
        <Button
          onClick={() => submitMutation.mutate()}
          loading={submitMutation.isPending}
          disabled={!canSubmit}
          className="flex-1 flex items-center justify-center gap-2"
        >
          <Send className="w-4 h-4" />
          Confirmer et soumettre
        </Button>
      </div>
    </div>
  );
};
