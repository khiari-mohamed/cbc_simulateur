import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import api from '../../lib/api/client';

export const PaymentSuccessPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const paymentId = searchParams.get('paymentId');
  const quoteId = searchParams.get('quoteId');
  const flouciPaymentId = searchParams.get('payment_id'); // Get Flouci payment ID from URL
  const [verificationAttempted, setVerificationAttempted] = useState(false);

  const { data: payment, isLoading, refetch } = useQuery({
    queryKey: ['payment', paymentId],
    queryFn: async () => {
      if (!paymentId) return null;
      const { data } = await api.get(`/payments/${paymentId}/status`);
      return data;
    },
    enabled: !!paymentId,
    refetchInterval: (query) => {
      // Stop polling if payment is confirmed as PAID
      if (query.state.data?.status === 'PAID') return false;
      // Poll every 2 seconds for up to 30 seconds
      return 2000;
    },
    refetchIntervalInBackground: true,
  });

  // Attempt to verify payment with Flouci API if still pending after 5 seconds
  useEffect(() => {
    if (!verificationAttempted && payment && payment.status === 'PENDING' && paymentId && flouciPaymentId) {
      const timer = setTimeout(async () => {
        try {
          console.log('🔍 Attempting to verify payment with Flouci API...');
          console.log('   Payment ID:', paymentId);
          console.log('   Flouci Payment ID:', flouciPaymentId);
          
          await api.post(`/payments/${paymentId}/verify-with-flouci`, {
            flouciPaymentId: flouciPaymentId,
          });
          
          setVerificationAttempted(true);
          // Refetch payment status after verification
          refetch();
        } catch (error) {
          console.error('Failed to verify payment:', error);
        }
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [payment, paymentId, flouciPaymentId, verificationAttempted, refetch]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="text-center p-8">
          <Loader className="w-16 h-16 mx-auto mb-4 text-blue-600 animate-spin" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Traitement du paiement
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Veuillez patienter, nous vérifions votre paiement...
          </p>
        </Card>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="text-center p-8">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-600" />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Paiement non trouvé
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Nous n'avons pas pu localiser votre paiement
          </p>
          <Button onClick={() => navigate('/quotes')} className="bg-red-600 hover:bg-red-700">
            Retour aux devis
          </Button>
        </Card>
      </div>
    );
  }

  const isPaid = payment.status === 'PAID';

  return (
    <div className={`min-h-screen bg-gradient-to-br ${
      isPaid 
        ? 'from-green-50 to-blue-50 dark:from-gray-900 dark:to-gray-800' 
        : 'from-orange-50 to-red-50 dark:from-gray-900 dark:to-gray-800'
    } py-12 px-4`}>
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          {isPaid ? (
            <>
              <div className="mb-6">
                <div className="inline-block">
                  <CheckCircle className="w-20 h-20 text-green-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Paiement réussi!
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Votre paiement a été confirmé avec succès.
              </p>
              
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 mb-8 text-left">
                <h3 className="font-semibold text-green-900 dark:text-green-200 mb-4">
                  Prochaines étapes:
                </h3>
                <ul className="space-y-3 text-green-800 dark:text-green-300">
                  <li className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-sm font-bold flex-shrink-0">
                      1
                    </span>
                    <span>Votre contrat d'assurance est désormais actif</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-sm font-bold flex-shrink-0">
                      2
                    </span>
                    <span>Vous recevrez vos documents contractuels selon le mode de livraison choisi</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-600 text-white text-sm font-bold flex-shrink-0">
                      3
                    </span>
                    <span>Un email de confirmation a été envoyé à votre adresse</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => navigate('/contracts')}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Voir mes contrats
                </Button>
                <Button 
                  onClick={() => navigate('/quotes')}
                  variant="outline"
                  className="w-full"
                >
                  Retour aux devis
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="mb-6">
                <div className="inline-block">
                  <AlertCircle className="w-20 h-20 text-orange-600" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Paiement en attente
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Votre paiement n'a pas encore été confirmé. Veuillez patienter ou réessayer.
              </p>
              
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-6 mb-8">
                <p className="text-orange-800 dark:text-orange-300 text-sm">
                  <strong>Statut:</strong> {payment.status}
                </p>
              </div>

              <div className="space-y-3">
                <Button 
                  onClick={() => window.location.reload()}
                  className="w-full bg-orange-600 hover:bg-orange-700"
                >
                  Vérifier le statut
                </Button>
                <Button 
                  onClick={() => navigate(`/quotes/${quoteId}`)}
                  variant="outline"
                  className="w-full"
                >
                  Retour au devis
                </Button>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
};
