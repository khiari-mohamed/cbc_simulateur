import { useAuth } from '../../contexts/AuthContext';
import { Role } from '../../types';
import { ClientDashboard } from './ClientDashboard';
import { AdminDashboard } from './AdminDashboard';
import { GestionnaireDashboard } from './GestionnaireDashboard';

export const DashboardPage = () => {
  const { user } = useAuth();

  if (user?.role === Role.ADMINISTRATEUR_ARS) {
    return <AdminDashboard />;
  }

  if (user?.role === Role.GESTIONNAIRE_VALIDATION_ARS) {
    return <GestionnaireDashboard />;
  }

  return <ClientDashboard />;
};
