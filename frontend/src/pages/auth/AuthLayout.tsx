import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout = ({ children, title, subtitle }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Column - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-gray-50 to-gray-100 p-8 xl:p-12 flex-col justify-center items-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiMzQjgyRjYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PHBhdGggZD0iTTM2IDE2YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00em0wIDI0YzAtMi4yMSAxLjc5LTQgNC00czQgMS43OSA0IDQtMS43OSA0LTQgNC00LTEuNzktNC00ek0xMiAxNmMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHptMCAyNGMwLTIuMjEgMS43OS00IDQtNHM0IDEuNzkgNCA0LTEuNzkgNC00IDQtNC0xLjc5LTQtNHoiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-50"></div>
        
        <div className="relative z-10 text-center max-w-lg w-full">
          <div className="flex justify-center mb-8">
            <img src="/Image1.png" alt="ARS Assurance" className="h-20 w-auto" />
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            ARS Assurance
          </h1>
          <p className="text-lg text-gray-600 mb-12">
            Plateforme de Courtage d'Assurance
          </p>

          {/* Premium Multi-Line Chart */}
          <svg viewBox="0 0 400 300" className="w-full h-auto drop-shadow-lg">
            <defs>
              <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
              </linearGradient>
              <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            
            {/* Y-axis */}
            <line x1="40" y1="50" x2="40" y2="200" stroke="#D1D5DB" strokeWidth="2" />
            <text x="25" y="55" fontSize="11" fill="#6B7280" textAnchor="end" fontWeight="500">100</text>
            <text x="25" y="105" fontSize="11" fill="#9CA3AF" textAnchor="end">75</text>
            <text x="25" y="155" fontSize="11" fill="#9CA3AF" textAnchor="end">50</text>
            <text x="25" y="205" fontSize="11" fill="#9CA3AF" textAnchor="end">25</text>
            
            {/* X-axis */}
            <line x1="40" y1="200" x2="360" y2="200" stroke="#D1D5DB" strokeWidth="2" />
            
            {/* Grid Lines */}
            <line x1="40" y1="50" x2="360" y2="50" stroke="#F3F4F6" strokeWidth="1" />
            <line x1="40" y1="100" x2="360" y2="100" stroke="#F3F4F6" strokeWidth="1" />
            <line x1="40" y1="150" x2="360" y2="150" stroke="#F3F4F6" strokeWidth="1" />
            
            {/* Area Fill - Blue */}
            <polygon
              points="40,180 120,145 200,110 280,75 360,55 360,200 40,200"
              fill="url(#blueGradient)"
            />
            
            {/* Line 1 - Compagnie A (Blue) */}
            <polyline
              points="40,180 120,145 200,110 280,75 360,55"
              fill="none"
              stroke="#3B82F6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glow)"
            />
            <circle cx="40" cy="180" r="4" fill="white" stroke="#3B82F6" strokeWidth="2" />
            <circle cx="120" cy="145" r="4" fill="white" stroke="#3B82F6" strokeWidth="2" />
            <circle cx="200" cy="110" r="4" fill="white" stroke="#3B82F6" strokeWidth="2" />
            <circle cx="280" cy="75" r="4" fill="white" stroke="#3B82F6" strokeWidth="2" />
            <circle cx="360" cy="55" r="5" fill="#3B82F6" stroke="white" strokeWidth="2" />
            
            {/* Line 2 - Compagnie B (Purple) */}
            <polyline
              points="40,190 120,160 200,125 280,90 360,70"
              fill="none"
              stroke="#8B5CF6"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
            <circle cx="40" cy="190" r="4" fill="white" stroke="#8B5CF6" strokeWidth="2" />
            <circle cx="120" cy="160" r="4" fill="white" stroke="#8B5CF6" strokeWidth="2" />
            <circle cx="200" cy="125" r="4" fill="white" stroke="#8B5CF6" strokeWidth="2" />
            <circle cx="280" cy="90" r="4" fill="white" stroke="#8B5CF6" strokeWidth="2" />
            <circle cx="360" cy="70" r="5" fill="#8B5CF6" stroke="white" strokeWidth="2" />
            
            {/* Line 3 - Compagnie C (Green) */}
            <polyline
              points="40,185 120,155 200,120 280,85 360,60"
              fill="none"
              stroke="#10B981"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            />
            <circle cx="40" cy="185" r="4" fill="white" stroke="#10B981" strokeWidth="2" />
            <circle cx="120" cy="155" r="4" fill="white" stroke="#10B981" strokeWidth="2" />
            <circle cx="200" cy="120" r="4" fill="white" stroke="#10B981" strokeWidth="2" />
            <circle cx="280" cy="85" r="4" fill="white" stroke="#10B981" strokeWidth="2" />
            <circle cx="360" cy="60" r="5" fill="#10B981" stroke="white" strokeWidth="2" />
            
            {/* Line 4 - Compagnie D (Orange) */}
            <polyline
              points="40,195 120,165 200,130 280,95 360,75"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.8"
            />
            <circle cx="40" cy="195" r="4" fill="white" stroke="#F59E0B" strokeWidth="2" />
            <circle cx="120" cy="165" r="4" fill="white" stroke="#F59E0B" strokeWidth="2" />
            <circle cx="200" cy="130" r="4" fill="white" stroke="#F59E0B" strokeWidth="2" />
            <circle cx="280" cy="95" r="4" fill="white" stroke="#F59E0B" strokeWidth="2" />
            <circle cx="360" cy="75" r="5" fill="#F59E0B" stroke="white" strokeWidth="2" />
            
            {/* X-axis Labels */}
            <text x="40" y="220" fontSize="12" fill="#6B7280" textAnchor="middle" fontWeight="500">Jan</text>
            <text x="120" y="220" fontSize="12" fill="#6B7280" textAnchor="middle" fontWeight="500">Fév</text>
            <text x="200" y="220" fontSize="12" fill="#6B7280" textAnchor="middle" fontWeight="500">Mar</text>
            <text x="280" y="220" fontSize="12" fill="#6B7280" textAnchor="middle" fontWeight="500">Avr</text>
            <text x="360" y="220" fontSize="12" fill="#6B7280" textAnchor="middle" fontWeight="600">Mai</text>
            
            {/* Legend with Background */}
            <rect x="35" y="250" width="330" height="30" rx="8" fill="white" opacity="0.9" />
            
            <circle cx="50" cy="265" r="4" fill="#3B82F6" />
            <text x="60" y="268" fontSize="11" fill="#374151" fontWeight="500">Compagnie A</text>
            
            <circle cx="145" cy="265" r="4" fill="#8B5CF6" />
            <text x="155" y="268" fontSize="11" fill="#374151" fontWeight="500">Compagnie B</text>
            
            <circle cx="240" cy="265" r="4" fill="#10B981" />
            <text x="250" y="268" fontSize="11" fill="#374151" fontWeight="500">Compagnie C</text>
            
            <circle cx="335" cy="265" r="4" fill="#F59E0B" />
            <text x="345" y="268" fontSize="11" fill="#374151" fontWeight="500">Compagnie D</text>
          </svg>

          <p className="text-gray-500 text-xs mt-8">
            © 2024 ARS Assurance. Tous droits réservés.
          </p>
        </div>
      </div>

      {/* Right Column - Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gray-50 dark:bg-gray-950">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6 md:mb-8 text-center">
            <img src="/Image1.png" alt="ARS Assurance" className="h-10 sm:h-12 w-auto mx-auto mb-3 md:mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">ARS Assurance</h1>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-800 p-4 sm:p-5">
            <div className="mb-3 sm:mb-4">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 dark:text-white mb-0.5">{title}</h2>
              <p className="text-xs text-gray-600 dark:text-gray-400">{subtitle}</p>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
