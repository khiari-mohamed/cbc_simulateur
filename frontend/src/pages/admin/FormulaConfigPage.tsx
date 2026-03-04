import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Shield, Calculator, Settings } from 'lucide-react';
import { DcConfigTab } from './formulas/DcConfigTab';
import { FormulaRatesTab } from './formulas/FormulaRatesTab';

export const FormulaConfigPage = () => {
  const [activeTab, setActiveTab] = useState('dc-config');

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Configuration des Formules
            </h1>
            <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-semibold rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" />
              ADMIN ONLY
            </span>
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Gérer les paramètres de calcul des primes - Modifiable sans développeur
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="dc-config" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Dommages Collision
          </TabsTrigger>
          <TabsTrigger value="formula-rates" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Autres Formules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dc-config">
          <DcConfigTab />
        </TabsContent>

        <TabsContent value="formula-rates">
          <FormulaRatesTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FormulaConfigPage;
