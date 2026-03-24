import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { X, Info } from 'lucide-react';
import { Button } from '../ui/Button';
import { Select } from '../ui/Select';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';
import { BgCapitalLimitModal } from './BgCapitalLimitModal';

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
    formula: rule?.formula || '',
    bonusMalusClass: rule?.bonusMalusClass || '',
    minPower: rule?.minPower || '',
    maxPower: rule?.maxPower || '',
    minCapital: rule?.minCapital || '',
    maxCapital: rule?.maxCapital || '',
    franchiseRate: rule?.franchiseRate || '',
    ratePercentage: rule?.ratePercentage || '',
    minAge: rule?.minAge || '',
    maxAge: rule?.maxAge || '',
    baseRate: rule?.baseRate || '',
    fixedPremium: rule?.fixedPremium || '',
    multiplier: rule?.multiplier || '',
    reductionRate: rule?.reductionRate || '',
    usageType: rule?.usageType || '',
  });

  const [selectedGuarantee, setSelectedGuarantee] = useState<any>(null);
  const [isBgLimitModalOpen, setIsBgLimitModalOpen] = useState(false);

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

  useEffect(() => {
    if (formData.guaranteeId && guarantees) {
      const guarantee = guarantees.find((g: any) => g.id === formData.guaranteeId);
      setSelectedGuarantee(guarantee);
      console.log('Selected guarantee:', guarantee); // Debug log
    }
  }, [formData.guaranteeId, guarantees]);

  const { data: conventions } = useQuery({
    queryKey: ['conventions'],
    queryFn: async () => {
      const { data } = await api.get('/conventions');
      return data;
    },
  });

  const { data: usageTypes } = useQuery({
    queryKey: ['usage-types'],
    queryFn: async () => {
      const { data } = await api.get('/usage-types');
      return data;
    },
  });

  const { data: franchiseValues } = useQuery({
    queryKey: ['franchise-values'],
    queryFn: async () => {
      const { data } = await api.get('/franchise-values');
      return data;
    },
  });

  // Formula types are enum values - hardcoded since they're not in a table
  const formulaTypes = [
    { code: 'STANDARD', nameFr: 'Standard' },
    { code: 'DOMMAGES_COLLISIONS', nameFr: 'Dommages Collision' },
    { code: 'TOUS_RISQUES_0', nameFr: 'Tous Risques 0%' },
  ];

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
          if (['minPower', 'maxPower', 'bonusMalusClass', 'minCapital', 'maxCapital', 'franchiseRate', 'minAge', 'maxAge', 'baseRate', 'fixedPremium', 'multiplier', 'reductionRate', 'ratePercentage'].includes(k)) {
            return [k, parseFloat(v as string)];
          }
          return [k, v];
        })
    );
    mutation.mutate(cleanData);
  };

  const getFormulaHint = () => {
    if (!selectedGuarantee) return null;
    const hints: Record<string, string> = {
      'RC': 'Tableau RC: 8 classes × 5 tranches CV (3-4, 5-6, 7-10, 11-14, ≥15 CV)',
      'VOL': 'Formule: (((valeur vénale × 2.36) / 1000) + 30) × taux réduction',
      'INCENDIE': 'Formule: (((valeur vénale × 2.75) / 1000) + 30) × taux réduction',
      'TOUS_RISQUES_ZERO': 'Formule: ((valeur neuve × taux) + prime fixe) × taux réduction | Franchise: 0%=0.032+22 DT, 1%=0.0265+21.75 DT, 2%=0.021+19 DT, 4%=0.017+15 DT',
      'CAS': 'Prime fixe par compagnie | LLOYD: 45 DT | AMANA: 20 DT',
      'ASSISTANCE': 'Prime fixe par compagnie | LLOYD: 115 DT | AMANA: 90 DT',
      'PERSONNES_TRANSPORTEES': 'Capital et prime par compagnie | LLOYD: 5k=25 DT, 10k=42 DT | AMANA: 4k=32 DT, 8k=64 DT',
      'BG': 'Formule: capital × taux × réduction. LLOYD: 6.5% | AMANA: 7%. Vous pouvez définir des limites de capital.',
      'INCENDIE_EMEUTES': 'Prime fixe | LLOYD: 15 DT | AMANA: NC (non disponible)',
      'DOMMAGES_EMEUTES': 'Prime fixe: 30 DT (LLOYD et AMANA)',
      'CATASTROPHES_NATURELLES': 'AMANA uniquement: 40 DT (Tous Risques seulement)',
      'DOMMAGES_COLLISIONS': 'Usage Privé/Affaire: base 10 DT + tiers (6.7%, 6.3%, 5.8%, 5.5%, 5%) | Usage Commercial: matrice VV × capital',
      'DEFENSE_RECOURS': 'Gratuit pour AMANA avec Tous Risques 0%',
    };
    return hints[selectedGuarantee.code];
  };

  const showField = (field: string) => {
    if (!selectedGuarantee) return true;
    const code = selectedGuarantee.code;
    
    const fieldMap: Record<string, string[]> = {
      'RC': ['bonusMalusClass', 'minPower', 'maxPower', 'fixedPremium'],
      'VOL': ['reductionRate'],
      'INCENDIE': ['reductionRate'],
      'TOUS_RISQUES_ZERO': ['franchiseRate', 'ratePercentage', 'fixedPremium', 'reductionRate'],
      'CAS': ['fixedPremium'],
      'ASSISTANCE': ['fixedPremium'],
      'PERSONNES_TRANSPORTEES': ['minCapital', 'fixedPremium'],
      'BG': ['minCapital', 'maxCapital', 'ratePercentage', 'reductionRate'],
      'INCENDIE_EMEUTES': ['fixedPremium'],
      'DOMMAGES_EMEUTES': ['fixedPremium'],
      'CATASTROPHES_NATURELLES': ['fixedPremium', 'formulaType'],
      'DOMMAGES_COLLISIONS': ['usageType', 'baseRate', 'fixedPremium', 'reductionRate'],
    };
    
    return !fieldMap[code] || fieldMap[code].includes(field);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {rule ? 'Modifier' : 'Nouvelle'} règle de tarification
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {getFormulaHint() && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-200">{getFormulaHint()}</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Formule personnalisée
            </label>
            <textarea
              value={formData.formula}
              onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
              placeholder="Exemple: ((VV * rate) + fixed) * reduction"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
              rows={3}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Variables disponibles: VV (valeur vénale), VN (valeur neuve), rate, fixed, reduction, capital, etc.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4">
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
              label="Convention"
              value={formData.conventionId}
              onChange={(e) => setFormData({ ...formData, conventionId: e.target.value })}
            >
              <option value="">Aucune</option>
              {conventions?.map((c: any) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>

          {selectedGuarantee && (
            <div className="border border-gray-300 dark:border-gray-600 rounded overflow-hidden">
              <table className="w-full text-sm">
                <tbody>
                  {showField('bonusMalusClass') && (
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-2 bg-gray-50 dark:bg-gray-900 font-medium w-1/3 border-r border-gray-200 dark:border-gray-700">Classe BM</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          min="1"
                          max="8"
                          value={formData.bonusMalusClass}
                          onChange={(e) => setFormData({ ...formData, bonusMalusClass: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                        />
                      </td>
                    </tr>
                  )}
                  {showField('minPower') && (
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-2 bg-gray-50 dark:bg-gray-900 font-medium border-r border-gray-200 dark:border-gray-700">Puissance min (CV)</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={formData.minPower}
                          onChange={(e) => setFormData({ ...formData, minPower: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                        />
                      </td>
                    </tr>
                  )}
                  {showField('maxPower') && (
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-2 bg-gray-50 dark:bg-gray-900 font-medium border-r border-gray-200 dark:border-gray-700">Puissance max (CV)</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={formData.maxPower}
                          onChange={(e) => setFormData({ ...formData, maxPower: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                        />
                      </td>
                    </tr>
                  )}
                  {showField('minCapital') && (
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-2 bg-gray-50 dark:bg-gray-900 font-medium border-r border-gray-200 dark:border-gray-700">Capital Minimum (DT)</td>
                      <td className="px-4 py-2">
                        <div className="space-y-2">
                          {selectedGuarantee?.code === 'BG' && (
                            <div className="mb-2">
                              <button
                                type="button"
                                onClick={() => setIsBgLimitModalOpen(true)}
                                className="text-sm text-blue-600 dark:text-blue-400 hover:underline font-medium"
                              >
                                Gérer les limites BG
                              </button>
                            </div>
                          )}
                          <input
                            type="number"
                            value={formData.minCapital}
                            onChange={(e) => setFormData({ ...formData, minCapital: e.target.value })}
                            className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                            placeholder="Limite minimale de capital pour Bris de Glaces (optionnel)"
                          />
                        </div>
                      </td>
                    </tr>
                  )}
                  {showField('maxCapital') && (
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-2 bg-gray-50 dark:bg-gray-900 font-medium border-r border-gray-200 dark:border-gray-700">Capital Maximum (DT)</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          value={formData.maxCapital}
                          onChange={(e) => setFormData({ ...formData, maxCapital: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                          placeholder="Limite maximale de capital pour Bris de Glaces (optionnel)"
                        />
                      </td>
                    </tr>
                  )}
                  {showField('franchiseRate') && (
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-2 bg-gray-50 dark:bg-gray-900 font-medium border-r border-gray-200 dark:border-gray-700">Franchise (%)</td>
                      <td className="px-4 py-2">
                        <select
                          value={formData.franchiseRate}
                          onChange={(e) => setFormData({ ...formData, franchiseRate: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                        >
                          <option value="">Sélectionner</option>
                          {franchiseValues?.map((fv: any) => (
                            <option key={fv.id} value={fv.value}>{fv.value}%</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )}
                  {showField('ratePercentage') && (
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-2 bg-gray-50 dark:bg-gray-900 font-medium border-r border-gray-200 dark:border-gray-700">Taux</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.0001"
                          value={formData.ratePercentage}
                          onChange={(e) => setFormData({ ...formData, ratePercentage: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                        />
                      </td>
                    </tr>
                  )}
                  {showField('fixedPremium') && (
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-2 bg-gray-50 dark:bg-gray-900 font-medium border-r border-gray-200 dark:border-gray-700">Prime fixe (DT)</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.fixedPremium}
                          onChange={(e) => setFormData({ ...formData, fixedPremium: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                        />
                      </td>
                    </tr>
                  )}
                  {showField('reductionRate') && (
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-2 bg-gray-50 dark:bg-gray-900 font-medium border-r border-gray-200 dark:border-gray-700">Taux de réduction</td>
                      <td className="px-4 py-2">
                        <input
                          type="number"
                          step="0.01"
                          value={formData.reductionRate}
                          onChange={(e) => setFormData({ ...formData, reductionRate: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                          placeholder="1.0"
                        />
                      </td>
                    </tr>
                  )}
                  {showField('formulaType') && (
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-2 bg-gray-50 dark:bg-gray-900 font-medium border-r border-gray-200 dark:border-gray-700">Type de formule</td>
                      <td className="px-4 py-2">
                        <select
                          value={formData.formulaType}
                          onChange={(e) => setFormData({ ...formData, formulaType: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                        >
                          <option value="">Toutes</option>
                          {formulaTypes.map((type: any) => (
                            <option key={type.code} value={type.code}>{type.nameFr}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )}
                  {showField('usageType') && (
                    <tr>
                      <td className="px-4 py-2 bg-gray-50 dark:bg-gray-900 font-medium border-r border-gray-200 dark:border-gray-700">Type d'usage</td>
                      <td className="px-4 py-2">
                        <select
                          value={formData.usageType}
                          onChange={(e) => setFormData({ ...formData, usageType: e.target.value })}
                          className="w-full px-2 py-1 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-800"
                        >
                          <option value="">Tous</option>
                          {usageTypes?.map((usage: any) => (
                            <option key={usage.id} value={usage.id}>{usage.nameFr}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

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

      {isBgLimitModalOpen && (
        <BgCapitalLimitModal
          limit={null}
          onClose={() => setIsBgLimitModalOpen(false)}
          onSuccess={() => {
            setIsBgLimitModalOpen(false);
            toast.success('Limites BG mises à jour');
          }}
        />
      )}
    </div>
  );
};
