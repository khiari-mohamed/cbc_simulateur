import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { BarChart3, TrendingUp, AlertTriangle, Mail, Bell, Clock } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import api from '../../lib/api/client';

export const NotificationAnalyticsPage = () => {
  const [period, setPeriod] = useState('7d');

  const { data: dashboard, isLoading } = useQuery({
    queryKey: ['notification-analytics', 'dashboard', period],
    queryFn: async () => {
      const response = await api.get(`/notification-analytics/dashboard?period=${period}`);
      return response.data;
    },
  });

  const { data: recentActivity } = useQuery({
    queryKey: ['notification-analytics', 'recent-activity'],
    queryFn: async () => {
      const response = await api.get('/notification-analytics/recent-activity?limit=20');
      return response.data;
    },
  });

  const { data: alerts } = useQuery({
    queryKey: ['notification-analytics', 'failure-alerts'],
    queryFn: async () => {
      const response = await api.get('/notification-analytics/failure-alerts');
      return response.data;
    },
    refetchInterval: 60000, // Check every minute
  });

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'QUOTE_CREATED':
        return '📄';
      case 'QUOTE_VALIDATED':
        return '✅';
      case 'QUOTE_REJECTED':
        return '❌';
      case 'CONTRACT_CREATED':
        return '📋';
      case 'DOCUMENT_REQUESTED':
        return '📎';
      case 'PAYMENT_REQUIRED':
        return '💳';
      case 'PAYMENT_CONFIRMED':
        return '✅';
      default:
        return '🔔';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Analytiques des Notifications
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Surveillez les performances et la santé du système de notifications
        </p>
      </div>

      {/* Period Selector */}
      <Card className="mb-6 p-4">
        <div className="flex gap-2">
          {['7d', '30d'].map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                period === p
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {p === '7d' ? '7 jours' : '30 jours'}
            </button>
          ))}
        </div>
      </Card>

      {/* Alerts */}
      {alerts?.alerts?.length > 0 && (
        <Card className="mb-6 p-4 border-red-200 bg-red-50 dark:bg-red-900/20">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-semibold text-red-800 dark:text-red-200">Alertes Système</h3>
          </div>
          <div className="space-y-2">
            {alerts.alerts.map((alert: any, index: number) => (
              <div key={index} className="text-sm text-red-700 dark:text-red-300">
                {alert.message}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Envoyées</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboard?.totalSent?.toLocaleString() || 0}
              </p>
            </div>
            <Mail className="w-8 h-8 text-blue-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taux de Succès</p>
              <p className="text-2xl font-bold text-green-600">
                {dashboard?.successRate?.toFixed(1) || 0}%
              </p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Échecs Récents</p>
              <p className="text-2xl font-bold text-red-600">
                {alerts?.recentFailures || 0}
              </p>
            </div>
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Période</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {dashboard?.period || '7 jours'}
              </p>
            </div>
            <Clock className="w-8 h-8 text-gray-600" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Delivery Stats */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Statut de Livraison
          </h3>
          <div className="space-y-3">
            {dashboard?.deliveryStats?.map((stat: any) => (
              <div key={stat.status} className="flex items-center justify-between">
                <span className="capitalize">{stat.status.toLowerCase()}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        stat.status === 'SENT' ? 'bg-green-500' : 
                        stat.status === 'PENDING' ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{
                        width: `${dashboard.totalSent > 0 ? (stat._count.status / dashboard.totalSent) * 100 : 0}%`
                      }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium w-12 text-right">
                    {stat._count.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Type Stats */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Types de Notifications
          </h3>
          <div className="space-y-3">
            {dashboard?.typeStats?.map((stat: any) => (
              <div key={stat.type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{getNotificationIcon(stat.type)}</span>
                  <span className="text-sm">{stat.type.replace('_', ' ')}</span>
                </div>
                <span className="text-sm font-medium">
                  {stat._count.type}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="mt-6 p-6">
        <h3 className="text-lg font-semibold mb-4">Activité Récente</h3>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {recentActivity?.map((notification: any) => (
            <div key={notification.id} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-b-0">
              <div className="flex items-center gap-3">
                <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                <div>
                  <p className="text-sm font-medium">{notification.subject}</p>
                  <p className="text-xs text-gray-500">
                    {notification.user?.firstName} {notification.user?.lastName} ({notification.user?.email})
                  </p>
                </div>
              </div>
              <div className="text-right">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  notification.status === 'SENT' ? 'bg-green-100 text-green-800' :
                  notification.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {notification.status}
                </span>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(notification.createdAt).toLocaleString('fr-FR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};