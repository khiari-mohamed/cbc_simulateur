import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { FileText, Download, Printer, Check, Clock, AlertCircle, Home, MapPin } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';

interface Contract {
  id: string;
  contractNumber: string;
  status: string;
  startDate: string;
  endDate: string;
  deliveryType: string;
  deliveryFee: number;
  pdfPath?: string;
  createdAt: string;
  quote: {
    quoteNumber: string;
    totalAPayer: number;
    company: { name: string };
    items: Array<{
      guarantee: { nameFr: string };
      prime: number;
      capital: number;
    }>;
    simulation: {
      vehicle: {
        newValue: number;
        marketValue: number;
        firstCirculationDate: string;
      };
    };
  };
  user: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
}

export const ContractDetailPage = () => {
  const { contractNumber } = useParams();
  const navigate = useNavigate();

  const { data: contract, isLoading } = useQuery({
    queryKey: ['contract', contractNumber],
    queryFn: async () => {
      const { data } = await api.get(`/contracts/${contractNumber}`);
      return data as Contract;
    },
    enabled: !!contractNumber,
  });

  const handleDownloadPDF = async () => {
    if (!contract?.id) {
      toast.error('Le document PDF n\'est pas disponible');
      return;
    }
    try {
      const response = await api.get(`/contracts/${contract.id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Contrat_${contract.contractNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF téléchargé');
    } catch (error) {
      toast.error('Erreur lors du téléchargement du PDF');
    }
  };

  const handlePrint = async () => {
    if (!contract?.id) {
      toast.error('Le document n\'est pas disponible à l\'impression');
      return;
    }
    try {
      const response = await api.get(`/contracts/${contract.id}/download`, {
        responseType: 'blob',
      });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      window.URL.revokeObjectURL(url);
    } catch (error) {
      toast.error('Erreur lors de l\'impression');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
            <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 mb-3" />
            <p className="text-red-800 dark:text-red-200">Contrat non trouvé</p>
          </Card>
        </div>
      </div>
    );
  }

  const isActive = contract.status === 'ACTIVE';
  const totalWithDelivery = Number(contract.quote.totalAPayer) + Number(contract.deliveryFee);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/contracts')}
            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 mb-4 flex items-center gap-1"
          >
            ← Retour
          </button>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            {contract.contractNumber}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Devis: {contract.quote.quoteNumber} | {contract.quote.company.name}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Card */}
            <Card className={`p-6 ${
              isActive
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
            }`}>
              <div className="flex items-center gap-3">
                {isActive ? (
                  <>
                    <Check className="w-6 h-6 text-green-600 dark:text-green-400" />
                    <div>
                      <h3 className="font-semibold text-green-900 dark:text-green-200">Contrat actif</h3>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        Couverture active depuis le {new Date(contract.startDate).toLocaleDateString('fr-TN')}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <Clock className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    <div>
                      <h3 className="font-semibold text-amber-900 dark:text-amber-200">Contrat en attente</h3>
                      <p className="text-sm text-amber-700 dark:text-amber-300">
                        Statut: {contract.status}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </Card>

            {/* Contract Details */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Détails du contrat
              </h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Date de début</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {new Date(contract.startDate).toLocaleDateString('fr-TN')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Date de fin</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {new Date(contract.endDate).toLocaleDateString('fr-TN')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Mode de livraison</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    {contract.deliveryType === 'HOME_DELIVERY' ? (
                      <>
                        <Home className="w-4 h-4" />
                        Livraison à domicile
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4" />
                        Retrait à l'agence
                      </>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Frais de livraison</p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {Number(contract.deliveryFee).toFixed(3)} DT
                  </p>
                </div>
              </div>
            </Card>

            {/* Vehicle & Insured Info */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Assuré et véhicule
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                    Assuré
                  </p>
                  <div className="space-y-2">
                    <p className="text-gray-900 dark:text-white">
                      {contract.user.firstName} {contract.user.lastName}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{contract.user.email}</p>
                    {contract.user.phone && (
                      <p className="text-gray-600 dark:text-gray-400 text-sm">{contract.user.phone}</p>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
                    Véhicule assuré
                  </p>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-900 dark:text-white">
                      <strong>Valeur à neuf:</strong>{' '}
                      {Number(contract.quote.simulation.vehicle.newValue).toLocaleString('fr-TN')} DT
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      <strong>Valeur vénale:</strong>{' '}
                      {Number(contract.quote.simulation.vehicle.marketValue).toLocaleString('fr-TN')} DT
                    </p>
                    <p className="text-gray-900 dark:text-white">
                      <strong>Mise en circulation:</strong>{' '}
                      {new Date(contract.quote.simulation.vehicle.firstCirculationDate).toLocaleDateString(
                        'fr-TN',
                      )}
                    </p>
                  </div>
                </div>
              </div>
            </Card>

            {/* Guarantees */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                Garanties couvertes
              </h2>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {contract.quote.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {item.guarantee.nameFr}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Capital: {Number(item.capital).toLocaleString('fr-TN')} DT
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {Number(item.prime).toFixed(3)} DT
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Price Summary */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Récapitulatif financier
              </h3>
              <div className="space-y-3 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Prime totale</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {Number(contract.quote.totalAPayer).toFixed(3)} DT
                  </span>
                </div>
                {Number(contract.deliveryFee) > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Frais livraison</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {Number(contract.deliveryFee).toFixed(3)} DT
                    </span>
                  </div>
                )}
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Montant total payé
                </p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {totalWithDelivery.toFixed(3)} DT
                </p>
              </div>
            </Card>

            {/* Actions */}
            <Card className="p-6">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
                Actions
              </h3>
              <div className="space-y-2">
                <Button
                  onClick={handleDownloadPDF}
                  className="w-full justify-center gap-2"
                  variant="outline"
                  disabled={!contract.pdfPath}
                >
                  <Download className="w-4 h-4" />
                  Télécharger PDF
                </Button>
                <Button
                  onClick={handlePrint}
                  className="w-full justify-center gap-2"
                  variant="outline"
                  disabled={!contract.pdfPath}
                >
                  <Printer className="w-4 h-4" />
                  Imprimer
                </Button>
              </div>
            </Card>

            {/* Document */}
            {contract.pdfPath && (
              <Card className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                <div className="flex gap-2 text-blue-700 dark:text-blue-300">
                  <FileText className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">
                    Votre contrat PDF est prêt à télécharger et à imprimer
                  </p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
