import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { CreditCard, Truck, MapPin, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';

interface Quote {
  id: string;
  quoteNumber: string;
  totalAPayer: number;
  simulation: {
    vehicle: {
      newValue: number;
      marketValue: number;
      firstCirculationDate: string;
    };
  };
  company: {
    name: string;
  };
  items: Array<{
    guarantee: { nameFr: string };
    prime: number;
  }>;
}

type DeliveryType = 'HOME_DELIVERY' | 'AGENCY_PICKUP';

export const PaymentCheckoutPage = () => {
  const { quoteId } = useParams();
  const navigate = useNavigate();

  const [deliveryType, setDeliveryType] = useState<DeliveryType>('AGENCY_PICKUP');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [paymentInProgress, setPaymentInProgress] = useState(false);

  // Fetch quote details
  const { data: quote, isLoading: quoteLoading } = useQuery({
    queryKey: ['quote', quoteId],
    queryFn: async () => {
      const { data } = await api.get(`/quotes/${quoteId}`);
      return data as Quote;
    },
    enabled: !!quoteId,
  });

  // Initialize payment mutation
  const initializePaymentMutation = useMutation({
    mutationFn: async (data: { quoteId: string; deliveryType: DeliveryType }) => {
      const { data: response } = await api.post('/payments/init', data);
      return response;
    },
    onSuccess: (response) => {
      // Redirect to Paymee payment gateway
      if (response.paymeeUrl) {
        window.location.href = response.paymeeUrl;
      } else {
        toast.error('Impossible d\'accéder à la passerelle de paiement');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de l\'initialisation du paiement');
      setPaymentInProgress(false);
    },
  });

  const handlePayment = async () => {
    if (!agreedToTerms) {
      toast.error('Veuillez accepter les conditions');
      return;
    }

    if (!quoteId) {
      toast.error('Devis non trouvé');
      return;
    }

    setPaymentInProgress(true);
    initializePaymentMutation.mutate({
      quoteId,
      deliveryType,
    });
  };

  if (quoteLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!quote) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 mb-3" />
            <p className="text-red-800 dark:text-red-200">Devis non trouvé</p>
          </Card>
        </div>
      </div>
    );
  }

  const deliveryFee = deliveryType === 'HOME_DELIVERY' ? 10 : 0;
  const totalWithDelivery = Number(quote.totalAPayer) + deliveryFee;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            Finalisation de votre devis
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Devis n° {quote.quoteNumber} - {quote.company.name}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quote Summary Card */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Récapitulatif du devis
              </h2>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Valeur à neuf</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {Number(quote.simulation.vehicle.newValue).toLocaleString('fr-TN')} DT
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Valeur vénale</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {Number(quote.simulation.vehicle.marketValue).toLocaleString('fr-TN')} DT
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Mise en circulation</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {new Date(quote.simulation.vehicle.firstCirculationDate).toLocaleDateString('fr-TN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Assureur</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {quote.company.name}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                    Garanties sélectionnées:
                  </p>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {quote.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700 dark:text-gray-300">
                          {item.guarantee.nameFr}
                        </span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {Number(item.prime).toFixed(3)} DT
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>

            {/* Delivery Options */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Mode de livraison
              </h2>
              <div className="space-y-3">
                {/* Agency Pickup */}
                <label className="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400"
                       style={{
                         borderColor: deliveryType === 'AGENCY_PICKUP' ? '#3b82f6' : undefined,
                       }}>
                  <input
                    type="radio"
                    name="delivery"
                    value="AGENCY_PICKUP"
                    checked={deliveryType === 'AGENCY_PICKUP'}
                    onChange={(e) => setDeliveryType(e.target.value as DeliveryType)}
                    className="w-4 h-4"
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">Retrait à l'agence</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Gratuit</p>
                  </div>
                  <MapPin className="w-5 h-5 text-gray-400" />
                </label>

                {/* Home Delivery */}
                <label className="flex items-center p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg cursor-pointer hover:border-blue-500 dark:hover:border-blue-400"
                       style={{
                         borderColor: deliveryType === 'HOME_DELIVERY' ? '#3b82f6' : undefined,
                       }}>
                  <input
                    type="radio"
                    name="delivery"
                    value="HOME_DELIVERY"
                    checked={deliveryType === 'HOME_DELIVERY'}
                    onChange={(e) => setDeliveryType(e.target.value as DeliveryType)}
                    className="w-4 h-4"
                  />
                  <div className="ml-3 flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">Livraison à domicile</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Frais supplémentaires</p>
                  </div>
                  <Clock className="w-5 h-5 text-gray-400" />
                </label>
              </div>
            </Card>

            {/* Terms & Conditions */}
            <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 mt-1"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Conditions d'acceptation
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Je confirme que les informations fournies sont exactes et que j'accepte les
                    conditions générales de la police d'assurance.
                  </p>
                </div>
              </label>
            </Card>
          </div>

          {/* Sidebar - Summary */}
          <div className="space-y-6">
            {/* Price Summary */}
            <Card className="p-6 sticky top-8">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Résumé du paiement
              </h3>
              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Prime nette</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {Number(quote.totalAPayer).toFixed(3)} DT
                  </span>
                </div>
                {deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Frais livraison</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {deliveryFee.toFixed(3)} DT
                    </span>
                  </div>
                )}
              </div>

              {/* Total */}
              <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Total à payer</p>
                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {totalWithDelivery.toFixed(3)} DT
                </p>
              </div>

              {/* Payment Info */}
              <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <div className="flex gap-2">
                  <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-200">
                      Paiement sécurisé
                    </p>
                    <p className="text-xs text-amber-700 dark:text-amber-300 mt-1">
                      Via Paymee - Passerelle de paiement tunisienne
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button
                onClick={handlePayment}
                disabled={!agreedToTerms || paymentInProgress || initializePaymentMutation.isPending}
                className="w-full"
                size="lg"
              >
                {paymentInProgress || initializePaymentMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Redirection vers le paiement...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Procéder au paiement
                  </>
                )}
              </Button>

              {/* Back Link */}
              <button
                onClick={() => navigate(`/quotes/${quoteId}`)}
                className="w-full mt-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white text-sm font-medium"
              >
                Retour au devis
              </button>
            </Card>

            {/* Security Badge */}
            <Card className="p-4 text-center">
              <div className="flex justify-center mb-2">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400">
                Vos données sont protégées par le chiffrement SSL 256-bit
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
