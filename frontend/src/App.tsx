import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { GoogleCallback } from './pages/auth/GoogleCallback';
import { CompaniesPage } from './pages/admin/companies/CompaniesPage';
import { ConventionsPage } from './pages/admin/Conventions/ConventionsPage';
import { GuaranteesPage } from './pages/admin/Guarantees/GuaranteesPage';

import { UsersManagementPage } from './pages/admin/users/UsersManagementPage';
import { ReportsPage } from './pages/admin/reports/ReportsPage';
import { PricingRulesPage } from './pages/admin/PricingRulesPage';
import { ValidationPage } from './pages/admin/ValidationPage';
import { GestionnaireValidationPage } from './pages/admin/GestionnaireValidationPage';
import { GestionnaireQuoteEditPage } from './pages/admin/GestionnaireQuoteEditPage';
import { NotificationAnalyticsPage } from './pages/admin/NotificationAnalyticsPage';
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage';
import { ConventionReportsPage } from './pages/admin/ConventionReportsPage';
import { MainLayout } from './components/layout/MainLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { NewSimulationPage } from './pages/simulations/NewSimulationPage';
import { SimulationsPage } from './pages/simulations/SimulationsPage';
import { SimulationDetailPage } from './pages/simulations/SimulationDetailPage';
import { QuotesPage } from './pages/quotes/QuotesPage';
import { QuoteComparisonPage } from './pages/quotes/QuoteComparisonPage';
import { PaymentCheckoutPage } from './pages/quotes/PaymentCheckoutPage';
import { PaymentSuccessPage } from './pages/quotes/PaymentSuccessPage';
import { PaymentCancelPage } from './pages/quotes/PaymentCancelPage';
import { ContractsPage } from './pages/Contracts/ContractsPage';
import { ContractDetailPage } from './pages/Contracts/ContractDetailPage';
import { SettingsPage } from './pages/SettingsPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { DocumentsPage } from './pages/DocumentsPage';
import { SystemGuidePage } from './pages/admin/SystemGuidePage';
import { Role } from './types/index';

const queryClient = new QueryClient();

const ProtectedRoute = ({ children, allowedRoles }: { children: React.ReactNode; allowedRoles?: Role[] }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route path="/auth/google/callback" element={<GoogleCallback />} />
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/simulations" element={<SimulationsPage />} />
                <Route path="/simulations/new" element={<NewSimulationPage />} />
                <Route path="/simulations/:id" element={<SimulationDetailPage />} />
                <Route path="/quotes" element={<QuotesPage />} />
                <Route path="/quotes/compare" element={<QuoteComparisonPage />} />
                <Route path="/quotes/:quoteId/checkout" element={<PaymentCheckoutPage />} />
                <Route path="/payment/success" element={<PaymentSuccessPage />} />
                <Route path="/payment/cancel" element={<PaymentCancelPage />} />
                <Route path="/contracts" element={<ContractsPage />} />
                <Route path="/contracts/:contractNumber" element={<ContractDetailPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/documents" element={<DocumentsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route
                  path="/admin/companies"
                  element={
                    <ProtectedRoute allowedRoles={[Role.ADMINISTRATEUR_ARS]}>
                      <CompaniesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/conventions"
                  element={
                    <ProtectedRoute allowedRoles={[Role.ADMINISTRATEUR_ARS]}>
                      <ConventionsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/guarantees"
                  element={
                    <ProtectedRoute allowedRoles={[Role.ADMINISTRATEUR_ARS]}>
                      <GuaranteesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/users"
                  element={
                    <ProtectedRoute allowedRoles={[Role.ADMINISTRATEUR_ARS]}>
                      <UsersManagementPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/reports"
                  element={
                    <ProtectedRoute allowedRoles={[Role.ADMINISTRATEUR_ARS]}>
                      <ReportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/pricing-rules"
                  element={
                    <ProtectedRoute allowedRoles={[Role.ADMINISTRATEUR_ARS]}>
                      <PricingRulesPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/validation"
                  element={
                    <ProtectedRoute allowedRoles={[Role.ADMINISTRATEUR_ARS]}>
                      <ValidationPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/gestionnaire-validation"
                  element={
                    <ProtectedRoute allowedRoles={[Role.GESTIONNAIRE_VALIDATION_ARS]}>
                      <GestionnaireValidationPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/quotes/:id/edit"
                  element={
                    <ProtectedRoute allowedRoles={[Role.GESTIONNAIRE_VALIDATION_ARS]}>
                      <GestionnaireQuoteEditPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/notification-analytics"
                  element={
                    <ProtectedRoute allowedRoles={[Role.ADMINISTRATEUR_ARS]}>
                      <NotificationAnalyticsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/settings"
                  element={
                    <ProtectedRoute allowedRoles={[Role.ADMINISTRATEUR_ARS]}>
                      <AdminSettingsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/convention-reports"
                  element={
                    <ProtectedRoute allowedRoles={[Role.ADMINISTRATEUR_ARS]}>
                      <ConventionReportsPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/system-guide"
                  element={
                    <ProtectedRoute allowedRoles={[Role.ADMINISTRATEUR_ARS]}>
                      <SystemGuidePage />
                    </ProtectedRoute>
                  }
                />
              </Route>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <Toaster position="top-right" />
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
