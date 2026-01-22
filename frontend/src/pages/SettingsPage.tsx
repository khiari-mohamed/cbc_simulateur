import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User, Lock, Globe, Moon, Sun, Bell } from 'lucide-react';
import { Card, CardHeader, CardBody, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { NotificationPreferences } from '../components/ui/NotificationPreferences';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import api from '../lib/api/client';
import toast from 'react-hot-toast';

export const SettingsPage = () => {
  const { user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences' | 'notifications'>('profile');

  const [profileData, setProfileData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const updateProfileMutation = useMutation({
    mutationFn: (data: any) => api.patch('/users/me', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user'] });
      toast.success('Profil mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const updatePasswordMutation = useMutation({
    mutationFn: (data: any) => api.post('/auth/change-password', data),
    onSuccess: () => {
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Mot de passe modifié');
    },
    onError: () => toast.error('Erreur lors du changement de mot de passe'),
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(profileData);
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }
    updatePasswordMutation.mutate({
      currentPassword: passwordData.currentPassword,
      newPassword: passwordData.newPassword,
    });
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">{t('settings.title')}</h1>
        <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mt-1">
          {t('settings.subtitle')}
        </p>
      </div>

      <div className="flex gap-2 sm:gap-4 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        <button
          onClick={() => setActiveTab('profile')}
          className={`px-3 sm:px-4 py-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
            activeTab === 'profile'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <User className="w-4 h-4 inline mr-1 sm:mr-2" />
          <span className="hidden sm:inline">{t('settings.profile')}</span>
          <span className="sm:hidden">{t('settings.profile')[0]}</span>
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`px-3 sm:px-4 py-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
            activeTab === 'security'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Lock className="w-4 h-4 inline mr-1 sm:mr-2" />
          <span className="hidden sm:inline">{t('settings.security')}</span>
          <span className="sm:hidden">{t('settings.security')[0]}</span>
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-3 sm:px-4 py-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
            activeTab === 'preferences'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4 inline mr-1 sm:mr-2" />
          <span className="hidden sm:inline">{t('settings.preferences')}</span>
          <span className="sm:hidden">{t('settings.preferences').substring(0,2)}</span>
        </button>
        <button
          onClick={() => setActiveTab('notifications')}
          className={`px-3 sm:px-4 py-2 font-medium transition-colors whitespace-nowrap text-sm sm:text-base ${
            activeTab === 'notifications'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          <Bell className="w-4 h-4 inline mr-1 sm:mr-2" />
          <span className="hidden sm:inline">{t('settings.notifications')}</span>
          <span className="sm:hidden">{t('settings.notifications')[0]}</span>
        </button>
      </div>

      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.personalInfo')}</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <Input
                label={t('settings.firstName')}
                value={profileData.firstName}
                onChange={(e) => setProfileData({ ...profileData, firstName: e.target.value })}
                required
              />
              <Input
                label={t('settings.lastName')}
                value={profileData.lastName}
                onChange={(e) => setProfileData({ ...profileData, lastName: e.target.value })}
                required
              />
              <Input
                label={t('auth.email')}
                type="email"
                value={user?.email}
                disabled
              />
              <Input
                label={t('settings.phone')}
                type="tel"
                value={profileData.phone}
                onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
              />
              <Button type="submit" loading={updateProfileMutation.isPending}>
                {t('settings.saveChanges')}
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.changePassword')}</CardTitle>
          </CardHeader>
          <CardBody>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label={t('settings.currentPassword')}
                type="password"
                value={passwordData.currentPassword}
                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                required
              />
              <Input
                label={t('settings.newPassword')}
                type="password"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                required
              />
              <Input
                label={t('settings.confirmPassword')}
                type="password"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                required
              />
              <Button type="submit" loading={updatePasswordMutation.isPending}>
                {t('settings.changePassword')}
              </Button>
            </form>
          </CardBody>
        </Card>
      )}

      {activeTab === 'preferences' && (
        <Card>
          <CardHeader>
            <CardTitle>{t('settings.displayPreferences')}</CardTitle>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('settings.theme')}
                </label>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:border-blue-400 transition-colors w-full"
                >
                  {theme === 'dark' ? (
                    <>
                      <Sun className="w-5 h-5" />
                      <span>{t('settings.lightMode')}</span>
                    </>
                  ) : (
                    <>
                      <Moon className="w-5 h-5" />
                      <span>{t('settings.darkMode')}</span>
                    </>
                  )}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  {t('settings.language')}
                </label>
                <select className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  <option value="fr">Français</option>
                  <option value="ar">العربية</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <NotificationPreferences />
      )}
    </div>
  );
};
