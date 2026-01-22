import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Role } from '../../types/index';
import {
  LayoutDashboard,
  FileText,
  List,
  FileCheck,
  Building2,
  Settings,
  Users,
  BarChart3,
  Shield,
  LogOut,
  FileSignature,
  DollarSign,
  ClipboardCheck,
  X,
} from 'lucide-react';

interface NavItem {
  icon: any;
  label: string;
  path: string;
  roles?: Role[];
}

const getNavItems = (t: (key: string) => string): NavItem[] => [
  { icon: LayoutDashboard, label: t('nav.dashboard'), path: '/dashboard' },
  { icon: FileText, label: t('nav.newSimulation'), path: '/simulations/new', roles: [Role.CLIENT_ADHERENT] },
  { icon: List, label: t('nav.simulations'), path: '/simulations', roles: [Role.CLIENT_ADHERENT] },
  { icon: FileCheck, label: t('nav.quotes'), path: '/quotes', roles: [Role.CLIENT_ADHERENT] },
  { icon: FileSignature, label: t('nav.contracts'), path: '/contracts', roles: [Role.CLIENT_ADHERENT] },
  { icon: Building2, label: t('nav.companies'), path: '/admin/companies', roles: [Role.ADMINISTRATEUR_ARS] },
  { icon: Shield, label: t('nav.conventions'), path: '/admin/conventions', roles: [Role.ADMINISTRATEUR_ARS] },
  { icon: Shield, label: t('nav.guarantees'), path: '/admin/guarantees', roles: [Role.ADMINISTRATEUR_ARS] },
  { icon: DollarSign, label: t('nav.pricing'), path: '/admin/pricing-rules', roles: [Role.ADMINISTRATEUR_ARS] },
  { icon: ClipboardCheck, label: t('nav.validation'), path: '/admin/validation', roles: [Role.ADMINISTRATEUR_ARS] },
  { icon: ClipboardCheck, label: t('nav.validationTech'), path: '/admin/gestionnaire-validation', roles: [Role.GESTIONNAIRE_VALIDATION_ARS] },
  { icon: Users, label: t('nav.users'), path: '/admin/users', roles: [Role.ADMINISTRATEUR_ARS] },
  { icon: BarChart3, label: t('nav.reports'), path: '/admin/reports', roles: [Role.ADMINISTRATEUR_ARS] },
  { icon: Settings, label: t('nav.settings'), path: '/settings' },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { user, logout } = useAuth();
  const { t } = useLanguage();

  const navItems = getNavItems(t);
  const filteredItems = navItems.filter(item => 
    !item.roles || item.roles.includes(user?.role as Role)
  );

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed lg:sticky top-0 left-0 z-50 w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col h-screen transition-transform duration-300 ease-in-out lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t('app.title')}</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t('app.subtitle')}</p>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/20 flex items-center justify-center">
            <span className="text-sm font-semibold text-primary-600 dark:text-primary-400">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {user?.firstName} {user?.lastName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">{t('auth.logout')}</span>
        </button>
      </div>
    </aside>
    </>
  );
};
