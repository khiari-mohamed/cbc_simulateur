import { useState, useRef, useEffect } from 'react';
import { Users, AlertTriangle, CheckCircle, XCircle, Clock, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useInternalNotifications, useUnreadInternalCount } from '../../hooks/useInternalNotifications';

export const InternalNotificationDropdown = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { data: unreadCount } = useUnreadInternalCount();
  const { data: notificationsData, isLoading } = useInternalNotifications(1, 10);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'QUOTE_NEEDS_VALIDATION':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'QUOTE_VALIDATED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'QUOTE_REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'DOCUMENT_UPLOADED':
        return <Bell className="w-4 h-4 text-blue-500" />;
      case 'URGENT_REVIEW':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'DEADLINE_APPROACHING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'SYSTEM_ALERT':
        return <AlertTriangle className="w-4 h-4 text-purple-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const getNotificationBgColor = (type: string) => {
    switch (type) {
      case 'URGENT_REVIEW':
        return 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500';
      case 'DEADLINE_APPROACHING':
        return 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500';
      case 'SYSTEM_ALERT':
        return 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500';
      case 'QUOTE_VALIDATED':
        return 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500';
      case 'QUOTE_REJECTED':
        return 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500';
      default:
        return 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label="Notifications internes"
      >
        <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        {unreadCount?.count > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
            {unreadCount.count > 99 ? '99+' : unreadCount.count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-orange-500" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Notifications Internes
              </h3>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-500 mx-auto"></div>
              </div>
            ) : notificationsData?.notifications?.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notificationsData.notifications.map((notification: any) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      notification.status === 'PENDING' ? getNotificationBgColor(notification.type) : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
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
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Aucune notification interne</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};