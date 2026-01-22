import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { Edit, Save, X, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';

export const GestionnaireQuoteEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [modificationNote, setModificationNote] = useState('');
  const [deliveryType, setDeliveryType] = useState('AGENCY_PICKUP');

  const { data: quote, isLoading } = useQuery({
    queryKey: ['quotes', id],
    queryFn: async () => {
      const { data } = await api.get(`/quotes/${id}`);
      return data;
    },
  });

  // CDC: Gestionnaire validates and marks as paid, creating contract
  const validateAndCreateContractMutation = useMutation({
    mutationFn: async () => {
      if (!modificationNote.trim()) {
        throw new Error('Note explicative requise');
      }
      // First validate the quote with note and status
      await api.patch(`/quotes/${id}`, { 
        modificationNote,
        status: 'VALIDATED'
      });
      // Then create contract
      const { data } = await api.post('/contracts', { quoteId: id, deliveryType });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      queryClient.invalidateQueries({ queryKey: ['contracts'] });
      toast.success('Devis validé et contrat créé avec succès');
      navigate('/admin/gestionnaire-validation');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Erreur lors de la validation');
    },
  });

  const validateOnlyMutation = useMutation({
    mutationFn: async () => {
      if (!modificationNote.trim()) {
        throw new Error('Note explicative requise');
      }
      const { data } = await api.patch(`/quotes/${id}`, { 
        modificationNote,
        status: 'VALIDATED'
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['quotes'] });
      toast.success('Devis validé avec succès');
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
            Devis N° {quote?.quoteNumber}
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
          <div>
            <span className="text-gray-600 dark:text-gray-400">Prime nette:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {quote?.primeNette.toLocaleString()} DT
            </span>
          </div>
          <div>
            <span className="text-gray-600 dark:text-gray-400">Total TTC:</span>
            <span className="ml-2 font-medium text-gray-900 dark:text-white">
              {quote?.totalAPayer.toLocaleString()} DT
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
              {quote?.simulation?.vehicle?.registrationNumber || 'N/A'}
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
              {quote?.simulation?.vehicle?.fiscalPower} CV
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
              {quote?.simulation?.vehicle?.firstRegistrationDate ? new Date(quote.simulation.vehicle.firstRegistrationDate).toLocaleDateString('fr-FR') : 'N/A'}
            </span>
          </div>
        </div>
      </Card>

      <Card className="p-4 sm:p-6 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Détail des garanties
        </h3>
        <div className="space-y-2">
          {quote?.items?.map((item: any) => (
            <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
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
          ))}
        </div>
      </Card>

      <Card className="p-4 sm:p-6 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Options de livraison
        </h3>
        <div className="space-y-3">
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
            <input
              type="radio"
              value="AGENCY_PICKUP"
              checked={deliveryType === 'AGENCY_PICKUP'}
              onChange={(e) => setDeliveryType(e.target.value)}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">Récupération à l'agence</div>
              <div className="text-sm text-green-600 dark:text-green-400">Gratuit</div>
            </div>
          </label>
          <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
            <input
              type="radio"
              value="HOME_DELIVERY"
              checked={deliveryType === 'HOME_DELIVERY'}
              onChange={(e) => setDeliveryType(e.target.value)}
              className="mr-3"
            />
            <div className="flex-1">
              <div className="font-medium text-gray-900 dark:text-white">Livraison à domicile</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">10 DT</div>
            </div>
          </label>
        </div>
      </Card>

      <Card className="p-4 sm:p-6 mb-6">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Note explicative (obligatoire)
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
          required
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
          className="flex-1 bg-blue-600 hover:bg-blue-700"
        >
          <Save className="w-4 h-4 mr-2" />
          Valider le devis
        </Button>
        <Button
          onClick={() => validateAndCreateContractMutation.mutate()}
          loading={validateAndCreateContractMutation.isPending}
          className="flex-1 bg-green-600 hover:bg-green-700"
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Valider et créer contrat
        </Button>
      </div>

      <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
          Workflow Gestionnaire:
        </h4>
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
          <li>• <strong>Valider le devis:</strong> Le client pourra ensuite acheter le contrat lui-même</li>
          <li>• <strong>Valider et créer contrat:</strong> Le client s'est présenté à l'agence et a payé</li>
        </ul>
      </div>
    </div>
  );
};
