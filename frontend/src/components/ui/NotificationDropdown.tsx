import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead, type Notification } from '../../hooks/useNotifications';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

export const NotificationDropdown = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { data: unreadCount } = useUnreadCount();
  const { data: notificationsData, isLoading } = useNotifications(1, 10, false);
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
        return 'text-green-600';
      case 'QUOTE_REJECTED':
        return 'text-red-600';
      case 'DOCUMENT_REQUESTED':
        return 'text-orange-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={t('notifications.title')}
      >
        <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        {unreadCount?.count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount.count > 99 ? '99+' : unreadCount.count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('notifications.title')}
              </h3>
              {unreadCount?.count > 0 && (
                <button
                  onClick={handleMarkAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center gap-1"
                  disabled={markAllAsReadMutation.isPending}
                >
                  <CheckCheck className="w-4 h-4" />
                  {t('notifications.markAllRead')}
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              </div>
            ) : notificationsData?.notifications?.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notificationsData.notifications.map((notification: Notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      notification.status === 'PENDING' ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 text-lg">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${getNotificationColor(notification.type)}`}>
                              {notification.subject}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                              {notification.content}
                            </p>
                            <p className="text-xs text-gray-500 mt-2">
                              {formatDistanceToNow(new Date(notification.createdAt), {
                                addSuffix: true,
                                locale: fr,
                              })}
                            </p>
                          </div>
                          {notification.status === 'PENDING' && (
                            <button
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              disabled={markAsReadMutation.isPending}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>{t('notifications.empty')}</p>
              </div>
            )}
          </div>

          {notificationsData?.notifications?.length > 0 && (
            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => {
                  navigate('/notifications');
                  setIsOpen(false);
                }}
                className="w-full text-center text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                {t('notifications.viewAll')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};