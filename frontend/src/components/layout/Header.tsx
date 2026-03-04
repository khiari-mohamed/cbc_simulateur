import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Search, Menu } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageSwitcher } from '../ui/LanguageSwitcher';
import { UnifiedNotificationDropdown } from '../ui/UnifiedNotificationDropdown';
import { useQuery } from '@tanstack/react-query';
import api from '../../lib/api/client';

interface HeaderProps {
  onMenuClick: () => void;
}

export const Header = ({ onMenuClick }: HeaderProps) => {
  const { theme, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);

  const { data: searchResults } = useQuery({
    queryKey: ['search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return { quotes: [], simulations: [], contracts: [] };
      
      const [quotesRes, simulationsRes, contractsRes] = await Promise.all([
        api.get('/quotes').catch(() => ({ data: [] })),
        api.get('/simulations').catch(() => ({ data: [] })),
        api.get('/contracts').catch(() => ({ data: [] })),
      ]);

      const query = searchQuery.toLowerCase();
      
      const quotes = quotesRes.data.filter((q: any) => 
        q.quoteNumber?.toLowerCase().includes(query) ||
        (q.displayNumber && `devis-${String(q.displayNumber).padStart(5, '0')}`.toLowerCase().includes(query)) ||
        q.company?.name?.toLowerCase().includes(query) ||
        q.user?.email?.toLowerCase().includes(query) ||
        q.simulation?.vehicle?.registration?.toLowerCase().includes(query)
      ).slice(0, 5);

      const simulations = simulationsRes.data.filter((s: any) =>
        s.vehicle?.registration?.toLowerCase().includes(query) ||
        s.id?.toLowerCase().includes(query)
      ).slice(0, 5);

      const contracts = contractsRes.data.filter((c: any) =>
        c.contractNumber?.toLowerCase().includes(query) ||
        c.user?.email?.toLowerCase().includes(query)
      ).slice(0, 5);

      return { quotes, simulations, contracts };
    },
    enabled: searchQuery.length >= 2,
  });

  const handleResultClick = (type: string, id: string) => {
    setSearchQuery('');
    setShowResults(false);
    if (type === 'quote') navigate('/quotes');
    else if (type === 'simulation') navigate(`/simulations/${id}`);
    else if (type === 'contract') navigate('/contracts');
  };

  const totalResults = (searchResults?.quotes?.length || 0) + (searchResults?.simulations?.length || 0) + (searchResults?.contracts?.length || 0);

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
      <div className="flex h-16 items-center justify-between px-4 md:px-6">
        <div className="flex items-center gap-4 flex-1">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          <div className="relative max-w-md w-full hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={t('common.search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowResults(true)}
              onBlur={() => setTimeout(() => setShowResults(false), 200)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {showResults && searchQuery.length >= 2 && (
              <div className="absolute top-full mt-2 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                {totalResults === 0 ? (
                  <div className="p-4 text-sm text-gray-500 dark:text-gray-400 text-center">
                    Aucun résultat trouvé
                  </div>
                ) : (
                  <>
                    {searchResults?.quotes && searchResults.quotes.length > 0 && (
                      <div className="p-2">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">Devis</div>
                        {searchResults.quotes.map((quote: any) => (
                          <button
                            key={quote.id}
                            onMouseDown={() => handleResultClick('quote', quote.id)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm"
                          >
                            <div className="font-medium text-gray-900 dark:text-white">
                              {quote.displayNumber ? `DEVIS-${String(quote.displayNumber).padStart(5, '0')}` : quote.quoteNumber}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {quote.company?.name} - {quote.totalAPayer?.toLocaleString()} DT
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults?.simulations && searchResults.simulations.length > 0 && (
                      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">Simulations</div>
                        {searchResults.simulations.map((sim: any) => (
                          <button
                            key={sim.id}
                            onMouseDown={() => handleResultClick('simulation', sim.id)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm"
                          >
                            <div className="font-medium text-gray-900 dark:text-white">
                              {sim.vehicle?.registration || 'Sans immatriculation'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {sim.formulaType} - {sim.status}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {searchResults?.contracts && searchResults.contracts.length > 0 && (
                      <div className="p-2 border-t border-gray-200 dark:border-gray-700">
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">Contrats</div>
                        {searchResults.contracts.map((contract: any) => (
                          <button
                            key={contract.id}
                            onMouseDown={() => handleResultClick('contract', contract.id)}
                            className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-sm"
                          >
                            <div className="font-medium text-gray-900 dark:text-white">
                              {contract.contractNumber}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {contract.status}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <LanguageSwitcher />
          
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          <UnifiedNotificationDropdown />
        </div>
      </div>
    </header>
  );
};
