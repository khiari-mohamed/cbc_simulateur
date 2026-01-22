import { useQuery } from '@tanstack/react-query';
import { BarChart3, FileText, Users, TrendingUp, Download, Shield } from 'lucide-react';
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { StatCard } from '../../../components/ui/StatCard';
import { Button } from '../../../components/ui/Button';
import api from '../../../lib/api/client';

export const ReportsPage = () => {
  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const [reporting, users] = await Promise.all([
        api.get('/reporting/statistics').then(res => res.data),
        api.get('/users').then(res => res.data),
      ]);
      return { reporting, users };
    },
  });

  const totalSimulations = stats?.reporting?.simulations?.total || 0;
  const totalQuotes = stats?.reporting?.quotes?.total || 0;
  const totalUsers = stats?.users?.length || 0;
  const validatedQuotes = stats?.reporting?.quotes?.validated || 0;

  const quotesChartData = [
    { name: 'Générés', value: stats?.reporting?.quotes?.generated || 0, color: '#9ca3af' },
    { name: 'Soumis', value: stats?.reporting?.quotes?.submitted || 0, color: '#3b82f6' },
    { name: 'Validés', value: stats?.reporting?.quotes?.validated || 0, color: '#10b981' },
    { name: 'Rejetés', value: stats?.reporting?.quotes?.rejected || 0, color: '#ef4444' },
  ];

  const COLORS = ['#9ca3af', '#3b82f6', '#10b981', '#ef4444'];

  const handleExport = () => {
    const csvContent = [
      ['Rapport Statistiques ARS', ''],
      ['Date', new Date().toLocaleDateString('fr-FR')],
      [''],
      ['Résumé'],
      ['Total Simulations', totalSimulations],
      ['Total Devis', totalQuotes],
      ['Devis Validés', validatedQuotes],
      ['Utilisateurs', totalUsers],
      [''],
      ['Devis par Statut'],
      ['Statut', 'Nombre'],
      ...quotesChartData.map(item => [item.name, item.value]),
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `rapport-ars-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Rapports & Statistiques</h1>
              <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs font-semibold rounded-full flex items-center gap-1">
                <Shield className="w-3 h-3" />
                ADMIN ONLY
              </span>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Statistiques et analyses complètes de la plateforme
            </p>
          </div>
          <Button className="flex items-center gap-2" onClick={handleExport}>
            <Download className="w-5 h-5" />
            Exporter
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <StatCard
            title="Total simulations"
            value={totalSimulations.toString()}
            icon={FileText}
            trend={`${totalSimulations}`}
          />
          <StatCard
            title="Total devis"
            value={totalQuotes.toString()}
            icon={BarChart3}
            trend={`${totalQuotes}`}
          />
          <StatCard
            title="Devis validés"
            value={validatedQuotes.toString()}
            icon={TrendingUp}
            trend={`${validatedQuotes}`}
          />
          <StatCard
            title="Utilisateurs"
            value={totalUsers.toString()}
            icon={Users}
            trend={`${totalUsers}`}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Devis par statut
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={quotesChartData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <PolarRadiusAxis angle={90} domain={[0, 'auto']} tick={{ fontSize: 11, fill: '#9ca3af' }} />
                <Radar name="Devis" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Statistiques détaillées
            </h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={quotesChartData} layout="vertical">
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9ca3af" />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#9ca3af" width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {quotesChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Simulations par statut
            </h3>
            <div className="space-y-3">
              {[
                { status: 'DRAFT', label: 'Brouillon' },
                { status: 'SUBMITTED', label: 'Soumis' },
                { status: 'APPROVED', label: 'Approuvé' },
                { status: 'REJECTED', label: 'Rejeté' },
              ].map(({ status, label }) => {
                const count = status === 'DRAFT' ? (stats?.reporting?.simulations?.total || 0) : 0;
                const percentage = totalSimulations > 0 ? (count / totalSimulations) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">{label}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Devis par statut
            </h3>
            <div className="space-y-3">
              {[
                { status: 'GENERATED', label: 'Généré', key: 'generated' },
                { status: 'SUBMITTED', label: 'Soumis', key: 'submitted' },
                { status: 'VALIDATED', label: 'Validé', key: 'validated' },
                { status: 'REJECTED', label: 'Rejeté', key: 'rejected' },
              ].map(({ status, label, key }) => {
                const count = stats?.reporting?.quotes?.[key] || 0;
                const percentage = totalQuotes > 0 ? (count / totalQuotes) * 100 : 0;
                return (
                  <div key={status}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600 dark:text-gray-400">{label}</span>
                      <span className="font-medium text-gray-900 dark:text-white">{count}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
  );
};
