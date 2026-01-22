import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, FileText, TrendingUp, Shield, DollarSign, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { StatCard } from '../../components/ui/StatCard';
import { Card, CardHeader, CardBody, CardTitle } from '../../components/ui/Card';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../lib/api/client';

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [users, companies, allQuotes, simulations, reporting, conventions] = await Promise.all([
        api.get('/users'),
        api.get('/companies'),
        api.get('/quotes/all/stats'),
        api.get('/simulations'),
        api.get('/reporting/statistics'),
        api.get('/reporting/by-convention'),
      ]);
      return {
        users: users.data,
        companies: companies.data,
        quotes: allQuotes.data,
        simulations: simulations.data,
        reporting: reporting.data,
        conventions: conventions.data,
      };
    },
  });

  const pendingValidation = stats?.reporting?.quotes?.submitted || 0;
  const activeCompanies = stats?.companies?.filter((c: any) => c.isActive).length || 0;
  const totalUsers = stats?.users?.length || 0;
  const totalQuotes = stats?.reporting?.quotes?.total || 0;

  // Prepare chart data from recent quotes
  const chartData = stats?.quotes?.slice(0, 10).reverse().map((quote: any, idx: number) => ({
    name: new Date(quote.createdAt).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    prime: Number(quote.primeNette),
  })) || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('dashboard.adminTitle')}</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">{t('dashboard.adminSubtitle')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title={t('dashboard.users')}
          value={totalUsers.toString()}
          icon={Users}
          trend={`${totalUsers} total`}
          onClick={() => navigate('/admin/users')}
        />
        <StatCard
          title={t('dashboard.companies')}
          value={activeCompanies.toString()}
          icon={Building2}
          trend={`${activeCompanies} actives`}
          onClick={() => navigate('/admin/companies')}
        />
        <StatCard
          title={t('dashboard.quotesGenerated')}
          value={totalQuotes.toString()}
          icon={FileText}
          trend={`${totalQuotes} total`}
          onClick={() => navigate('/admin/validation')}
        />
        <StatCard
          title={t('dashboard.pending')}
          value={pendingValidation.toString()}
          icon={TrendingUp}
          trend={`${pendingValidation} à valider`}
          onClick={() => navigate('/admin/validation')}
        />
      </div>

        <Card>
        <CardHeader>
          <CardTitle>Réalisations par convention</CardTitle>
        </CardHeader>
        <CardBody>
          {stats?.conventions && stats.conventions.length > 0 ? (
            <div className="space-y-4">
              {stats.conventions.map((conv: any) => (
                <div key={conv.conventionId} className="border-b border-gray-200 dark:border-gray-700 pb-4 last:border-0">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white">{conv.conventionName}</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{conv.companyName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {conv.totalPremium.toLocaleString()} DT
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Prime totale</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Simulations:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{conv.totalSimulations}</span>
                    </div>
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Contrats:</span>
                      <span className="ml-2 font-medium text-gray-900 dark:text-white">{conv.totalContracts}</span>
                    </div>
                  </div>
                  {/* Detailed Quote Breakdown */}
                  {conv.quotes && conv.quotes.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Détail des devis:</p>
                      <div className="space-y-1">
                        {conv.quotes.slice(0, 3).map((quote: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-xs">
                            <span className="text-gray-600 dark:text-gray-400">{quote.quoteNumber}</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                              {quote.primeNette.toLocaleString()} DT
                            </span>
                          </div>
                        ))}
                        {conv.quotes.length > 3 && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 italic">
                            +{conv.quotes.length - 3} autres devis
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500 dark:text-gray-400 py-8">Aucune réalisation pour le moment</p>
          )}
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.quickActions')}</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <button
                onClick={() => navigate('/admin/validation')}
                className="w-full p-4 text-left rounded-lg border-2 border-blue-200 dark:border-blue-800 hover:border-blue-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Voir les devis</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{pendingValidation} en attente (gérés par gestionnaires)</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => navigate('/admin/companies')}
                className="w-full p-4 text-left rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Building2 className="w-6 h-6 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Gérer les compagnies</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Ajouter ou modifier</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => navigate('/admin/pricing-rules')}
                className="w-full p-4 text-left rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <DollarSign className="w-6 h-6 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Règles de tarification</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Configurer les formules</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => navigate('/admin/settings')}
                className="w-full p-4 text-left rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Paramètres système</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">2FA, réductions, tarifs</p>
                  </div>
                </div>
              </button>
              <button
                onClick={() => navigate('/admin/convention-reports')}
                className="w-full p-4 text-left rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-gray-400 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <BarChart3 className="w-6 h-6 text-gray-600" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Rapports conventions</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Détails par convention</p>
                  </div>
                </div>
              </button>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivity')}</CardTitle>
          </CardHeader>
          <CardBody>
            {chartData.length > 0 && (
              <div className="mb-6">
                <ResponsiveContainer width="100%" height={120}>
                  <LineChart data={chartData}>
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <YAxis tick={{ fontSize: 11 }} stroke="#9ca3af" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => [`${value.toLocaleString()} DT`, 'Prime']}
                    />
                    <Line type="monotone" dataKey="prime" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {stats?.quotes && stats.quotes.length > 0 ? (
              stats.quotes.slice(0, 5).map((quote: any) => (
                <div
                  key={quote.id}
                  className="flex items-center gap-4 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      Devis {quote.quoteNumber}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {quote.company.name} - {new Date(quote.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    quote.status === 'VALIDATED' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' :
                    quote.status === 'SUBMITTED' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' :
                    quote.status === 'REJECTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' :
                    quote.status === 'TRANSFORMED_TO_CONTRACT' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' :
                    'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {quote.status}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 dark:text-gray-400 py-8">Aucune activité récente</p>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};
