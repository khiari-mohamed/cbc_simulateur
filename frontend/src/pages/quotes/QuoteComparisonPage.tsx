import { useQuery } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/layout/MainLayout';
import { Button } from '../../components/ui/Button';
import { ArrowLeft, Download, Check, X } from 'lucide-react';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';

export const QuoteComparisonPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const quoteIds = searchParams.get('ids')?.split(',') || [];

  const { data: quotes, isLoading } = useQuery({
    queryKey: ['quotes', 'comparison', quoteIds],
    queryFn: async () => {
      const promises = quoteIds.map(id => api.get(`/quotes/${id}`).then(res => res.data));
      return Promise.all(promises);
    },
    enabled: quoteIds.length > 0,
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

  if (!quotes || quotes.length === 0) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Aucun devis à comparer</p>
          <Button onClick={() => navigate('/quotes')} className="mt-4">
            Retour aux devis
          </Button>
        </div>
      </MainLayout>
    );
  }

  const allGuarantees = Array.from(
    new Set(
      quotes.flatMap((q: any) => {
        return q.items
          ?.filter((item: any) => {
            // Hide TR and DC for STANDARD formula
            if (q.simulation?.formulaType === 'STANDARD') {
              return item.guarantee.code !== 'TOUS_RISQUES_0' && item.guarantee.code !== 'DOMMAGES_COLLISIONS';
            }
            return true;
          })
          .map((item: any) => item.guarantee.nameFr) || [];
      })
    )
  );

  const bestPrice = Math.min(...quotes.map((q: any) => q.totalAPayer));

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate('/quotes')}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour aux devis
        </Button>

        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Comparaison de devis
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Comparez {quotes.length} devis côte à côte
          </p>
        </div>

        {quotes[0]?.simulation?.vehicle && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Informations du véhicule</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">Valeur à neuf:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {quotes[0].simulation.vehicle.newValue.toLocaleString()} DT
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Valeur vénale:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {quotes[0].simulation.vehicle.marketValue.toLocaleString()} DT
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Puissance:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {quotes[0].simulation.vehicle.fiscalHorsepower} CV
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">Places:</span>
                <span className="ml-2 font-medium text-gray-900 dark:text-white">
                  {quotes[0].simulation.vehicle.numberOfSeats}
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left p-4 font-semibold text-gray-900 dark:text-white sticky left-0 bg-white dark:bg-gray-800">
                  Critère
                </th>
                {quotes.map((quote: any) => (
                  <th key={quote.id} className="p-4 text-center min-w-[200px]">
                    <div className="font-semibold text-gray-900 dark:text-white mb-1">
                      {quote.company.name}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {quote.quoteNumber}
                    </div>
                    {quote.totalAPayer === bestPrice && (
                      <div className="mt-2">
                        <span className="inline-block px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                          Meilleur prix
                        </span>
                      </div>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-blue-50 dark:bg-blue-900/10">
                <td className="p-4 font-semibold text-gray-900 dark:text-white sticky left-0 bg-blue-50 dark:bg-blue-900/10">
                  Total TTC
                </td>
                {quotes.map((quote: any) => (
                  <td key={quote.id} className="p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {quote.totalAPayer.toLocaleString()} DT
                    </div>
                  </td>
                ))}
              </tr>

              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="p-4 text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800">
                  Prime nette
                </td>
                {quotes.map((quote: any) => (
                  <td key={quote.id} className="p-4 text-center text-gray-900 dark:text-white">
                    {quote.primeNette.toLocaleString()} DT
                  </td>
                ))}
              </tr>

              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="p-4 text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800">
                  Frais
                </td>
                {quotes.map((quote: any) => (
                  <td key={quote.id} className="p-4 text-center text-gray-900 dark:text-white">
                    {quote.frais.toLocaleString()} DT
                  </td>
                ))}
              </tr>

              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="p-4 text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800">
                  Taxes
                </td>
                {quotes.map((quote: any) => (
                  <td key={quote.id} className="p-4 text-center text-gray-900 dark:text-white">
                    {quote.taxes.toLocaleString()} DT
                  </td>
                ))}
              </tr>

              <tr className="border-b border-gray-200 dark:border-gray-700">
                <td className="p-4 text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800">
                  Frais additionnels
                </td>
                {quotes.map((quote: any) => (
                  <td key={quote.id} className="p-4 text-center text-gray-900 dark:text-white">
                    {(quote.fpac + quote.fssr + quote.fg).toLocaleString()} DT
                  </td>
                ))}
              </tr>

              <tr className="bg-gray-50 dark:bg-gray-900">
                <td colSpan={quotes.length + 1} className="p-4 font-semibold text-gray-900 dark:text-white">
                  Garanties incluses
                </td>
              </tr>

              {allGuarantees.map((guarantee, index) => (
                <tr key={index} className="border-b border-gray-200 dark:border-gray-700">
                  <td className="p-4 text-gray-700 dark:text-gray-300 sticky left-0 bg-white dark:bg-gray-800">
                    {guarantee}
                  </td>
                  {quotes.map((quote: any) => {
                    const hasGuarantee = quote.items
                      ?.filter((item: any) => {
                        // Hide TR and DC for STANDARD formula
                        if (quote.simulation?.formulaType === 'STANDARD') {
                          return item.guarantee.code !== 'TOUS_RISQUES_0' && item.guarantee.code !== 'DOMMAGES_COLLISIONS';
                        }
                        return true;
                      })
                      .some((item: any) => item.guarantee.nameFr === guarantee);
                    return (
                      <td key={quote.id} className="p-4 text-center">
                        {hasGuarantee ? (
                          <Check className="w-5 h-5 text-green-600 dark:text-green-400 mx-auto" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}

              <tr className="bg-gray-50 dark:bg-gray-900">
                <td className="p-4 font-semibold text-gray-900 dark:text-white sticky left-0 bg-gray-50 dark:bg-gray-900">
                  Actions
                </td>
                {quotes.map((quote: any) => (
                  <td key={quote.id} className="p-4 text-center">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadQuote(quote.id)}
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Télécharger
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            💡 <strong>Conseil :</strong> Le meilleur prix n'est pas toujours le meilleur choix. 
            Vérifiez les garanties incluses et choisissez la couverture qui correspond le mieux à vos besoins.
          </p>
        </div>
      </div>
    </MainLayout>
  );
};
