import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';

export const GestionnaireQuoteEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modificationNote, setModificationNote] = useState('');
  const [editedPrimeNette, setEditedPrimeNette] = useState<number | null>(null);
  const [editedFrais, setEditedFrais] = useState<number | null>(null);
  const [editedTaxes, setEditedTaxes] = useState<number | null>(null);

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quotes', id],
    queryFn: async () => {
      const { data } = await api.get(`/quotes/${id}`);
      setEditedPrimeNette(data.primeNette);
      setEditedFrais(data.frais);
      setEditedTaxes(data.taxes);
      return data;
    },
  });

  const validateOnlyMutation = useMutation({
    mutationFn: async () => {
      const totalAPayer = Number(editedPrimeNette || 0) + Number(editedFrais || 0) + Number(editedTaxes || 0) + Number(quote?.fpac || 0) + Number(quote?.fssr || 0) + Number(quote?.fg || 0);
      const { data } = await api.patch(`/quotes/${id}`, { 
        modificationNote: modificationNote.trim() || null,
        status: 'VALIDATED',
        primeNette: Number(editedPrimeNette),
        frais: Number(editedFrais),
        taxes: Number(editedTaxes),
        totalAPayer: totalAPayer.toFixed(2)
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Devis validé avec succès - Le client peut maintenant procéder au paiement');
      navigate('/admin/gestionnaire-validation');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la validation');
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 sm:p-6">
      <div className="flex items-center gap-3 mb-6">
        <Edit className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            Modifier le devis
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Devis N° {quote?.displayNumber ? `DEVIS-${String(quote.displayNumber).padStart(5, '0')}` : quote?.quoteNumber}
          </p>
        </div>
      </div>

      <Card className="p-4 sm:p-6 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Informations du devis
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Client:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {quote?.user?.firstName} {quote?.user?.lastName}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Email:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {quote?.user?.email}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Téléphone:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {quote?.user?.phone || 'Non renseigné'}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Compagnie:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {quote?.company.name}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Statut:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {quote?.status}
            </span>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Prime nette (DT)
            </label>
            <input
              type="number"
              step="0.01"
              value={editedPrimeNette || ''}
              onChange={(e) => setEditedPrimeNette(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Frais (DT)
            </label>
            <input
              type="number"
              step="0.01"
              value={editedFrais || ''}
              onChange={(e) => setEditedFrais(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Taxes (DT)
            </label>
            <input
              type="number"
              step="0.01"
              value={editedTaxes || ''}
              onChange={(e) => setEditedTaxes(parseFloat(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <div className="col-span-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-gray-600 dark:text-gray-400">Total TTC:</span>
            <span className="ml-2 text-xl font-bold text-blue-600 dark:text-blue-400">
              {(Number(editedPrimeNette || 0) + Number(editedFrais || 0) + Number(editedTaxes || 0) + Number(quote?.fpac || 0) + Number(quote?.fssr || 0) + Number(quote?.fg || 0)).toFixed(2)} DT
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-6 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Informations du véhicule
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-600 dark:text-gray-400">Immatriculation:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {quote?.simulation?.vehicle?.registration || 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Valeur à neuf:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {quote?.simulation?.vehicle?.newValue?.toLocaleString()} DT
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Valeur vénale:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {quote?.simulation?.vehicle?.marketValue?.toLocaleString()} DT
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Puissance fiscale:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {quote?.simulation?.vehicle?.fiscalHorsepower} CV
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Nombre de places:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {quote?.simulation?.vehicle?.numberOfSeats}
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Date 1ère mise circulation:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {quote?.simulation?.vehicle?.firstCirculationDate ? new Date(quote.simulation.vehicle.firstCirculationDate).toLocaleDateString('fr-FR') : 'N/A'}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-6 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Détail des garanties
        </h3>
        <div className="space-y-2">
          {quote?.items?.map((item: any) => {
            const getFormula = (code: string, capital: number, prime: number) => {
              const marketValue = quote?.simulation?.vehicle?.marketValue || 0;
              const newValue = quote?.simulation?.vehicle?.newValue || 0;
              
              switch(code) {
                case 'RC':
                  return 'Tarif fixe selon puissance fiscale et bonus/malus';
                case 'CAS':
                  return 'Tarif fixe: 45 DT';
                case 'VOL':
                  return `((${marketValue} × 2.36) / 1000 + 30) × taux réduction`;
                case 'INCENDIE':
                  return `((${marketValue} × 2.75) / 1000 + 30) × taux réduction`;
                case 'PERSONNES_TRANSPORTEES':
                  return `Tarif fixe selon capital: ${capital} DT`;
                case 'ASSISTANCE':
                  return 'Tarif fixe: 115 DT';
                case 'TOUS_RISQUES_ZERO':
                  return `(${newValue} × taux%) + prime fixe × taux réduction`;
                case 'DOMMAGES_COLLISIONS':
                  return `Prime de base + (${capital} × taux palier) × taux réduction`;
                case 'BG':
                  return prime === 0 ? 'Gratuit avec Tous Risques 0%' : `${capital} × 0.08`;
                case 'DOMMAGES_EMEUTES':
                  return 'Tarif fixe: 30 DT';
                case 'CATASTROPHES_NATURELLES':
                  return 'Tarif fixe: 40 DT (AMANA uniquement)';
                case 'INCENDIE_EMEUTES':
                  return 'Tarif fixe selon compagnie';
                case 'DEFENSE_RECOURS':
                  return prime === 0 ? 'Gratuit avec Tous Risques 0%' : 'Tarif fixe';
                default:
                  return 'Calcul selon règles tarifaires';
              }
            };
            
            return (
              <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {item.guarantee.nameFr}
                  </span>
                  <div className="text-right">
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Capital: {item.capital.toLocaleString()} DT
                    </div>
                    <div className="text-sm font-semibold text-gray-900 dark:text-white">
                      Prime: {item.prime.toLocaleString()} DT
                    </div>
                  </div>
                </div>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-mono mt-1">
                  {getFormula(item.guarantee.code, Number(item.capital), Number(item.prime))}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="p-4 sm:p-6 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Note explicative (optionnelle)
        </h3>
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              Cette note sera visible par le client avant validation et achat du devis.
              Expliquez les modifications apportées ou confirmez la conformité du devis.
            </p>
          </div>
        </div>
        <textarea
          value={modificationNote}
          onChange={(e) => setModificationNote(e.target.value)}
          placeholder="Exemple: Devis vérifié et conforme aux conditions de la convention. Tous les documents sont validés."
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white min-h-[120px]"
        />
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          variant="outline"
          onClick={() => navigate('/admin/gestionnaire-validation')}
          className="flex-1"
        >
          <X className="w-4 h-4 mr-2" />
          Annuler
        </Button>
        <Button
          onClick={() => validateOnlyMutation.mutate()}
          loading={validateOnlyMutation.isPending}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Valider le devis
        </Button>
      </div>

      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
          Après validation:
        </h4>
        <ul className="text-xs text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Le client recevra une notification pour procéder au paiement</li>
          <li>• Le client peut payer en ligne ou venir à l'agence</li>
          <li>• Après paiement, vous pourrez transformer le devis en contrat</li>
        </ul>
      </div>
    </div>
  );
};
