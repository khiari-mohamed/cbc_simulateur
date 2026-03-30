import type { ReactNode } from 'react';
import { Shield, Lock, Headset } from 'lucide-react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Column - Premium Branding Panel */}
      <div className="hidden lg:flex lg:w-[48%] xl:w-[45%] relative overflow-hidden">
        {/* Background Image */}
        <img
          src="https://images.pexels.com/photos/1102845/pexels-photo-1102845.jpeg?auto=compress&cs=tinysrgb&w=1200"
          alt="Modern glass building"
          className="absolute inset-0 w-full h-full object-cover"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-primary-900/85" />

        <div className="relative z-10 flex flex-col justify-between w-full p-10 xl:p-14">
          {/* Logo + Brand */}
          <div className="flex items-center gap-3">
            <img src="/Image1.png" alt="ARS Assurance" className="h-10 w-auto brightness-0 invert" />
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">ARS Assurance</h1>
              <p className="text-xs text-blue-300/80 font-medium tracking-wide uppercase">Courtage d'Assurance</p>
            </div>
          </div>

          {/* Center content */}
          <div className="flex-1 flex flex-col justify-center max-w-md py-12">
            <h2 className="text-3xl xl:text-4xl font-bold text-white leading-tight mb-4">
              Votre plateforme de<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-300">
                courtage intelligent
              </span>
            </h2>
            <p className="text-base text-slate-300 leading-relaxed mb-10">
              Gérez vos simulations, devis et contrats d'assurance automobile en toute simplicité.
            </p>

            {/* Feature highlights */}
            <div className="space-y-4">
              <FeatureItem
                icon={<Shield className="w-5 h-5" />}
                title="Protection des données"
                description="Conforme RGPD, vos données sont chiffrées et sécurisées"
              />
              <FeatureItem
                icon={<Lock className="w-5 h-5" />}
                title="Sécurité renforcée"
                description="Authentification multi-facteurs et surveillance 24/7"
              />
              <FeatureItem
                icon={<Headset className="w-5 h-5" />}
                title="Support dédié"
                description="Équipe d'experts disponible pour vous accompagner"
              />
            </div>
          </div>

          {/* Footer */}
          <p className="text-slate-500 text-xs">
            © {new Date().getFullYear()} ARS Assurance. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-12 bg-white dark:bg-gray-950">
        <div className="w-full max-w-[420px]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8 text-center">
            <img src="/Image1.png" alt="ARS Assurance" className="h-11 w-auto mx-auto mb-3" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">ARS Assurance</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Plateforme de Courtage d'Assurance</p>
          </div>

          {/* Form header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">{title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{subtitle}</p>
          </div>

          {/* Form content */}
          {children}
        </div>
      </div>
    </div>
  );
};

function FeatureItem({ icon, title, description }: { icon: ReactNode; title: string; description: string }) {
  return (
    <div className="flex items-start gap-3.5 group">
      <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 flex items-center justify-center text-blue-400 group-hover:bg-white/15 transition-colors">
        {icon}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs text-slate-400 leading-relaxed mt-0.5">{description}</p>
      </div>
    </div>
  );
}
