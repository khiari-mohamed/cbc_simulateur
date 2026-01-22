import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { FileText, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';
import type { SimulationData } from '../../pages/simulations/NewSimulationPage';
import type { Quote } from '../../types';

interface QuoteGenerationStepProps {
  simulationData: SimulationData;
  onSimulationCreated: (simulationId: string) => void;
  onBack: () => void;
}

export const QuoteGenerationStep = ({
  simulationData,
  onSimulationCreated,
  onBack,
}: QuoteGenerationStepProps) => {
  const [simulationId, setSimulationId] = useState<string | null>(null);
  const [quotes, setQuotes] = useState<Quote[]>([]);

  const createSimulationMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        ...simulationData,
        vehicle: {
          ...simulationData.vehicle,
          fiscalHorsepower: parseInt(String(simulationData.vehicle.fiscalHorsepower)),
          numberOfSeats: parseInt(String(simulationData.vehicle.numberOfSeats)),
          newValue: parseFloat(String(simulationData.vehicle.newValue)),
          marketValue: parseFloat(String(simulationData.vehicle.marketValue)),
        },
        bonusMalus: parseFloat(String(simulationData.bonusMalus)),
      };
      const { data } = await api.post('/simulations', payload);
      return data;
    },
    onSuccess: (simulation) => {
      setSimulationId(simulation.id);
      localStorage.setItem('simulationId', simulation.id);
      toast.success('Simulation créée avec succès');
      generateQuotesMutation.mutate(simulation.id);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    },
  });

  const { data: companies } = useQuery({
    queryKey: ['companies', 'active'],
    queryFn: async () => {
      const { data } = await api.get('/companies');
      return data.filter((c: any) => c.isActive);
    },
  });

  const generateQuotesMutation = useMutation({
    mutationFn: async (simId: string) => {
      if (!companies || companies.length === 0) {
        throw new Error('Aucune compagnie disponible');
      }
      
      const quotePromises = companies.map((company: any) =>
        api.post('/quotes/generate', { simulationId: simId, companyId: company.id })
          .then(res => {
            console.log('Quote generated for', company.name, res.data);
            return res.data;
          })
          .catch((err) => {
            console.error('Failed to generate quote for', company.name, err.response?.data || err.message);
            return null;
          })
      );
      
      const results = await Promise.all(quotePromises);
      return results.filter(q => q !== null);
    },
    onSuccess: (generatedQuotes) => {
      setQuotes(generatedQuotes);
      toast.success(`${generatedQuotes.length} devis générés`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la génération des devis');
    },
  });

  const handleGenerate = () => {
    createSimulationMutation.mutate();
  };

  const handleContinue = () => {
    if (simulationId) {
      onSimulationCreated(simulationId);
    }
  };

  const isGenerating = createSimulationMutation.isPending || generateQuotesMutation.isPending;
  const isComplete = quotes.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Génération des devis
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Calcul automatique selon les conventions disponibles
          </p>
        </div>
      </div>

      {!simulationId && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
            Récapitulatif de votre simulation
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Puissance fiscale</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {simulationData.vehicle.fiscalHorsepower} CV
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Nombre de places</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {simulationData.vehicle.numberOfSeats}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Valeur à neuf</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {simulationData.vehicle.newValue.toLocaleString()} DT
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Valeur vénale</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {simulationData.vehicle.marketValue.toLocaleString()} DT
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Bonus/Malus</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {simulationData.bonusMalus}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Usage</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {simulationData.usage}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Formule</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {simulationData.formulaType.replace(/_/g, ' ')}
              </span>
            </div>
            {simulationData.selectedGuarantees.length > 0 && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Garanties optionnelles</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {simulationData.selectedGuarantees.length}
                </span>
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-3">
            <Button variant="outline" onClick={onBack} className="flex-1">
              Modifier
            </Button>
            <Button
              onClick={handleGenerate}
              loading={isGenerating}
              className="flex-1"
            >
              Générer les devis
            </Button>
          </div>
        </div>
      )}

      {isGenerating && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Loader2 className="w-6 h-6 text-blue-600 dark:text-blue-400 animate-spin" />
            <div>
              <p className="font-medium text-blue-900 dark:text-blue-100">
                Génération en cours...
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Calcul des primes selon les conventions disponibles
              </p>
            </div>
          </div>
        </div>
      )}

      {isComplete && (
        <div className="space-y-4">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-medium text-green-900 dark:text-green-100">
                  Devis générés avec succès !
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {quotes.length} devis disponibles pour comparaison
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            {quotes.map((quote) => (
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
                      Devis N° {quote.quoteNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {quote.totalAPayer.toLocaleString()} DT
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">TTC</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Prime nette</span>
                    <span className="text-gray-900 dark:text-white">
                      {quote.primeNette.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Taxes</span>
                    <span className="text-gray-900 dark:text-white">
                      {quote.taxes.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Button onClick={handleContinue} className="w-full">
            Continuer vers la confirmation
          </Button>
        </div>
      )}
    </div>
  );
};
