import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/Tabs';
import { Shield, Table, Calculator, FileSpreadsheet } from 'lucide-react';
import { RcTableGrid } from '../../components/admin/pricing/RcTableGrid';
import { GuaranteesConfig } from '../../components/admin/pricing/GuaranteesConfig';
import { DcConfigTab } from './formulas/DcConfigTab';

export const PricingManagementPage = () => {
  const [activeTab, setActiveTab] = useState('rc-table');

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Gestion de Tarification
            </h1>
            <span className="px-3 py-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs font-semibold rounded-full flex items-center gap-1">
              <Shield className="w-3 h-3" />
              MODULE ADMIN
            </span>
          </div>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
            Configuration complète des tarifs et formules - Interface simplifiée type Excel
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="rc-table" className="flex items-center gap-2">
            <Table className="w-4 h-4" />
            Tableau RC
          </TabsTrigger>
          <TabsTrigger value="guarantees" className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            Garanties
          </TabsTrigger>
          <TabsTrigger value="dc-config" className="flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Dommages Collision
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rc-table">
          <RcTableGrid />
        </TabsContent>

        <TabsContent value="guarantees">
          <GuaranteesConfig />
        </TabsContent>

        <TabsContent value="dc-config">
          <DcConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PricingManagementPage;
