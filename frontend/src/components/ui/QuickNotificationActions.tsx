import { useState } from 'react';
import { AlertTriangle, Send, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useCreateUrgentReview, useCreateSystemAlert } from '../../hooks/useInternalNotifications';

interface QuickNotificationActionsProps {
  quoteNumber?: string;
}

export const QuickNotificationActions = ({ quoteNumber }: QuickNotificationActionsProps) => {
  const { user } = useAuth();
  const [showUrgentForm, setShowUrgentForm] = useState(false);
  const [showAlertForm, setShowAlertForm] = useState(false);
  const [urgentReason, setUrgentReason] = useState('');
  const [alertMessage, setAlertMessage] = useState('');
  const [targetRole, setTargetRole] = useState<string>('');

  const createUrgentReview = useCreateUrgentReview();
  const createSystemAlert = useCreateSystemAlert();

  const handleUrgentReview = async () => {
    if (!quoteNumber || !urgentReason.trim()) return;
    
    try {
      await createUrgentReview.mutateAsync({
        quoteNumber,
        reason: urgentReason,
      });
      setUrgentReason('');
      setShowUrgentForm(false);
    } catch (error) {
      console.error('Failed to create urgent review:', error);
    }
  };

  const handleSystemAlert = async () => {
    if (!alertMessage.trim()) return;
    
    try {
      await createSystemAlert.mutateAsync({
        message: alertMessage,
        targetRole: targetRole || undefined,
      });
      setAlertMessage('');
      setTargetRole('');
      setShowAlertForm(false);
    } catch (error) {
      console.error('Failed to create system alert:', error);
    }
  };

  const isGestionnaire = user?.role === 'GESTIONNAIRE_VALIDATION_ARS';
  const isAdmin = user?.role === 'ADMINISTRATEUR_ARS';

  if (!isGestionnaire && !isAdmin) return null;

  return (
    <div className="flex gap-2">
      {/* Urgent Review - Only for Gestionnaires with quote */}
      {isGestionnaire && quoteNumber && (
        <div className="relative">
          <button
            onClick={() => setShowUrgentForm(!showUrgentForm)}
            className="flex items-center gap-2 px-3 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors text-sm"
          >
            <AlertTriangle className="w-4 h-4" />
            Révision urgente
          </button>
          
          {showUrgentForm && (
            <div className="absolute top-full mt-2 right-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Demander une révision urgente
              </h4>
              <textarea
                value={urgentReason}
                onChange={(e) => setUrgentReason(e.target.value)}
                placeholder="Raison de l'urgence..."
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                rows={3}
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleUrgentReview}
                  disabled={!urgentReason.trim() || createUrgentReview.isPending}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Send className="w-4 h-4" />
                  Envoyer
                </button>
                <button
                  onClick={() => setShowUrgentForm(false)}
                  className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* System Alert - Only for Admins */}
      {isAdmin && (
        <div className="relative">
          <button
            onClick={() => setShowAlertForm(!showAlertForm)}
            className="flex items-center gap-2 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors text-sm"
          >
            <Users className="w-4 h-4" />
            Alerte système
          </button>
          
          {showAlertForm && (
            <div className="absolute top-full mt-2 right-0 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-4 z-50">
              <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                Envoyer une alerte système
              </h4>
              <textarea
                value={alertMessage}
                onChange={(e) => setAlertMessage(e.target.value)}
                placeholder="Message d'alerte..."
                className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
                rows={3}
              />
              <select
                value={targetRole}
                onChange={(e) => setTargetRole(e.target.value)}
                className="w-full mt-2 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Tous les rôles</option>
                <option value="ADMINISTRATEUR_ARS">Administrateurs</option>
                <option value="GESTIONNAIRE_VALIDATION_ARS">Gestionnaires</option>
              </select>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSystemAlert}
                  disabled={!alertMessage.trim() || createSystemAlert.isPending}
                  className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                >
                  <Send className="w-4 h-4" />
                  Envoyer
                </button>
                <button
                  onClick={() => setShowAlertForm(false)}
                  className="px-3 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 text-sm"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};