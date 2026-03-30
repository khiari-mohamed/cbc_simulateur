import { useState } from 'react';
import { useMutation, } from '@tanstack/react-query';
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

  // Companies will be injected via coverage step selection; fallback to all active if none provided
  const generateQuotesMutation = useMutation({
    mutationFn: async (simId: string) => {
      // Read selected companies from localStorage written by CoverageSelectionStep via simulationData if present
      const selection = JSON.parse(localStorage.getItem('simulationData') || '{}');
      const companyIds: string[] = selection.companyIds && selection.companyIds.length ? selection.companyIds : [];
      
      if (!companyIds || companyIds.length === 0) {
        throw new Error('Veuillez sélectionner au moins une compagnie');
      }

      const quotePromises = companyIds.map((companyId: string) =>
        api.post('/quotes/generate', { simulationId: simId, companyId })
          .then(res => res.data)
          .catch((err) => {
            // Return error as null to continue, we will display individual errors via toast
            toast.error(err.response?.data?.message || 'Erreur lors de la génération');
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
            {simulationData.vehicle.registration && (
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Immatriculation</span>
                <span className="font-medium text-blue-600 dark:text-blue-400">
                  {simulationData.vehicle.registration}
                </span>
              </div>
            )}
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
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Fractionnement</span>
              <span className="font-medium text-gray-900 dark:text-white">
                {simulationData.fractionnement === 'SEMESTRIEL' ? 'Semestriel' : 'Annuel'}
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
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">
                      {quote.company.name}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Devis N° {quote.displayNumber ? `DEVIS-${String(quote.displayNumber).padStart(5, '0')}` : quote.quoteNumber}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {quote.totalAPayer.toLocaleString()} DT
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {simulationData.fractionnement === 'SEMESTRIEL' ? 'TTC / semestre' : 'TTC / an'}
                    </p>
                  </div>
                </div>

                {/* Detailed Breakdown */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mb-3">
                  <h5 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Détail des garanties
                  </h5>
                  <div className="space-y-1.5">
                    {quote.items && quote.items
                      .filter((item: any) => {
                        // For Lloyd, hide individual CAT NAT and Dommages Émeutes (shown combined below)
                        if (quote.company.code === 'LLOYD') {
                          const hasBoth = quote.items?.some((i: any) => i.guarantee.code === 'CATASTROPHES_NATURELLES') &&
                                         quote.items?.some((i: any) => i.guarantee.code === 'DOMMAGES_EMEUTES');
                          if (hasBoth && (item.guarantee.code === 'CATASTROPHES_NATURELLES' || item.guarantee.code === 'DOMMAGES_EMEUTES')) {
                            return false;
                          }
                        }
                        return true;
                      })
                      .map((item: any) => (
                        <div key={item.id} className="flex justify-between text-xs">
                          <span className="text-gray-600 dark:text-gray-400">
                            {item.guarantee.nameFr}
                          </span>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {parseFloat(item.prime).toLocaleString()} DT
                          </span>
                        </div>
                      ))}
                    
                    {/* Company-specific guarantee display */}
                    {quote.company.code === 'AMANA' && (
                      <>
                        {/* Incendie Suite Émeutes - always NC for AMANA */}
                        {!quote.items?.some((i: any) => i.guarantee.code === 'INCENDIE_EMEUTES') && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">
                              Incendie suite émeutes
                            </span>
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              ❌ Non accordée
                            </span>
                          </div>
                        )}
                        
                        {/* CAT NAT - NC if not Tous Risques */}
                        {simulationData.formulaType !== 'TOUS_RISQUES_0' && 
                         !quote.items?.some((i: any) => i.guarantee.code === 'CATASTROPHES_NATURELLES') && (
                          <div className="flex justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">
                              Dommages suite CAT NAT
                            </span>
                            <span className="text-red-600 dark:text-red-400 font-medium">
                              ❌ Non accordée (Tous Risques uniquement)
                            </span>
                          </div>
                        )}
                      </>
                    )}
                    
                    {/* Lloyd: Show combined CAT NAT + Dommages Émeutes if both present */}
                    {quote.company.code === 'LLOYD' && (() => {
                      const hasCatNat = quote.items?.some((i: any) => i.guarantee.code === 'CATASTROPHES_NATURELLES');
                      const hasDommagesEmeutes = quote.items?.some((i: any) => i.guarantee.code === 'DOMMAGES_EMEUTES');
                      
                      if (hasCatNat && hasDommagesEmeutes) {
                        const catNatItem = quote.items?.find((i: any) => i.guarantee.code === 'CATASTROPHES_NATURELLES');
                        const dommagesItem = quote.items?.find((i: any) => i.guarantee.code === 'DOMMAGES_EMEUTES');
                        const combinedPrime = (parseFloat(String(catNatItem?.prime || 0)) + parseFloat(String(dommagesItem?.prime || 0)));
                        
                        return (
                          <div className="flex justify-between text-xs bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                            <span className="text-gray-600 dark:text-gray-400">
                              Extension Catastrophes Naturelles
                              <span className="block text-[10px] text-gray-500">
                                (CAT NAT + Dommages émeutes)
                              </span>
                            </span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {combinedPrime.toLocaleString()} DT
                            </span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>

                {/* Totals */}
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Prime nette</span>
                    <span className="text-gray-900 dark:text-white font-medium">
                      {quote.primeNette.toLocaleString()} DT
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">Frais</span>
                    <span className="text-gray-900 dark:text-white">
                      {quote.frais.toLocaleString()} DT
                    </span>
                  </div>
                  <div className="flex justify-between text-xs bg-amber-50 dark:bg-amber-900/20 px-2 py-1.5 rounded">
                    <span className="text-amber-700 dark:text-amber-400 font-semibold">Taxes</span>
                    <span className="text-amber-900 dark:text-amber-300 font-bold">
                      {quote.taxes.toLocaleString()} DT
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600 dark:text-gray-400">F.P.A.C + F.S.S.R + F.G</span>
                    <span className="text-gray-900 dark:text-white">
                      {(Number(quote.fpac) + Number(quote.fssr) + Number(quote.fg)).toFixed(2)} DT
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
