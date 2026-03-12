import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { X, Info } from 'lucide-react';
import { Button } from '../../ui/Button';
import api from '../../../lib/api/client';
import toast from 'react-hot-toast';

interface GuaranteeRuleModalProps {
  rule: any;
  guarantee: any;
  companyId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export const GuaranteeRuleModal = ({
  rule,
  guarantee,
  companyId,
  onClose,
  onSuccess,
}: GuaranteeRuleModalProps) => {
  const [formData, setFormData] = useState({
    franchiseRate: rule?.franchiseRate || '',
    ratePercentage: rule?.ratePercentage || '',
    fixedPremium: rule?.fixedPremium || '',
    minCapital: rule?.minCapital || '',
    reductionRate: rule?.reductionRate || '',
    usageType: rule?.usageType || '',
    formula: rule?.formula || '',
    formulaType: rule?.formulaType || '',
    minMarketValue: rule?.minMarketValue || '',
    maxMarketValue: rule?.maxMarketValue || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data: any) =>
      rule
        ? api.patch(`/pricing-rules/${rule.id}`, data)
        : api.post('/pricing-rules', data),
    onSuccess: () => {
      toast.success(rule ? 'Règle modifiée' : 'Règle créée');
      onSuccess();
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erreur lors de la sauvegarde';
      toast.error(message);
    },
  });

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Define required fields per guarantee
    const requiredFields: Record<string, string[]> = {
      'VOL': ['ratePercentage', 'fixedPremium'],
      'INCENDIE': ['ratePercentage', 'fixedPremium'],
      'TOUS_RISQUES_ZERO': ['franchiseRate', 'ratePercentage', 'fixedPremium'],
      'CAS': ['fixedPremium'],
      'ASSISTANCE': ['fixedPremium'],
      'PERSONNES_TRANSPORTEES': ['minCapital', 'fixedPremium'],
      'BG': ['ratePercentage'],
      'INCENDIE_EMEUTES': ['fixedPremium'],
      'DOMMAGES_EMEUTES': ['fixedPremium'],
      'CATASTROPHES_NATURELLES': ['fixedPremium'],
      'DOMMAGES_COLLISIONS': ['fixedPremium'],
    };

    // Check required fields are not empty
    const required = requiredFields[guarantee.code] || [];
    required.forEach(field => {
      if (showField(field) && formData[field as keyof typeof formData] === '') {
        newErrors[field] = 'Ce champ est obligatoire';
      }
    });

    // Validate reductionRate (0-100)
    if (formData.reductionRate !== '' && showField('reductionRate')) {
      const rate = parseFloat(formData.reductionRate as string);
      if (isNaN(rate)) {
        newErrors.reductionRate = 'Valeur invalide';
      } else if (rate < 0 || rate > 100) {
        newErrors.reductionRate = 'Doit être entre 0 et 100';
      }
    }

    // Validate ratePercentage
    if (formData.ratePercentage !== '' && showField('ratePercentage')) {
      const rate = parseFloat(formData.ratePercentage as string);
      if (isNaN(rate)) {
        newErrors.ratePercentage = 'Valeur invalide';
      } else if (rate <= 0) {
        newErrors.ratePercentage = 'Doit être supérieur à 0';
      } else if (guarantee.code === 'BG' && rate > 100) {
        newErrors.ratePercentage = 'Ne peut pas dépasser 100%';
      }
    }

    // Validate minCapital (> 0)
    if (formData.minCapital !== '' && showField('minCapital')) {
      const capital = parseFloat(formData.minCapital as string);
      if (isNaN(capital)) {
        newErrors.minCapital = 'Valeur invalide';
      } else if (capital <= 0) {
        newErrors.minCapital = 'Doit être supérieur à 0';
      }
    }

    // Validate fixedPremium (>= 0)
    if (formData.fixedPremium !== '' && showField('fixedPremium')) {
      const premium = parseFloat(formData.fixedPremium as string);
      if (isNaN(premium)) {
        newErrors.fixedPremium = 'Valeur invalide';
      } else if (premium < 0) {
        newErrors.fixedPremium = 'Ne peut pas être négatif';
      }
    }

    // Validate franchiseRate (0, 1, 2, or 4)
    if (formData.franchiseRate !== '' && showField('franchiseRate')) {
      const franchise = parseFloat(formData.franchiseRate as string);
      if (![0, 1, 2, 4].includes(franchise)) {
        newErrors.franchiseRate = 'Doit être 0, 1, 2 ou 4';
      }
    }

    // Validate minMarketValue and maxMarketValue range
    if (showField('minMarketValue') || showField('maxMarketValue')) {
      const minVal = formData.minMarketValue !== '' ? parseFloat(formData.minMarketValue as string) : null;
      const maxVal = formData.maxMarketValue !== '' ? parseFloat(formData.maxMarketValue as string) : null;

      if (minVal !== null && (isNaN(minVal) || minVal < 0)) {
        newErrors.minMarketValue = 'Doit être supérieur ou égal à 0';
      }
      if (maxVal !== null && (isNaN(maxVal) || maxVal < 0)) {
        newErrors.maxMarketValue = 'Doit être supérieur ou égal à 0';
      }
      if (minVal !== null && maxVal !== null && !isNaN(minVal) && !isNaN(maxVal) && minVal > maxVal) {
        newErrors.maxMarketValue = 'La valeur max doit être ≥ la valeur min';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs de validation');
      return;
    }
    
    const cleanData: any = {
      companyId,
      guaranteeId: guarantee.id,
    };

    // Add only non-empty fields
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== '') {
        if (['franchiseRate', 'ratePercentage', 'fixedPremium', 'minCapital', 'reductionRate', 'minMarketValue', 'maxMarketValue'].includes(key)) {
          cleanData[key] = parseFloat(value as string);
        } else {
          cleanData[key] = value;
        }
      }
    });

    mutation.mutate(cleanData);
  };

  const getFieldsForGuarantee = () => {
    const code = guarantee.code;
    
    const fieldConfig: Record<string, string[]> = {
      'VOL': ['ratePercentage', 'fixedPremium', 'reductionRate', 'minMarketValue', 'maxMarketValue', 'formula'],
      'INCENDIE': ['ratePercentage', 'fixedPremium', 'reductionRate', 'minMarketValue', 'maxMarketValue', 'formula'],
      'TOUS_RISQUES_ZERO': ['franchiseRate', 'ratePercentage', 'fixedPremium', 'reductionRate', 'minMarketValue', 'maxMarketValue', 'formula'],
      'CAS': ['fixedPremium'],
      'ASSISTANCE': ['fixedPremium'],
      'PERSONNES_TRANSPORTEES': ['minCapital', 'fixedPremium'],
      'BG': ['ratePercentage', 'minMarketValue', 'maxMarketValue', 'formula'],
      'INCENDIE_EMEUTES': ['fixedPremium'],
      'DOMMAGES_EMEUTES': ['fixedPremium'],
      'CATASTROPHES_NATURELLES': ['fixedPremium', 'formulaType'],
      'DOMMAGES_COLLISIONS': ['usageType', 'fixedPremium', 'reductionRate'],
    };
    
    return fieldConfig[code] || ['ratePercentage', 'fixedPremium', 'reductionRate', 'formula'];
  };

  const showField = (field: string) => {
    return getFieldsForGuarantee().includes(field);
  };

  const getHint = () => {
    const hints: Record<string, string> = {
      'VOL': 'Formule standard: ((VV × taux) + prime fixe) × réduction',
      'INCENDIE': 'Formule standard: ((VV × taux) + prime fixe) × réduction',
      'TOUS_RISQUES_ZERO': 'Formule standard: ((VN × taux) + prime fixe) × réduction. Configurez une règle par franchise.',
      'CAS': 'Prime fixe uniquement. LLOYD: 45 DT | AMANA: 20 DT',
      'ASSISTANCE': 'Prime fixe uniquement. LLOYD: 115 DT | AMANA: 90 DT',
      'PERSONNES_TRANSPORTEES': 'Capital et prime par palier. LLOYD: 5k=21 DT, 10k=42 DT | AMANA: 4k=32 DT, 8k=64 DT',
      'BG': 'Formule: capital × taux. LLOYD: 6.5% | AMANA: 7%',
      'DOMMAGES_COLLISIONS': 'Configuration complète dans l\'onglet Dommages Collision',
    };
    return hints[guarantee.code];
  };

  const getVVType = (): 'MARKET_VALUE' | 'NEW_VALUE' | null => {
    const code = guarantee.code;
    const vvMapping: Record<string, 'MARKET_VALUE' | 'NEW_VALUE'> = {
      'RC': 'MARKET_VALUE',
      'VOL': 'MARKET_VALUE',
      'INCENDIE': 'MARKET_VALUE',
      'DOMMAGES_COLLISIONS': 'MARKET_VALUE',
      'BG': 'MARKET_VALUE',
      'INCENDIE_EMEUTES': 'MARKET_VALUE',
      'DOMMAGES_EMEUTES': 'MARKET_VALUE',
      'TOUS_RISQUES_ZERO': 'NEW_VALUE',
    };
    return vvMapping[code] || null;
  };

  const renderVVIndicator = () => {
    const vvType = getVVType();
    if (!vvType) return null;

    const isMarketValue = vvType === 'MARKET_VALUE';
    const isNewValue = vvType === 'NEW_VALUE';

    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center gap-2 mb-3">
          <Info className="w-4 h-4 text-gray-600 dark:text-gray-400" />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Valeur Véhicule (VV) utilisée:
          </span>
        </div>
        <div className="space-y-2">
          <div className={`flex items-center gap-3 p-2 rounded ${
            isMarketValue 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' 
              : 'bg-gray-100 dark:bg-gray-800 opacity-60'
          }`}>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              isMarketValue
                ? 'border-green-600 bg-green-600'
                : 'border-gray-400 dark:border-gray-600'
            }`}>
              {isMarketValue && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Valeur Vénale (VV)
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Utilisée pour RC, VOL, Incendie, Dommages Collision
              </div>
            </div>
          </div>
          <div className={`flex items-center gap-3 p-2 rounded ${
            isNewValue 
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700' 
              : 'bg-gray-100 dark:bg-gray-800 opacity-60'
          }`}>
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
              isNewValue
                ? 'border-green-600 bg-green-600'
                : 'border-gray-400 dark:border-gray-600'
            }`}>
              {isNewValue && (
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Valeur à Neuf (VN)
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Utilisée pour Tous Risques
              </div>
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400 italic">
          ℹ️ Le type de VV est automatiquement choisi selon la garantie. Cette sélection ne peut pas être modifiée.
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {rule ? 'Modifier' : 'Ajouter'} règle
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {guarantee.nameFr}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {getHint() && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 flex items-start gap-2">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800 dark:text-blue-200">{getHint()}</p>
            </div>
          )}

          {renderVVIndicator()}

          <div className="space-y-4">
            {showField('franchiseRate') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Franchise (%)
                </label>
                <select
                  value={formData.franchiseRate}
                  onChange={(e) => {
                    setFormData({ ...formData, franchiseRate: e.target.value });
                    setErrors({ ...errors, franchiseRate: '' });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    errors.franchiseRate ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  required
                >
                  <option value="">Sélectionner</option>
                  <option value="0">0%</option>
                  <option value="1">1%</option>
                  <option value="2">2%</option>
                  <option value="4">4%</option>
                </select>
                {errors.franchiseRate && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.franchiseRate}</p>
                )}
              </div>
            )}

            {showField('usageType') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type d'usage
                </label>
                <select
                  value={formData.usageType}
                  onChange={(e) => setFormData({ ...formData, usageType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Tous</option>
                  <option value="PRIVATE_BUSINESS">Privé et affaires</option>
                  <option value="COMMERCIAL">Commercial</option>
                </select>
              </div>
            )}

            {showField('formulaType') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type de formule
                </label>
                <select
                  value={formData.formulaType}
                  onChange={(e) => setFormData({ ...formData, formulaType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="">Toutes</option>
                  <option value="TOUS_RISQUES_0">Tous Risques 0%</option>
                </select>
              </div>
            )}

            {showField('ratePercentage') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Taux {guarantee.code === 'BG' ? '(%)' : '(décimal)'}
                </label>
                <input
                  type="number"
                  step="0.0001"
                  value={formData.ratePercentage}
                  onChange={(e) => {
                    setFormData({ ...formData, ratePercentage: e.target.value });
                    setErrors({ ...errors, ratePercentage: '' });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    errors.ratePercentage ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder={guarantee.code === 'BG' ? '6.5 ou 7' : '0.00236'}
                />
                {errors.ratePercentage ? (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.ratePercentage}</p>
                ) : guarantee.code !== 'BG' ? (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Exemple: 0.00236 pour 0.236%
                  </p>
                ) : null}
              </div>
            )}

            {showField('fixedPremium') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Prime fixe (DT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.fixedPremium}
                  onChange={(e) => {
                    setFormData({ ...formData, fixedPremium: e.target.value });
                    setErrors({ ...errors, fixedPremium: '' });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    errors.fixedPremium ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="30"
                />
                {errors.fixedPremium && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.fixedPremium}</p>
                )}
              </div>
            )}

            {showField('minCapital') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Capital (DT)
                </label>
                <input
                  type="number"
                  step="1"
                  value={formData.minCapital}
                  onChange={(e) => {
                    setFormData({ ...formData, minCapital: e.target.value });
                    setErrors({ ...errors, minCapital: '' });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    errors.minCapital ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="5000"
                />
                {errors.minCapital && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.minCapital}</p>
                )}
              </div>
            )}

            {showField('minMarketValue') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valeur Vénale Minimale (DT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.minMarketValue}
                  onChange={(e) => {
                    setFormData({ ...formData, minMarketValue: e.target.value });
                    setErrors({ ...errors, minMarketValue: '' });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    errors.minMarketValue ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="0"
                />
                {errors.minMarketValue ? (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.minMarketValue}</p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Laisser vide pour aucune limite minimale
                  </p>
                )}
              </div>
            )}

            {showField('maxMarketValue') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valeur Vénale Maximale (DT)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.maxMarketValue}
                  onChange={(e) => {
                    setFormData({ ...formData, maxMarketValue: e.target.value });
                    setErrors({ ...errors, maxMarketValue: '' });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    errors.maxMarketValue ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="0"
                />
                {errors.maxMarketValue ? (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.maxMarketValue}</p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Laisser vide pour aucune limite maximale
                  </p>
                )}
              </div>
            )}

            {showField('reductionRate') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Taux de réduction (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={formData.reductionRate}
                  onChange={(e) => {
                    setFormData({ ...formData, reductionRate: e.target.value });
                    setErrors({ ...errors, reductionRate: '' });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    errors.reductionRate ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="0"
                />
                {errors.reductionRate ? (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.reductionRate}</p>
                ) : (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Laisser vide ou 0 pour aucune réduction (max: 100%)
                  </p>
                )}
              </div>
            )}

            {showField('formula') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Formule personnalisée (optionnel)
                </label>
                <textarea
                  value={formData.formula}
                  onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                  placeholder="((VV * rate) + fixed) * reduction"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white font-mono text-sm"
                  rows={3}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Variables: VV (valeur vénale), VN (valeur neuve), rate, fixed, reduction, capital
                </p>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
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
