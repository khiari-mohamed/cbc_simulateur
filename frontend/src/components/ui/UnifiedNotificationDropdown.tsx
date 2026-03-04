import { useState, useRef, useEffect } from 'react';
import { Bell, Users, Check, CheckCheck, Clock, FileText, AlertTriangle, CheckCircle, XCircle, Trash2, X } from 'lucide-react';
import { useNotifications, useUnreadCount, useMarkAsRead, useMarkAllAsRead, useDeleteNotification, useBulkDeleteNotifications, useBulkMarkAsRead } from '../../hooks/useNotifications';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export const UnifiedNotificationDropdown = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const isStaff = user?.role === 'ADMINISTRATEUR_ARS' || user?.role === 'GESTIONNAIRE_VALIDATION_ARS';
  
  // Use unified hooks for all users
  const { data: unreadCount } = useUnreadCount();
  const { data: notificationsData, isLoading } = useNotifications(1, 10, false);
  
  const markAsReadMutation = useMarkAsRead();
  const markAllAsReadMutation = useMarkAllAsRead();
  const deleteNotificationMutation = useDeleteNotification();
  const bulkDeleteMutation = useBulkDeleteNotifications();
  const bulkMarkAsReadMutation = useBulkMarkAsRead();

  const notifications = notificationsData?.notifications;

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

  const handleDelete = (id: string) => {
    deleteNotificationMutation.mutate(id);
    setSelectedIds(prev => prev.filter(sid => sid !== id));
  };

  const handleBulkDelete = () => {
    if (selectedIds.length > 0) {
      bulkDeleteMutation.mutate(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleBulkMarkAsRead = () => {
    if (selectedIds.length > 0) {
      bulkMarkAsReadMutation.mutate(selectedIds);
      setSelectedIds([]);
    }
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(sid => sid !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === notifications?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notifications?.map((n: any) => n.id) || []);
    }
  };

  const getNotificationIcon = (type: string) => {
    if (isStaff) {
      switch (type) {
        case 'QUOTE_NEEDS_VALIDATION': return <Clock className="w-5 h-5 text-orange-500" />;
        case 'QUOTE_VALIDATED': return <CheckCircle className="w-5 h-5 text-green-500" />;
        case 'QUOTE_REJECTED': return <XCircle className="w-5 h-5 text-red-500" />;
        case 'DOCUMENT_UPLOADED': return <FileText className="w-5 h-5 text-blue-500" />;
        case 'URGENT_REVIEW': return <AlertTriangle className="w-5 h-5 text-red-600" />;
        case 'DEADLINE_APPROACHING': return <Clock className="w-5 h-5 text-yellow-500" />;
        case 'SYSTEM_ALERT': return <Bell className="w-5 h-5 text-purple-500" />;
        default: return <FileText className="w-5 h-5 text-gray-500" />;
      }
    } else {
      switch (type) {
        case 'QUOTE_CREATED': return <FileText className="w-5 h-5 text-blue-500" />;
        case 'QUOTE_VALIDATED': return <CheckCircle className="w-5 h-5 text-green-500" />;
        case 'QUOTE_REJECTED': return <XCircle className="w-5 h-5 text-red-500" />;
        case 'CONTRACT_CREATED': return <FileText className="w-5 h-5 text-purple-500" />;
        case 'DOCUMENT_REQUESTED': return <FileText className="w-5 h-5 text-orange-500" />;
        default: return <Bell className="w-5 h-5 text-gray-500" />;
      }
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'QUOTE_VALIDATED':
      case 'CONTRACT_CREATED':
        return 'text-green-600 dark:text-green-400';
      case 'QUOTE_REJECTED':
        return 'text-red-600 dark:text-red-400';
      case 'URGENT_REVIEW':
        return 'text-red-600 dark:text-red-400';
      case 'DEADLINE_APPROACHING':
        return 'text-yellow-600 dark:text-yellow-400';
      case 'DOCUMENT_REQUESTED':
      case 'DOCUMENT_UPLOADED':
        return 'text-orange-600 dark:text-orange-400';
      default:
        return 'text-blue-600 dark:text-blue-400';
    }
  };

  const getNotificationBg = (notification: any) => {
    if (notification.status !== 'PENDING') return '';
    
    if (isStaff) {
      switch (notification.type) {
        case 'URGENT_REVIEW':
          return 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500';
        case 'DEADLINE_APPROACHING':
          return 'bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500';
        case 'SYSTEM_ALERT':
          return 'bg-purple-50 dark:bg-purple-900/20 border-l-4 border-purple-500';
        default:
          return 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500';
      }
    }
    return 'bg-blue-50 dark:bg-blue-900/20';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        aria-label={isStaff ? 'Notifications internes' : t('notifications.title')}
      >
        {isStaff ? (
          <Users className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        ) : (
          <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        )}
        {unreadCount?.count > 0 && (
          <span className={`absolute -top-1 -right-1 w-5 h-5 ${isStaff ? 'bg-orange-500' : 'bg-red-500'} text-white text-xs rounded-full flex items-center justify-center font-medium`}>
            {unreadCount.count > 99 ? '99+' : unreadCount.count}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                {isStaff && <Users className="w-5 h-5 text-orange-500" />}
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {isStaff ? 'Notifications Internes' : t('notifications.title')}
                </h3>
              </div>
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
            {notifications?.length > 0 && (
              <div className="flex items-center justify-between text-sm mt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === notifications.length}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300"
                  />
                  <span className="text-gray-600 dark:text-gray-400">Tout sélectionner</span>
                </label>
                {selectedIds.length > 0 && (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleBulkMarkAsRead}
                      className="text-xs px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded flex items-center gap-1"
                      disabled={bulkMarkAsReadMutation.isPending}
                    >
                      <Check className="w-3 h-3" />
                      Marquer lu ({selectedIds.length})
                    </button>
                    <button
                      onClick={handleBulkDelete}
                      className="text-xs px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded flex items-center gap-1"
                      disabled={bulkDeleteMutation.isPending}
                    >
                      <Trash2 className="w-3 h-3" />
                      Supprimer ({selectedIds.length})
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="p-4 text-center">
                <div className={`animate-spin rounded-full h-6 w-6 border-b-2 ${isStaff ? 'border-orange-500' : 'border-blue-600'} mx-auto`}></div>
              </div>
            ) : notifications?.length > 0 ? (
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {notifications.map((notification: any) => (
                  <div
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${getNotificationBg(notification)}`}
                  >
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(notification.id)}
                        onChange={() => toggleSelection(notification.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 rounded"
                      />
                      <div 
                        className="flex items-start gap-3 flex-1 cursor-pointer"
                        onClick={() => {
                          setSelectedNotification(notification);
                          setShowDetailModal(true);
                        }}
                      >
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className={`text-sm font-medium ${getNotificationColor(notification.type)}`}>
                              {notification.subject}
                            </p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
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
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              className="ml-2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                              disabled={markAsReadMutation.isPending}
                            >
                              <Check className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(notification.id);
                        }}
                        className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                        disabled={deleteNotificationMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {isStaff ? (
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                ) : (
                  <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
                )}
                <p>{isStaff ? 'Aucune notification interne' : t('notifications.empty')}</p>
              </div>
            )}
          </div>

          {notifications?.length > 0 && !isStaff && (
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

      {/* Notification Detail Modal */}
      {showDetailModal && selectedNotification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                {getNotificationIcon(selectedNotification.type)}
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex-1">
                  {selectedNotification.subject}
                </h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {selectedNotification.content}
              </p>
              <div className="text-xs text-gray-500 mb-4">
                {formatDistanceToNow(new Date(selectedNotification.createdAt), {
                  addSuffix: true,
                  locale: fr,
                })}
              </div>
              {selectedNotification.metadata && (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 text-sm">
                  <p className="font-medium text-gray-900 dark:text-white mb-2">Détails:</p>
                  <pre className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap">
                    {JSON.stringify(selectedNotification.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3">
              {selectedNotification.status === 'PENDING' && (
                <button
                  onClick={() => {
                    handleMarkAsRead(selectedNotification.id);
                    setShowDetailModal(false);
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  Marquer comme lu
                </button>
              )}
              <button
                onClick={() => setShowDetailModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
