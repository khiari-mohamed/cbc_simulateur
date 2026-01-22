import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';
import { FormulaType, UsageType } from '../../types';

interface PricingRuleModalProps {
  rule: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const PricingRuleModal = ({ rule, onClose, onSuccess }: PricingRuleModalProps) => {
  const [formData, setFormData] = useState({
    companyId: rule?.companyId || '',
    guaranteeId: rule?.guaranteeId || '',
    conventionId: rule?.conventionId || '',
    formulaType: rule?.formulaType || '',
    minPower: rule?.minPower || '',
    maxPower: rule?.maxPower || '',
    minAge: rule?.minAge || '',
    maxAge: rule?.maxAge || '',
    baseRate: rule?.baseRate || '',
    fixedPremium: rule?.fixedPremium || '',
    multiplier: rule?.multiplier || '',
    reductionRate: rule?.reductionRate || '',
    usageType: rule?.usageType || '',
  });

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data } = await api.get('/companies');
      return data;
    },
  });

  const { data: guarantees } = useQuery({
    queryKey: ['guarantees'],
    queryFn: async () => {
      const { data } = await api.get('/guarantees');
      return data;
    },
  });

  const { data: conventions } = useQuery({
    queryKey: ['conventions'],
    queryFn: async () => {
      const { data } = await api.get('/conventions');
      return data;
    },
  });

  const mutation = useMutation({
    mutationFn: (data: any) =>
      rule
        ? api.patch(`/pricing-rules/${rule.id}`, data)
        : api.post('/pricing-rules', data),
    onSuccess: () => {
      toast.success(rule ? 'Règle modifiée' : 'Règle créée');
      onSuccess();
    },
    onError: () => toast.error('Erreur'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanData = Object.fromEntries(
      Object.entries(formData)
        .filter(([_, v]) => v !== '')
        .map(([k, v]) => {
          // Convert numeric fields to numbers
          if (['minPower', 'maxPower', 'minAge', 'maxAge', 'baseRate', 'fixedPremium', 'multiplier', 'reductionRate'].includes(k)) {
            return [k, parseFloat(v as string)];
          }
          return [k, v];
        })
    );
    mutation.mutate(cleanData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {rule ? 'Modifier' : 'Nouvelle'} règle de tarification
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Select
            label="Compagnie *"
            value={formData.companyId}
            onChange={(e) => setFormData({ ...formData, companyId: e.target.value })}
            required
          >
            <option value="">Sélectionner</option>
            {companies?.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>

          <Select
            label="Garantie *"
            value={formData.guaranteeId}
            onChange={(e) => setFormData({ ...formData, guaranteeId: e.target.value })}
            required
          >
            <option value="">Sélectionner</option>
            {guarantees?.map((g: any) => (
              <option key={g.id} value={g.id}>{g.nameFr}</option>
            ))}
          </Select>

          <Select
            label="Convention (optionnel)"
            value={formData.conventionId}
            onChange={(e) => setFormData({ ...formData, conventionId: e.target.value })}
          >
            <option value="">Aucune</option>
            {conventions?.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>

          <Select
            label="Type de formule"
            value={formData.formulaType}
            onChange={(e) => setFormData({ ...formData, formulaType: e.target.value })}
          >
            <option value="">Toutes</option>
            <option value={FormulaType.STANDARD}>Standard</option>
            <option value={FormulaType.DOMMAGES_COLLISIONS}>Dommages Collisions</option>
            <option value={FormulaType.TOUS_RISQUES_0}>Tous Risques 0%</option>
          </Select>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Puissance min"
              type="number"
              value={formData.minPower}
              onChange={(e) => setFormData({ ...formData, minPower: e.target.value })}
            />
            <Input
              label="Puissance max"
              type="number"
              value={formData.maxPower}
              onChange={(e) => setFormData({ ...formData, maxPower: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Âge véhicule min"
              type="number"
              value={formData.minAge}
              onChange={(e) => setFormData({ ...formData, minAge: e.target.value })}
            />
            <Input
              label="Âge véhicule max"
              type="number"
              value={formData.maxAge}
              onChange={(e) => setFormData({ ...formData, maxAge: e.target.value })}
            />
          </div>

          <Input
            label="Taux de base"
            type="number"
            step="0.0001"
            value={formData.baseRate}
            onChange={(e) => setFormData({ ...formData, baseRate: e.target.value })}
          />

          <Input
            label="Prime fixe (DT)"
            type="number"
            step="0.01"
            value={formData.fixedPremium}
            onChange={(e) => setFormData({ ...formData, fixedPremium: e.target.value })}
          />

          <Input
            label="Multiplicateur"
            type="number"
            step="0.0001"
            value={formData.multiplier}
            onChange={(e) => setFormData({ ...formData, multiplier: e.target.value })}
          />

          <Input
            label="Taux de réduction (%)"
            type="number"
            step="0.01"
            value={formData.reductionRate}
            onChange={(e) => setFormData({ ...formData, reductionRate: e.target.value })}
          />

          <Select
            label="Type d'usage"
            value={formData.usageType}
            onChange={(e) => setFormData({ ...formData, usageType: e.target.value })}
          >
            <option value="">Tous</option>
            <option value={UsageType.PRIVATE}>Privé</option>
            <option value={UsageType.COMMERCIAL}>Commercial</option>
            <option value={UsageType.TAXI}>Taxi</option>
            <option value={UsageType.RENTAL}>Location</option>
          </Select>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" disabled={mutation.isPending}>
              {mutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
