import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { FileText, Clock, CheckCircle, Plus } from 'lucide-react';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardHeader, CardBody, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../../lib/api/client';
import { SimulationStatus, QuoteStatus } from '../../types';

export const ClientDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { data: simulations } = useQuery({
    queryKey: ['simulations'],
    queryFn: async () => {
      const { data } = await api.get('/simulations');
      return data;
    },
  });

  const { data: quotes } = useQuery({
    queryKey: ['quotes'],
    queryFn: async () => {
      const { data } = await api.get('/quotes');
      return data;
    },
  });

  const draftSimulations = simulations?.filter((s: any) => s.status === SimulationStatus.DRAFT).length || 0;
  const submittedSimulations = simulations?.filter((s: any) => s.status === SimulationStatus.SUBMITTED).length || 0;
  const validatedQuotes = quotes?.filter((q: any) => q.status === QuoteStatus.VALIDATED).length || 0;
  const totalQuotes = quotes?.length || 0;

  // Generate chart data from recent activity (last 7 days)
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      days.push({
        date: date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }),
        fullDate: date.toISOString().split('T')[0],
        simulations: 0,
        quotes: 0,
      });
    }
    return days;
  };

  const chartData = getLast7Days().map(day => {
    const daySimulations = simulations?.filter((s: any) => {
      const simDate = new Date(s.createdAt).toISOString().split('T')[0];
      return simDate === day.fullDate;
    }).length || 0;

    const dayQuotes = quotes?.filter((q: any) => {
      const quoteDate = new Date(q.createdAt).toISOString().split('T')[0];
      return quoteDate === day.fullDate;
    }).length || 0;

    return {
      date: day.date,
      simulations: daySimulations,
      quotes: dayQuotes,
    };
  });



  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard.title')}</h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{t('dashboard.welcome')}</p>
        </div>
        <Button
          onClick={() => {
            localStorage.removeItem('simulationStep');
            localStorage.removeItem('simulationData');
            localStorage.removeItem('simulationId');
            navigate('/simulations/new');
          }}
          className="flex items-center gap-2 w-full sm:w-auto"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">{t('dashboard.newSimulation')}</span>
          <span className="sm:hidden">{t('dashboard.newSimulation').split(' ')[0]}</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('dashboard.totalQuotes')}
          value={totalQuotes.toString()}
          icon={FileText}
          trend={totalQuotes > 0 ? `+${totalQuotes}` : '0'}
        />
        <StatCard
          title={t('dashboard.drafts')}
          value={draftSimulations.toString()}
          icon={Clock}
          trend={draftSimulations > 0 ? `${draftSimulations}` : '0'}
        />
        <StatCard
          title={t('dashboard.pending')}
          value={submittedSimulations.toString()}
          icon={Clock}
          trend={submittedSimulations > 0 ? `${submittedSimulations}` : '0'}
        />
        <StatCard
          title={t('dashboard.validated')}
          value={validatedQuotes.toString()}
          icon={CheckCircle}
          trend={validatedQuotes > 0 ? `+${validatedQuotes}` : '0'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
          </CardHeader>
          <CardBody>
            {chartData.some(d => d.simulations > 0 || d.quotes > 0) ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    stroke="currentColor"
                  />
                  <YAxis 
                    className="text-xs"
                    stroke="currentColor"
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--tooltip-bg, #fff)',
                      border: '1px solid var(--tooltip-border, #e5e7eb)',
                      borderRadius: '0.5rem'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="simulations" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Simulations"
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="quotes" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name="Devis"
                    dot={{ fill: '#10b981', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">
                {t('dashboard.noActivity')}
              </p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <button
                onClick={() => {
                  localStorage.removeItem('simulationStep');
                  localStorage.removeItem('simulationData');
                  localStorage.removeItem('simulationId');
                  navigate('/simulations/new');
                }}
                className="w-full p-4 text-left rounded-lg border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 dark:hover:border-blue-600 transition-colors"
              >
                <p className="font-medium text-gray-900 dark:text-white">{t('dashboard.newSimulation')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('simulations.noneDesc')}</p>
              </button>
              <button
                onClick={() => navigate('/simulations')}
                className="w-full p-4 text-left rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
              >
                <p className="font-medium text-gray-900 dark:text-white">{t('simulations.title')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('simulations.subtitle')}</p>
              </button>
              <button
                onClick={() => navigate('/quotes')}
                className="w-full p-4 text-left rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
              >
                <p className="font-medium text-gray-900 dark:text-white">{t('quotes.title')}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t('quotes.subtitle')}</p>
              </button>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
