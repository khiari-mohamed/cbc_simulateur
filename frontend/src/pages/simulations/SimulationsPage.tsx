import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { Plus, FileText, Calendar, TrendingUp } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../lib/api/client';
import { SimulationStatus } from '../../types';

export const SimulationsPage = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { data: simulations, isLoading } = useQuery({
    queryKey: ['simulations'],
    queryFn: async () => {
      const { data } = await api.get('/simulations');
      return data;
    },
  });

  const getStatusBadge = (status: SimulationStatus) => {
    const styles = {
      [SimulationStatus.DRAFT]: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200',
      [SimulationStatus.SUBMITTED]: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
      [SimulationStatus.APPROVED]: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
      [SimulationStatus.REJECTED]: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200',
    };

    const labels = {
      [SimulationStatus.DRAFT]: 'Brouillon',
      [SimulationStatus.SUBMITTED]: 'Soumis',
      [SimulationStatus.APPROVED]: 'Approuvé',
      [SimulationStatus.REJECTED]: 'Rejeté',
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getFormulaLabel = (formula: string) => {
    const labels: Record<string, string> = {
      STANDARD: 'Standard',
      DOMMAGES_COLLISIONS: 'Dommages Collision',
      TOUS_RISQUES_0: 'Tous Risques 0%',
    };
    return labels[formula] || formula;
  };

  return (
    <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              {t('simulations.title')}
            </h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
              {t('simulations.subtitle')}
            </p>
          </div>
          <Button
            onClick={() => navigate('/simulations/new')}
            className="flex items-center gap-2 w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            <span className="hidden sm:inline">{t('simulations.new')}</span>
            <span className="sm:hidden">{t('common.new')}</span>
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : simulations && simulations.length > 0 ? (
          <div className="grid gap-4">
            {simulations.map((simulation: any) => (
              <div
                key={simulation.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/simulations/${simulation.id}`)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {simulation.vehicle.registration || 'Véhicule sans immatriculation'}
                      </h3>
                      {getStatusBadge(simulation.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {simulation.vehicle.fiscalHorsepower} CV
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(simulation.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-4 h-4" />
                        {simulation._count?.quotes || 0} devis
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Formule</p>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {getFormulaLabel(simulation.formulaType)}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Valeur à neuf</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {simulation.vehicle.newValue.toLocaleString()} DT
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Valeur vénale</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {simulation.vehicle.marketValue.toLocaleString()} DT
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Bonus/Malus</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {simulation.bonusMalus}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Usage</p>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {simulation.usage}
                    </p>
                  </div>
                </div>

                {simulation.quotes && simulation.quotes.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                      Meilleur devis
                    </p>
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {simulation.quotes[0].company.name}
                      </span>
                      <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {simulation.quotes[0].totalAPayer.toLocaleString()} DT
                      </span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('simulations.none')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t('simulations.noneDesc')}
            </p>
            <Button
              onClick={() => navigate('/simulations/new')}
              className="flex items-center gap-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              {t('simulations.create')}
            </Button>
          </div>
        )}
    </div>
  );
};
