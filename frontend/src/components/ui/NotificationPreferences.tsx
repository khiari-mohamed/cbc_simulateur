import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Bell, Mail, Clock } from 'lucide-react';
import { Card } from './Card';
import { Button } from './Button';
import { useLanguage } from '../../contexts/LanguageContext';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';

interface NotificationPreferences {
  emailNotifications: boolean;
  inAppNotifications: boolean;
  frequency: 'IMMEDIATE' | 'DAILY_DIGEST';
  categories: {
    quoteStatus: boolean;
    documentRequests: boolean;
    paymentReminders: boolean;
    promotionalOffers: boolean;
    systemAnnouncements: boolean;
  };
}

export const NotificationPreferences = () => {
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);

  const { data: currentPreferences, isLoading } = useQuery({
    queryKey: ['notification-preferences'],
    queryFn: async () => {
      const response = await api.get('/notification-preferences');
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: (prefs: NotificationPreferences) =>
      api.post('/notification-preferences', prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] });
      toast.success('Préférences mises à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  useEffect(() => {
    if (currentPreferences) {
      setPreferences(currentPreferences);
    }
  }, [currentPreferences]);

  const handleToggle = (key: string, value?: any) => {
    if (!preferences) return;

    if (key.includes('.')) {
      const [parent, child] = key.split('.');
      setPreferences({
        ...preferences,
        [parent]: {
          ...(preferences as any)[parent],
          [child]: value !== undefined ? value : !(preferences as any)[parent][child],
        },
      });
    } else {
      setPreferences({
        ...preferences,
        [key]: value !== undefined ? value : !(preferences as any)[key],
      });
    }
  };

  const handleSave = () => {
    if (preferences) {
      updateMutation.mutate(preferences);
    }
  };

  if (isLoading || !preferences) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-6 h-6 text-blue-600" />
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('notifPrefs.title')}
        </h2>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          {t('notifPrefs.channels')}
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-gray-500" />
              <span>{t('notifPrefs.emailNotif')}</span>
            </div>
            <input
              type="checkbox"
              checked={preferences.emailNotifications}
              onChange={(e) => handleToggle('emailNotifications', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-500" />
              <span>{t('notifPrefs.inAppNotif')}</span>
            </div>
            <input
              type="checkbox"
              checked={preferences.inAppNotifications}
              onChange={(e) => handleToggle('inAppNotifications', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          {t('notifPrefs.frequency')}
        </h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="frequency"
              value="IMMEDIATE"
              checked={preferences.frequency === 'IMMEDIATE'}
              onChange={(e) => handleToggle('frequency', e.target.value)}
              className="w-4 h-4 text-blue-600"
            />
            <span>{t('notifPrefs.immediate')}</span>
          </label>
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="frequency"
              value="DAILY_DIGEST"
              checked={preferences.frequency === 'DAILY_DIGEST'}
              onChange={(e) => handleToggle('frequency', e.target.value)}
              className="w-4 h-4 text-blue-600"
            />
            <span>{t('notifPrefs.dailyDigest')}</span>
          </label>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">{t('notifPrefs.types')}</h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium">{t('notifPrefs.quoteStatus')}</span>
              <p className="text-sm text-gray-500">{t('notifPrefs.quoteStatusDesc')}</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.categories.quoteStatus}
              onChange={(e) => handleToggle('categories.quoteStatus', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium">{t('notifPrefs.documentRequests')}</span>
              <p className="text-sm text-gray-500">{t('notifPrefs.documentRequestsDesc')}</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.categories.documentRequests}
              onChange={(e) => handleToggle('categories.documentRequests', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium">{t('notifPrefs.paymentReminders')}</span>
              <p className="text-sm text-gray-500">{t('notifPrefs.paymentRemindersDesc')}</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.categories.paymentReminders}
              onChange={(e) => handleToggle('categories.paymentReminders', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium">{t('notifPrefs.promotionalOffers')}</span>
              <p className="text-sm text-gray-500">{t('notifPrefs.promotionalOffersDesc')}</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.categories.promotionalOffers}
              onChange={(e) => handleToggle('categories.promotionalOffers', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
          <label className="flex items-center justify-between">
            <div>
              <span className="font-medium">{t('notifPrefs.systemAnnouncements')}</span>
              <p className="text-sm text-gray-500">{t('notifPrefs.systemAnnouncementsDesc')}</p>
            </div>
            <input
              type="checkbox"
              checked={preferences.categories.systemAnnouncements}
              onChange={(e) => handleToggle('categories.systemAnnouncements', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
          </label>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          disabled={updateMutation.isPending}
          className="px-6"
        >
          {updateMutation.isPending ? t('common.loading') : t('settings.saveChanges')}
        </Button>
      </div>
    </div>
  );
};