import { useNavigate } from 'react-router-dom';
import { XCircle, HelpCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

export const PaymentCancelPage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card className="p-8 text-center">
          <div className="mb-6">
            <div className="inline-block">
              <XCircle className="w-20 h-20 text-red-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Paiement annulé
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Votre paiement a été annulé. Aucun montant n'a été débité.
          </p>
          
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-8 text-left">
            <div className="flex gap-3 mb-4">
              <HelpCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900 dark:text-red-200 mb-2">
                  Ce que vous pouvez faire:
                </h3>
                <ul className="space-y-2 text-red-800 dark:text-red-300 text-sm">
                  <li>• Vérifiez votre solde bancaire et votre plafond de carte</li>
                  <li>• Assurez-vous que vos données de paiement sont correctes</li>
                  <li>• Réessayez le paiement avec une autre carte si nécessaire</li>
                  <li>• Contactez votre banque en cas de problème</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
            <p className="text-blue-900 dark:text-blue-200 text-sm">
              <strong>Besoin d'aide?</strong> Contactez notre support client pour plus d'informations.
            </p>
          </div>

          <div className="space-y-3">
            <Button 
              onClick={() => navigate(-1)}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              Réessayer le paiement
            </Button>
            <Button 
              onClick={() => navigate('/quotes')}
              variant="outline"
              className="w-full"
            >
              Retour aux devis
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
