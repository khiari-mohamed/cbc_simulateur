import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Download, Send, Trash2, RefreshCw } from 'lucide-react';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';
import { SimulationStatus } from '../../types';

export const SimulationDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: simulation, isLoading } = useQuery({
    queryKey: ['simulations', id],
    queryFn: async () => {
      const { data } = await api.get(`/simulations/${id}`);
      return data;
    },
    enabled: !!id,
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/simulations/${id}/submit`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations', id] });
      toast.success('Simulation soumise pour validation');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la soumission');
    },
  });

  const recalculateMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.post(`/simulations/${id}/recalculate`);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['simulations', id] });
      toast.success('Simulation recalculée');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors du recalcul');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/simulations/${id}`);
    },
    onSuccess: () => {
      toast.success('Simulation supprimée');
      navigate('/simulations');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la suppression');
    },
  });

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

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </MainLayout>
    );
  }

  if (!simulation) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Simulation non trouvée</p>
        </div>
      </MainLayout>
    );
  }

  const isDraft = simulation.status === SimulationStatus.DRAFT;

  return (
    <MainLayout>
      <div className="max-w-5xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate('/simulations')}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux simulations
        </Button>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Simulation {simulation.vehicle.registration || 'sans immatriculation'}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Créée le {new Date(simulation.createdAt).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <span
              className={`px-3 py-1 text-sm font-medium rounded-full ${
                simulation.status === SimulationStatus.DRAFT
                  ? 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                  : simulation.status === SimulationStatus.SUBMITTED
                  ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                  : simulation.status === SimulationStatus.APPROVED
                  ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200'
                  : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
              }`}
            >
              {simulation.status}
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Puissance fiscale</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {simulation.vehicle.fiscalHorsepower} CV
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Nombre de places</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {simulation.vehicle.numberOfSeats}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valeur à neuf</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {simulation.vehicle.newValue.toLocaleString()} DT
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Valeur vénale</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {simulation.vehicle.marketValue.toLocaleString()} DT
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Bonus/Malus</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {simulation.bonusMalus}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Usage</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {simulation.usage}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Formule</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {simulation.formulaType.replace(/_/g, ' ')}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">1ère circulation</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {new Date(simulation.vehicle.firstCirculationDate).toLocaleDateString('fr-FR')}
              </p>
            </div>
          </div>

          {simulation.guarantees && simulation.guarantees.length > 0 && (
            <div className="mb-6">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                Garanties optionnelles sélectionnées
              </h3>
              <div className="flex flex-wrap gap-2">
                {simulation.guarantees.map((sg: any) => (
                  <span
                    key={sg.id}
                    className="px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-sm"
                  >
                    {sg.guarantee.nameFr}
                  </span>
                ))}
              </div>
            </div>
          )}

          {isDraft && (
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => recalculateMutation.mutate()}
                loading={recalculateMutation.isPending}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Recalculer
              </Button>
              <Button
                onClick={() => submitMutation.mutate()}
                loading={submitMutation.isPending}
                className="flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Soumettre pour validation
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  if (confirm('Êtes-vous sûr de vouloir supprimer cette simulation ?')) {
                    deleteMutation.mutate();
                  }
                }}
                loading={deleteMutation.isPending}
                className="flex items-center gap-2 ml-auto text-red-600 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
                Supprimer
              </Button>
            </div>
          )}
        </div>

        {simulation.quotes && simulation.quotes.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Devis générés ({simulation.quotes.length})
            </h2>
            <div className="grid gap-4">
              {simulation.quotes.map((quote: any) => (
                <div
                  key={quote.id}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {quote.company.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Devis N° {quote.quoteNumber}
                      </p>
                      {quote.status === 'REJECTED' && quote.rejectionReason && (
                        <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                          <p className="text-sm font-medium text-red-800 dark:text-red-200 mb-1">
                            Motif du rejet :
                          </p>
                          <p className="text-sm text-red-700 dark:text-red-300">
                            {quote.rejectionReason}
                          </p>
                        </div>
                      )}
                      {quote.modificationNote && (
                        <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-1">
                            Note du gestionnaire :
                          </p>
                          <p className="text-sm text-blue-700 dark:text-blue-300">
                            {quote.modificationNote}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                        {quote.totalAPayer.toLocaleString()} DT
                      </p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">TTC</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Prime nette</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {quote.primeNette.toLocaleString()} DT
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Taxes</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {quote.taxes.toLocaleString()} DT
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Frais</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {quote.frais.toLocaleString()} DT
                      </p>
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
          </div>
        )}
      </div>
    </MainLayout>
  );
};
