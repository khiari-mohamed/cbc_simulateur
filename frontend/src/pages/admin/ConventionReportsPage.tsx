import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '../../components/ui/Card';
import { TrendingUp, FileText, DollarSign, ChevronDown, ChevronUp, User, Shield } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../../lib/api/client';

export const ConventionReportsPage = () => {
  const [expandedConvention, setExpandedConvention] = useState<string | null>(null);

  const { data: stats, isLoading } = useQuery({
    queryKey: ['reporting', 'by-convention'],
    queryFn: async () => {
      const { data } = await api.get('/reporting/by-convention');
      return data;
    },
  });

  if (isLoading) {
    return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
    );
  }

  const totalPremium = stats?.reduce((sum: number, s: any) => sum + s.totalPremium, 0) || 0;
  const totalContracts = stats?.reduce((sum: number, s: any) => sum + s.totalContracts, 0) || 0;

  // Prepare chart data
  const barChartData = stats?.map((s: any) => ({
    name: s.conventionName.length > 20 ? s.conventionName.substring(0, 20) + '...' : s.conventionName,
    prime: s.totalPremium,
    contrats: s.totalContracts,
  })) || [];

  const pieChartData = stats?.map((s: any) => ({
    name: s.conventionName,
    value: s.totalPremium,
  })) || [];

  const COLORS = ['#f97316', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];

  const toggleExpand = (conventionId: string) => {
    setExpandedConvention(expandedConvention === conventionId ? null : conventionId);
  };

  return (
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Réalisations par Convention
            </h1>
            <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-semibold rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" />
              ADMIN ONLY
            </span>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Analyse détaillée des primes et contrats par convention avec détail client
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Contrats</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalContracts}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Prime Totale</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  {totalPremium.toLocaleString()} DT
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Conventions Actives</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats?.length || 0}</p>
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Primes par Convention</h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={barChartData}>
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
                <Bar dataKey="prime" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Répartition des Primes</h3>
            <div className="flex flex-col items-center">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    outerRadius={60}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [`${value.toLocaleString()} DT`, 'Prime']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-4 space-y-2 w-full">
                {pieChartData.map((entry: any, index: number) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-4 h-4 rounded" 
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      />
                      <span className="text-gray-700 dark:text-gray-300">{entry.name}</span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {((entry.value / totalPremium) * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          {stats?.map((stat: any) => (
            <Card key={stat.conventionId} className="overflow-hidden">
              <div
                className="p-6 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                onClick={() => toggleExpand(stat.conventionId)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        {stat.conventionName}
                      </h3>
                      {expandedConvention === stat.conventionId ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{stat.companyName}</p>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Simulations</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {stat.totalSimulations}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Contrats</p>
                        <p className="text-lg font-semibold text-gray-900 dark:text-white">
                          {stat.totalContracts}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Prime Nette Totale</p>
                        <p className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                          {stat.totalPremium.toLocaleString()} DT
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {expandedConvention === stat.conventionId && stat.quotes && stat.quotes.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="p-6">
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Détail des devis par client ({stat.quotes.length})
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-white dark:bg-gray-800">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              N° Devis
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Prime Nette
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                              Total à Payer
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                          {stat.quotes.map((quote: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                {quote.quoteNumber}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                                {new Date(quote.createdAt).toLocaleDateString('fr-FR')}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-medium text-gray-900 dark:text-white">
                                {quote.primeNette.toLocaleString()} DT
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-right font-semibold text-blue-600 dark:text-blue-400">
                                {quote.totalAPayer.toLocaleString()} DT
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-gray-100 dark:bg-gray-900">
                          <tr>
                            <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white">
                              Total
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-gray-900 dark:text-white">
                              {stat.quotes.reduce((sum: number, q: any) => sum + q.primeNette, 0).toLocaleString()} DT
                            </td>
                            <td className="px-4 py-3 text-sm text-right font-bold text-blue-600 dark:text-blue-400">
                              {stat.quotes.reduce((sum: number, q: any) => sum + q.totalAPayer, 0).toLocaleString()} DT
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>

        {(!stats || stats.length === 0) && (
          <Card className="p-12">
            <div className="text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucune réalisation
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Les statistiques apparaîtront une fois que des contrats seront générés
              </p>
            </div>
          </Card>
        )}
      </div>
  );
};
