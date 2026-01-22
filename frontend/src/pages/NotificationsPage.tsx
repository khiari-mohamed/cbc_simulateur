import { useState } from 'react';
import { useNotifications, useMarkAsRead, useMarkAllAsRead, type Notification } from '../hooks/useNotifications';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Bell, Check, CheckCheck, Filter } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useLanguage } from '../contexts/LanguageContext';

export const NotificationsPage = () => {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const [page, setPage] = useState(1);
  
  const { data: notificationsData, isLoading } = useNotifications(page, 20, filter === 'unread');
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  const handleMarkAsRead = (notificationId: string) => {
    markAsReadMutation.mutate(notificationId);
  };

  const handleMarkAllAsRead = () => {
    markAllAsReadMutation.mutate();
  };

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
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'QUOTE_VALIDATED':
      case 'CONTRACT_CREATED':
        return 'text-green-600 dark:text-green-400';
      case 'QUOTE_REJECTED':
        return 'text-red-600 dark:text-red-400';
      case 'DOCUMENT_REQUESTED':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
          {t('notifications.title')}
        </h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
          {t('notifications.subtitle')}
        </p>
      </div>

      <Card className="mb-6 p-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              <Filter className="w-4 h-4 mr-2 inline" />
              {t('notifications.all')}
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
              }`}
            >
              {t('notifications.unread')}
            </button>
          </div>
          
          {notificationsData?.notifications?.some((n: Notification) => n.status === 'PENDING') && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleMarkAllAsRead}
              disabled={markAllAsReadMutation.isPending}
            >
              <CheckCheck className="w-4 h-4 mr-2" />
              {t('notifications.markAllRead')}
            </Button>
          )}
        </div>
      </Card>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : notificationsData?.notifications?.length > 0 ? (
        <div className="space-y-4">
          {notificationsData.notifications.map((notification: Notification) => (
            <Card
              key={notification.id}
              className={`p-6 transition-colors ${
                notification.status === 'PENDING' 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                  : ''
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-2xl">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className={`text-lg font-semibold ${getNotificationColor(notification.type)}`}>
                        {notification.subject}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400 mt-2 leading-relaxed">
                        {notification.content}
                      </p>
                      <div className="flex items-center gap-4 mt-4">
                        <p className="text-sm text-gray-500">
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale: fr,
                          })}
                        </p>
                        {notification.status === 'PENDING' && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                            {t('notifications.new')}
                          </span>
                        )}
                      </div>
                    </div>
                    {notification.status === 'PENDING' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={markAsReadMutation.isPending}
                        className="ml-4"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        {t('notifications.markAsRead')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {notificationsData.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                {t('common.previous')}
              </Button>
              <span className="flex items-center px-4 py-2 text-sm text-gray-600 dark:text-gray-400">
                {t('common.page')} {page} {t('common.of')} {notificationsData.totalPages}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.min(notificationsData.totalPages, p + 1))}
                disabled={page === notificationsData.totalPages}
              >
                {t('common.next')}
              </Button>
            </div>
          )}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <Bell className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            {t('notifications.empty')}
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            {filter === 'unread' 
              ? t('notifications.noUnread')
              : t('notifications.emptyDesc')
            }
          </p>
        </Card>
      )}
    </div>
  );
};