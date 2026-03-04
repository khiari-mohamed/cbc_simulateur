import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { Plus, Trash2 } from 'lucide-react';
import { AddFormulaModal } from '../../../components/admin/AddFormulaModal';
import api from '../../../lib/api/client';
import toast from 'react-hot-toast';

export const FormulaRatesTab = () => {
  const queryClient = useQueryClient();
  const [selectedCompany, setSelectedCompany] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'VOL' | 'INCENDIE' | 'BG' | 'TOUS_RISQUES' | 'ASSISTANCE' | 'CAS' | 'PTA' | 'INCENDIE_EMEUTES' | 'DOMMAGES_EMEUTES' | 'CAT_NAT'>('VOL');

  const { data: companies, isLoading: companiesLoading, error: companiesError } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data } = await api.get('/companies');
      return data;
    },
  });

  const { data: guarantees, isLoading: guaranteesLoading, error: guaranteesError } = useQuery({
    queryKey: ['guarantees'],
    queryFn: async () => {
      const { data } = await api.get('/guarantees');
      return data;
    },
  });

  const { data: pricingRules, isLoading } = useQuery({
    queryKey: ['pricing-rules', selectedCompany],
    queryFn: async () => {
      if (!selectedCompany) return [];
      const { data } = await api.get(`/pricing-rules?companyId=${selectedCompany}`);
      return data;
    },
    enabled: !!selectedCompany,
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: any) => {
      const { data } = await api.patch(`/pricing-rules/${id}`, values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      toast.success('Taux mis à jour');
    },
    onError: () => toast.error('Erreur lors de la mise à jour'),
  });

  const createMutation = useMutation({
    mutationFn: async (values: any) => {
      const { data } = await api.post('/pricing-rules', values);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      toast.success('Règle créée');
    },
    onError: () => toast.error('Erreur lors de la création'),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/pricing-rules/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-rules'] });
      toast.success('Règle supprimée');
    },
    onError: () => toast.error('Erreur lors de la suppression'),
  });

  const getGuaranteeRules = (code: string) => {
    const guarantee = guarantees?.find((g: any) => g.code === code);
    if (!guarantee) return [];
    return pricingRules?.filter((r: any) => r.guaranteeId === guarantee.id) || [];
  };

  const handleUpdate = (ruleId: string, field: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) {
      toast.error('Valeur invalide');
      return;
    }
    updateMutation.mutate({ id: ruleId, values: { [field]: numValue } });
  };

  const handleCreate = (guaranteeCode: string, additionalFields: any = {}) => {
    const guarantee = guarantees?.find((g: any) => g.code === guaranteeCode);
    if (!guarantee) {
      toast.error('Garantie introuvable');
      return;
    }
    createMutation.mutate({
      companyId: selectedCompany,
      guaranteeId: guarantee.id,
      ...additionalFields,
    });
  };

  const openModal = (type: typeof modalType) => {
    setModalType(type);
    setModalOpen(true);
  };

  const handleModalSubmit = (data: any) => {
    const guaranteeMap: Record<typeof modalType, string> = {
      VOL: 'VOL',
      INCENDIE: 'INCENDIE',
      BG: 'BG',
      TOUS_RISQUES: 'TOUS_RISQUES_ZERO',
      ASSISTANCE: 'ASSISTANCE',
      CAS: 'CAS',
      PTA: 'PERSONNES_TRANSPORTEES',
      INCENDIE_EMEUTES: 'INCENDIE_EMEUTES',
      DOMMAGES_EMEUTES: 'DOMMAGES_EMEUTES',
      CAT_NAT: 'CATASTROPHES_NATURELLES',
    };
    handleCreate(guaranteeMap[modalType], data);
  };

  if (companiesError || guaranteesError) {
    return (
      <div className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
        <p className="text-red-800 dark:text-red-200">Erreur lors du chargement des données. Vérifiez votre connexion API.</p>
        <p className="text-sm text-red-600 dark:text-red-300 mt-2">
          {companiesError ? 'Erreur compagnies: ' + (companiesError as any).message : ''}
          {guaranteesError ? 'Erreur garanties: ' + (guaranteesError as any).message : ''}
        </p>
      </div>
    );
  }

  if (companiesLoading || guaranteesLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AddFormulaModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleModalSubmit}
        type={modalType}
      />

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Sélection Compagnie
        </h2>
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
        >
          <option value="">Sélectionner une compagnie</option>
          {companies?.map((c: any) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </Card>

      {selectedCompany && !isLoading && (
        <>
          {/* VOL */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">VOL (Theft)</h3>
              <Button size="sm" onClick={() => openModal('VOL')}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {getGuaranteeRules('VOL').map((rule: any) => (
              <div key={rule.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Taux (coefficient décimal, ex: 0.00236)
                  </label>
                  <input
                    type="number"
                    step="0.00001"
                    defaultValue={Number(rule.ratePercentage || 0)}
                    onBlur={(e) => handleUpdate(rule.id, 'ratePercentage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prime Fixe (DT)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={Number(rule.fixedPremium || 0)}
                    onBlur={(e) => handleUpdate(rule.id, 'fixedPremium', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Réduction (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={Number(rule.reductionRate || 0)}
                    onBlur={(e) => handleUpdate(rule.id, 'reductionRate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Actions
                  </label>
                  <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(rule.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </Card>

          {/* INCENDIE */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">INCENDIE (Fire)</h3>
              <Button size="sm" onClick={() => openModal('INCENDIE')}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {getGuaranteeRules('INCENDIE').map((rule: any) => (
              <div key={rule.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Taux (coefficient décimal)
                  </label>
                  <input
                    type="number"
                    step="0.00001"
                    defaultValue={Number(rule.ratePercentage || 0)}
                    onBlur={(e) => handleUpdate(rule.id, 'ratePercentage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prime Fixe (DT)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={Number(rule.fixedPremium || 0)}
                    onBlur={(e) => handleUpdate(rule.id, 'fixedPremium', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Réduction (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={Number(rule.reductionRate || 0)}
                    onBlur={(e) => handleUpdate(rule.id, 'reductionRate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Actions
                  </label>
                  <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(rule.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </Card>

          {/* BG */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">BG (Glass Breakage)</h3>
              <Button size="sm" onClick={() => openModal('BG')}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {getGuaranteeRules('BG').map((rule: any) => (
              <div key={rule.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Taux (coefficient décimal)
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    defaultValue={Number(rule.ratePercentage || 0)}
                    onBlur={(e) => handleUpdate(rule.id, 'ratePercentage', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Réduction (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={Number(rule.reductionRate || 0)}
                    onBlur={(e) => handleUpdate(rule.id, 'reductionRate', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Actions
                  </label>
                  <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(rule.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </Card>

          {/* TOUS_RISQUES */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">TOUS RISQUES (All Risks)</h3>
              <Button size="sm" onClick={() => openModal('TOUS_RISQUES')}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              {getGuaranteeRules('TOUS_RISQUES_ZERO').map((rule: any) => (
                <div key={rule.id} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                    Franchise: {rule.franchiseRate}%
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Taux (coefficient décimal)
                      </label>
                      <input
                        type="number"
                        step="0.0001"
                        defaultValue={Number(rule.ratePercentage || 0)}
                        onBlur={(e) => handleUpdate(rule.id, 'ratePercentage', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Prime Fixe (DT)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={Number(rule.fixedPremium || 0)}
                        onBlur={(e) => handleUpdate(rule.id, 'fixedPremium', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Réduction (%)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={Number(rule.reductionRate || 0)}
                        onBlur={(e) => handleUpdate(rule.id, 'reductionRate', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Actions
                      </label>
                      <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(rule.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* ASSISTANCE */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">ASSISTANCE</h3>
              <Button size="sm" onClick={() => openModal('ASSISTANCE')}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {getGuaranteeRules('ASSISTANCE').map((rule: any) => (
              <div key={rule.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prime Fixe (DT)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={Number(rule.fixedPremium || 0)}
                    onBlur={(e) => handleUpdate(rule.id, 'fixedPremium', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Actions
                  </label>
                  <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(rule.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </Card>

          {/* CAS */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">CAS (Corporel Accident Siège)</h3>
              <Button size="sm" onClick={() => openModal('CAS')}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {getGuaranteeRules('CAS').map((rule: any) => (
              <div key={rule.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prime Fixe (DT)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={Number(rule.fixedPremium || 0)}
                    onBlur={(e) => handleUpdate(rule.id, 'fixedPremium', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Actions
                  </label>
                  <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(rule.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </Card>

          {/* PERSONNES_TRANSPORTEES (PTA) */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">PTA (Protection du Tiers Accompagnant)</h3>
              <Button size="sm" onClick={() => openModal('PTA')}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              {getGuaranteeRules('PERSONNES_TRANSPORTEES').map((rule: any) => (
                <div key={rule.id} className="border-b border-gray-200 dark:border-gray-700 pb-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Capital (DT)
                      </label>
                      <input
                        type="number"
                        defaultValue={Number(rule.minCapital || 0)}
                        onBlur={(e) => handleUpdate(rule.id, 'minCapital', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Prime (DT)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        defaultValue={Number(rule.fixedPremium || 0)}
                        onBlur={(e) => handleUpdate(rule.id, 'fixedPremium', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Actions
                      </label>
                      <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(rule.id)}>
                        <Trash2 className="w-4 h-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* INCENDIE_EMEUTES */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">INCENDIE Suite Émeutes</h3>
              <Button size="sm" onClick={() => openModal('INCENDIE_EMEUTES')}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {getGuaranteeRules('INCENDIE_EMEUTES').map((rule: any) => (
              <div key={rule.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prime Fixe (DT)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={Number(rule.fixedPremium || 0)}
                    onBlur={(e) => handleUpdate(rule.id, 'fixedPremium', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Actions
                  </label>
                  <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(rule.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </Card>

          {/* DOMMAGES_EMEUTES */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">DOMMAGES Suite Émeutes</h3>
              <Button size="sm" onClick={() => openModal('DOMMAGES_EMEUTES')}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {getGuaranteeRules('DOMMAGES_EMEUTES').map((rule: any) => (
              <div key={rule.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prime Fixe (DT)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={Number(rule.fixedPremium || 0)}
                    onBlur={(e) => handleUpdate(rule.id, 'fixedPremium', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Actions
                  </label>
                  <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(rule.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </Card>

          {/* CATASTROPHES_NATURELLES */}
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">CAT NAT (Catastrophes Naturelles)</h3>
              <Button size="sm" onClick={() => openModal('CAT_NAT')}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            {getGuaranteeRules('CATASTROPHES_NATURELLES').map((rule: any) => (
              <div key={rule.id} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Prime Fixe (DT)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    defaultValue={Number(rule.fixedPremium || 0)}
                    onBlur={(e) => handleUpdate(rule.id, 'fixedPremium', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Actions
                  </label>
                  <Button size="sm" variant="outline" onClick={() => deleteMutation.mutate(rule.id)}>
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </Button>
                </div>
              </div>
            ))}
          </Card>
        </>
      )}
    </div>
  );
};
