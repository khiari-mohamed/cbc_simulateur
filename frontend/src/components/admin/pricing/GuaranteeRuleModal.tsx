import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Info, HelpCircle, Edit2, Trash2, Eye, Settings, Target, BookOpen, BarChart3, Lightbulb, AlertCircle } from 'lucide-react';
import { Button } from '../../ui/Button';
import api from '../../../lib/api/client';
import toast from 'react-hot-toast';
import { BgCapitalLimitModal } from '../BgCapitalLimitModal';

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
    franchiseRate: rule?.franchiseRate?.toString() || '',
    ratePercentage: rule?.ratePercentage?.toString() || '',
    fixedPremium: rule?.fixedPremium?.toString() || '',
    minCapital: rule?.minCapital?.toString() || '',
    maxCapital: rule?.maxCapital?.toString() || '',
    reductionRate: rule?.reductionRate?.toString() || '',
    usageType: rule?.usageType || '',
    formula: rule?.formula || '',
    formulaType: rule?.formulaType || '',
    minMarketValue: rule?.minMarketValue?.toString() || '',
    maxMarketValue: rule?.maxMarketValue?.toString() || '',
    referenceValue: rule?.referenceValue || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [helpTab, setHelpTab] = useState<'vv-vn' | 'franchise' | 'bg' | 'pta'>('vv-vn');
  const [showFranchiseManager, setShowFranchiseManager] = useState(false);
  const [newFranchise, setNewFranchise] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [editingFranchise, setEditingFranchise] = useState<any>(null);
  const [viewingFranchise, setViewingFranchise] = useState<any>(null);
  const [deletingFranchise, setDeletingFranchise] = useState<any>(null);
  const [showBgLimitManager, setShowBgLimitManager] = useState(false);
  const queryClient = useQueryClient();

  // Fetch franchise values from API
  const { data: franchiseData } = useQuery({
    queryKey: ['franchise-values'],
    queryFn: async () => {
      const response = await api.get('/franchise-values');
      return response.data;
    },
  });

  const { data: usageTypes } = useQuery({
    queryKey: ['usage-types'],
    queryFn: async () => {
      const response = await api.get('/usage-types');
      return response.data;
    },
  });

  const franchiseValues = franchiseData?.map((f: any) => parseFloat(f.value)) || [0, 1, 2, 4];

  // Create franchise mutation
  const createFranchiseMutation = useMutation({
    mutationFn: (data: { value: number; label?: string; description?: string }) =>
      api.post('/franchise-values', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['franchise-values'] });
      toast.success('Franchise ajoutée avec succès');
      setNewFranchise('');
      setNewLabel('');
      setNewDescription('');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de l\'ajout');
    },
  });

  // Update franchise mutation
  const updateFranchiseMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.patch(`/franchise-values/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['franchise-values'] });
      toast.success('Franchise modifiée avec succès');
      setEditingFranchise(null);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la modification');
    },
  });

  // Delete franchise mutation
  const deleteFranchiseMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/franchise-values/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['franchise-values'] });
      toast.success('Franchise supprimée avec succès');
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || 'Erreur lors de la suppression');
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
    if (formData.franchiseRate !== '' && shouldShowFranchiseField()) {
      const franchise = parseFloat(formData.franchiseRate as string);
      if (![0, 1, 2, 4].includes(franchise)) {
        newErrors.franchiseRate = 'Doit être 0, 1, 2 ou 4';
      }
    }

    // Validate franchise for mandatory guarantees
    if (isFranchiseMandatory() && !formData.franchiseRate) {
      newErrors.franchiseRate = 'La franchise est obligatoire pour Tous Risques';
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

    // Validate reference value for mandatory guarantees
    if (isReferenceValueMandatory() && !formData.referenceValue) {
      newErrors.referenceValue = 'La valeur de référence est obligatoire pour cette garantie';
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
        if (['franchiseRate', 'ratePercentage', 'fixedPremium', 'minCapital', 'maxCapital', 'reductionRate', 'minMarketValue', 'maxMarketValue'].includes(key)) {
          // Use parseFloat to preserve precision (e.g., 21.75)
          cleanData[key] = parseFloat(value as string);
        } else {
          cleanData[key] = value;
        }
      }
    });

    // If referenceValue is not set for mandatory guarantees, use default
    if (!cleanData.referenceValue && isReferenceValueMandatory()) {
      cleanData.referenceValue = getDefaultVVType();
    }

    mutation.mutate(cleanData);
  };

  const getFieldsForGuarantee = () => {
    const code = guarantee.code;
    
    // DEBUG: Log the guarantee code to see what we're receiving
    console.log('🔍 DEBUG - Guarantee code:', code);
    console.log('🔍 DEBUG - Guarantee object:', guarantee);
    
    // Default fields for ALL unknown guarantees - includes all possible fields for maximum flexibility
    const defaultFields = ['franchiseRate', 'ratePercentage', 'fixedPremium', 'minCapital', 'maxCapital', 'reductionRate', 'minMarketValue', 'maxMarketValue', 'formula', 'formulaType', 'usageType'];
    
    const fieldConfig: Record<string, string[]> = {
      'VOL': ['ratePercentage', 'fixedPremium', 'reductionRate', 'minMarketValue', 'maxMarketValue', 'formula', 'formulaType'],
      'INCENDIE': ['ratePercentage', 'fixedPremium', 'reductionRate', 'minMarketValue', 'maxMarketValue', 'formula', 'formulaType'],
      'TOUS_RISQUES_ZERO': ['franchiseRate', 'ratePercentage', 'fixedPremium', 'reductionRate', 'minMarketValue', 'maxMarketValue', 'formula', 'formulaType'],
      'TOUS_RISQUES': ['franchiseRate', 'ratePercentage', 'fixedPremium', 'reductionRate', 'minMarketValue', 'maxMarketValue', 'formula', 'formulaType'],
      'CAS': ['fixedPremium', 'formulaType'],
      'ASSISTANCE': ['fixedPremium', 'formulaType'],
      'PERSONNES_TRANSPORTEES': ['minCapital', 'fixedPremium', 'formulaType'],
      'BG': ['ratePercentage', 'reductionRate', 'minCapital', 'maxCapital', 'minMarketValue', 'maxMarketValue', 'formula', 'formulaType'],
      'INCENDIE_EMEUTES': ['fixedPremium', 'formulaType'],
      'DOMMAGES_EMEUTES': ['fixedPremium', 'formulaType'],
      'CATASTROPHES_NATURELLES': ['fixedPremium', 'formulaType'],
      'DOMMAGES_COLLISIONS': ['usageType', 'fixedPremium', 'reductionRate', 'formulaType'],
      'DEFENSE_RECOURS': ['fixedPremium', 'ratePercentage', 'formulaType'],
    };
    
    const fields = fieldConfig[code] || defaultFields;
    console.log('🔍 DEBUG - Guarantee code:', code);
    console.log('🔍 DEBUG - Fields for this guarantee:', fields);
    
    return fields;
  };

  const showField = (field: string) => {
    return getFieldsForGuarantee().includes(field);
  };

  const getHint = () => {
    const hints: Record<string, string> = {
      'VOL': 'Formule standard: ((VV × taux) + prime fixe) × réduction',
      'INCENDIE': 'Formule standard: ((VV × taux) + prime fixe) × réduction',
      'TOUS_RISQUES_ZERO': 'Formule standard: ((VN × taux) + prime fixe) × réduction. Configurez une règle par franchise (0%, 1%, 2%, 4%).',
      'TOUS_RISQUES': 'Formule standard: ((VN × taux) + prime fixe) × réduction. Configurez une règle par franchise (0%, 1%, 2%, 4%).',
      'CAS': 'Prime fixe uniquement. LLOYD: 45 DT | AMANA: 20 DT',
      'ASSISTANCE': 'Prime fixe uniquement. LLOYD: 115 DT | AMANA: 90 DT',
      'PERSONNES_TRANSPORTEES': 'Capital et prime par palier. LLOYD: 5k=21 DT, 10k=42 DT | AMANA: 4k=32 DT, 8k=64 DT',
      'BG': 'Formule: capital × taux × réduction. LLOYD: 6.5% | AMANA: 7%. Vous pouvez définir des limites de capital.',
      'DOMMAGES_COLLISIONS': 'Configuration complète dans l\'onglet Dommages Collision',
    };
    return hints[guarantee.code];
  };

  const getDefaultVVType = (): 'MARKET_VALUE' | 'NEW_VALUE' | null => {
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
    // Default to MARKET_VALUE for any guarantee not explicitly mapped
    return vvMapping[code] || 'MARKET_VALUE';
  };

  const shouldShowReferenceValueSelector = (): boolean => {
    // Always show for all guarantees to give full flexibility
    return true;
  };

  const isReferenceValueMandatory = (): boolean => {
    // Mandatory only for these 4 guarantees as per client requirement
    const code = guarantee.code;
    return ['VOL', 'INCENDIE', 'TOUS_RISQUES_ZERO', 'TOUS_RISQUES', 'DOMMAGES_COLLISIONS'].includes(code);
  };

  const shouldShowFranchiseField = (): boolean => {
    // Always show franchise field for all guarantees (like referenceValue)
    return true;
  };

  const isFranchiseMandatory = (): boolean => {
    // Mandatory only for TOUS_RISQUES
    const code = guarantee.code;
    return ['TOUS_RISQUES_ZERO', 'TOUS_RISQUES'].includes(code);
  };

  const renderReferenceValueSelector = () => {
    if (!shouldShowReferenceValueSelector()) return null;

    const defaultVVType = getDefaultVVType();
    const selectedValue = formData.referenceValue || defaultVVType || '';
    const isMandatory = isReferenceValueMandatory();

    return (
      <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Valeur Véhicule (VV) utilisée:
            </span>
            {isMandatory ? (
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                Obligatoire
              </span>
            ) : (
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                Optionnel
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
            Aide
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="space-y-2">
            <label
              className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
              style={{
                borderColor: selectedValue === 'MARKET_VALUE' ? '#16a34a' : '#d1d5db',
                backgroundColor: selectedValue === 'MARKET_VALUE' ? '#f0fdf4' : 'transparent',
              }}
            >
              <input
                type="radio"
                name="referenceValue"
                value="MARKET_VALUE"
                checked={selectedValue === 'MARKET_VALUE'}
                onChange={(e) => setFormData({ ...formData, referenceValue: e.target.value })}
                className="w-5 h-5 text-green-600 focus:ring-green-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Valeur Vénale (VV)
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Utilisée pour RC, VOL, Incendie, Dommages Collision
                  {defaultVVType === 'MARKET_VALUE' && (
                    <span className="ml-1 text-blue-600 dark:text-blue-400 font-medium">(Recommandé)</span>
                  )}
                </div>
              </div>
            </label>

            <label
              className="flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all hover:bg-gray-100 dark:hover:bg-gray-800"
              style={{
                borderColor: selectedValue === 'NEW_VALUE' ? '#16a34a' : '#d1d5db',
                backgroundColor: selectedValue === 'NEW_VALUE' ? '#f0fdf4' : 'transparent',
              }}
            >
              <input
                type="radio"
                name="referenceValue"
                value="NEW_VALUE"
                checked={selectedValue === 'NEW_VALUE'}
                onChange={(e) => setFormData({ ...formData, referenceValue: e.target.value })}
                className="w-5 h-5 text-green-600 focus:ring-green-500"
              />
              <div className="flex-1">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  Valeur à Neuf (VN)
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">
                  Utilisée pour Tous Risques
                  {defaultVVType === 'NEW_VALUE' && (
                    <span className="ml-1 text-blue-600 dark:text-blue-400 font-medium">(Recommandé)</span>
                  )}
                </div>
              </div>
            </label>
          </div>

          <div className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
            <p>
              {isMandatory 
                ? 'La valeur de référence est obligatoire pour cette garantie. Le système recommande automatiquement la valeur standard, mais vous pouvez la modifier si nécessaire.'
                : 'La valeur de référence est optionnelle pour cette garantie. Si vous ne la définissez pas, elle ne sera pas utilisée dans les calculs.'}
            </p>
          </div>
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

          {renderReferenceValueSelector()}

          <div className="space-y-4">
            {/* Franchise field - Always show for all guarantees (like VV/VN) */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Franchise (%)
                </label>
                {isFranchiseMandatory() ? (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                    Obligatoire
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-xs font-semibold rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                    Optionnel
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setShowFranchiseManager(true)}
                  className="ml-auto flex items-center gap-1 px-2 py-1 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors border border-purple-300 dark:border-purple-700"
                >
                  <Settings className="w-4 h-4" />
                  Gérer les franchises
                </button>
              </div>
              <select
                value={formData.franchiseRate}
                onChange={(e) => {
                  setFormData({ ...formData, franchiseRate: e.target.value });
                  setErrors({ ...errors, franchiseRate: '' });
                }}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                  errors.franchiseRate ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                required={isFranchiseMandatory()}
              >
                <option value="">Sélectionner</option>
                {franchiseValues.sort((a: number, b: number) => a - b).map((value: number) => (
                  <option key={value} value={value}>{value}%</option>
                ))}
              </select>
              {errors.franchiseRate && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.franchiseRate}</p>
              )}
              {isFranchiseMandatory() ? (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  La franchise est obligatoire pour Tous Risques. Chaque franchise a un taux et une prime fixe différents.
                </p>
              ) : (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Optionnel. Utilisé uniquement si votre formule nécessite une franchise.
                </p>
              )}
            </div>

            {/* BG Capital Limits - Always show for all guarantees (like Franchise) */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Limites de Capital BG
                </label>
                <span className="px-2 py-0.5 text-xs font-semibold rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                  Optionnel
                </span>
                <button
                  type="button"
                  onClick={() => setShowBgLimitManager(true)}
                  className="ml-auto flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors border border-blue-300 dark:border-blue-700"
                >
                  <Settings className="w-4 h-4" />
                  Gérer les limites BG
                </button>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Optionnel. Gérez les limites de capital disponibles pour la garantie Bris de Glaces.
              </p>
            </div>

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
                  {usageTypes?.map((usage: any) => (
                    <option key={usage.id} value={usage.code}>{usage.nameFr}</option>
                  ))}
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
                  <option value="STANDARD">Standard</option>
                  <option value="DOMMAGES_COLLISIONS">Dommages Collision</option>
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
                  step="0.001"
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
                {(guarantee.code === 'TOUS_RISQUES_ZERO' || guarantee.code === 'TOUS_RISQUES') && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Exemples: 22 DT (0%), 21.75 DT (1%), 19 DT (2%), 15 DT (4%)
                  </p>
                )}
              </div>
            )}

            {showField('minCapital') && (
              <div>
                {guarantee.code === 'BG' && (
                  <div className="mb-3">
                    <button
                      type="button"
                      onClick={() => setShowBgLimitManager(true)}
                      className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors border-2 border-blue-300 dark:border-blue-700"
                    >
                      <Settings className="w-5 h-5" />
                      Gérer les limites BG
                    </button>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {guarantee.code === 'BG' ? 'Capital Minimum (DT)' : 'Capital (DT)'}
                  </label>
                </div>
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
                  placeholder={guarantee.code === 'BG' ? '1000' : '5000'}
                />
                {errors.minCapital && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.minCapital}</p>
                )}
                {guarantee.code === 'BG' && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Limite minimale de capital pour Bris de Glaces (optionnel)
                  </p>
                )}
              </div>
            )}

            {showField('maxCapital') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Capital Maximum (DT)
                </label>
                <input
                  type="number"
                  step="1"
                  value={formData.maxCapital}
                  onChange={(e) => {
                    setFormData({ ...formData, maxCapital: e.target.value });
                    setErrors({ ...errors, maxCapital: '' });
                  }}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white ${
                    errors.maxCapital ? 'border-red-500 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                  placeholder="100000"
                />
                {errors.maxCapital && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.maxCapital}</p>
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Limite maximale de capital pour Bris de Glaces (optionnel)
                </p>
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

      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Guide de Configuration
                </h3>
              </div>
              <button onClick={() => setShowHelpModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Tabs */}
            <div className="flex border-b border-gray-200 dark:border-gray-700 px-6">
              <button
                onClick={() => setHelpTab('vv-vn')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  helpTab === 'vv-vn'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-1" /> Valeur de Référence (VV/VN)
              </button>
              <button
                onClick={() => setHelpTab('franchise')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  helpTab === 'franchise'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <Target className="w-4 h-4 inline mr-1" /> Franchise Tous Risques
              </button>
              <button
                onClick={() => setHelpTab('bg')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  helpTab === 'bg'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-1" /> Bris de Glaces (BG)
              </button>
              <button
                onClick={() => setHelpTab('pta')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  helpTab === 'pta'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
                }`}
              >
                <Lightbulb className="w-4 h-4 inline mr-1" /> Personnes Transportées (PTA)
              </button>
            </div>
            
            <div className="p-6 space-y-6 text-sm">
              {helpTab === 'pta' ? (
                <>
                  {/* PTA - How it works */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                      🎯 Personnes Transportées (PTA) — Comment ça fonctionne ?
                    </h4>
                    <p className="text-blue-800 dark:text-blue-300 text-xs mb-3">
                      La garantie PTA fonctionne par <strong>paliers de capital</strong>. Chaque palier a un capital assuré et une prime fixe correspondante.
                      Vous créez une règle séparée pour chaque palier.
                    </p>
                    <div className="bg-white dark:bg-gray-900 border-l-4 border-blue-500 p-3 rounded">
                      <div className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">📋 Votre remarque :</div>
                      <div className="bg-blue-100 dark:bg-blue-950 p-2 rounded mb-2">
                        <p className="text-xs italic text-blue-800 dark:text-blue-300">
                          "<strong>L'application ne me permet pas de saisir le capital et la prime y relative</strong>"
                        </p>
                      </div>
                      <div className="bg-green-100 dark:bg-green-950 p-2 rounded">
                        <p className="text-xs font-bold text-green-800 dark:text-green-300">
                          ✅ Les champs Capital (DT) et Prime fixe (DT) sont bien présents dans le formulaire — il faut <strong>faire défiler vers le bas</strong> pour les voir, après les sections Franchise et BG.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Where the fields are */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">📍 Où se trouvent les champs Capital et Prime ?</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      Le formulaire affiche plusieurs sections dans cet ordre. Les champs PTA se trouvent <strong>en bas</strong> :
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-3 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs">
                        <span className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">1</span>
                        <span className="text-gray-500 dark:text-gray-400">Valeur de référence (VV/VN) — Optionnel pour PTA</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs">
                        <span className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">2</span>
                        <span className="text-gray-500 dark:text-gray-400">Franchise (%) — Optionnel pour PTA</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs">
                        <span className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">3</span>
                        <span className="text-gray-500 dark:text-gray-400">Limites BG — Optionnel pour PTA</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-gray-100 dark:bg-gray-900 rounded text-xs">
                        <span className="w-6 h-6 bg-gray-400 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">4</span>
                        <span className="text-gray-500 dark:text-gray-400">Type de formule — Optionnel pour PTA</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-green-100 dark:bg-green-900/30 rounded text-xs border-2 border-green-400">
                        <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">5</span>
                        <span className="text-green-800 dark:text-green-300 font-semibold">Prime fixe (DT) ← ICI ✅</span>
                      </div>
                      <div className="flex items-center gap-3 p-2 bg-green-100 dark:bg-green-900/30 rounded text-xs border-2 border-green-400">
                        <span className="w-6 h-6 bg-green-600 text-white rounded-full flex items-center justify-center font-bold flex-shrink-0">6</span>
                        <span className="text-green-800 dark:text-green-300 font-semibold">Capital (DT) ← ICI ✅</span>
                      </div>
                    </div>
                    <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 p-3 rounded">
                      <p className="text-xs text-yellow-800 dark:text-yellow-300">
                        💡 <strong>Astuce :</strong> Faites défiler le formulaire vers le bas pour voir les champs Capital et Prime fixe.
                      </p>
                    </div>
                  </div>

                  {/* Default values */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">📊 Paliers configurés par défaut</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border border-gray-200 dark:border-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-900">
                          <tr>
                            <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-left">Compagnie</th>
                            <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">Capital (DT)</th>
                            <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">Prime fixe (DT)</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-white dark:bg-gray-900">
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">Lloyd</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right font-bold">5,000 DT</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right text-blue-600 dark:text-blue-400 font-bold">21 DT</td>
                          </tr>
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">Lloyd</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right font-bold">10,000 DT</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right text-blue-600 dark:text-blue-400 font-bold">42 DT</td>
                          </tr>
                          <tr className="bg-white dark:bg-gray-900">
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">Amana</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right font-bold">4,000 DT</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right text-green-600 dark:text-green-400 font-bold">32 DT</td>
                          </tr>
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">Amana</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right font-bold">8,000 DT</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right text-green-600 dark:text-green-400 font-bold">64 DT</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Step by step guide */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">🔧 Comment ajouter un palier PTA</h4>
                    <div className="space-y-3">
                      <div className="bg-white dark:bg-gray-900 rounded p-3">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Pour ajouter le palier Lloyd 5,000 DT = 21 DT :</p>
                        <ol className="text-xs text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
                          <li>Sélectionnez la garantie <strong>Personnes Transportées</strong></li>
                          <li>Cliquez sur <strong>"Ajouter"</strong></li>
                          <li>Ignorez les sections VV/VN, Franchise, BG (optionnels)</li>
                          <li>Descendez jusqu'à <strong>"Prime fixe (DT)"</strong> → saisissez <strong>21</strong></li>
                          <li>Descendez jusqu'à <strong>"Capital (DT)"</strong> → saisissez <strong>5000</strong></li>
                          <li>Cliquez sur <strong>"Enregistrer"</strong></li>
                          <li>Répétez pour le palier 10,000 DT = 42 DT</li>
                        </ol>
                      </div>
                      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 p-3 rounded">
                        <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-200 mb-1">⚠️ Important : une règle par palier</p>
                        <p className="text-xs text-yellow-800 dark:text-yellow-300">
                          Chaque palier (5k, 10k, 20k...) est une règle séparée. Vous devez cliquer sur "Ajouter" autant de fois que vous avez de paliers.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* How the engine picks the right tier */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">⚙️ Comment le système choisit le bon palier ?</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      Lors de la génération du devis, le système sélectionne automatiquement le palier correspondant au capital choisi par le client :
                    </p>
                    <div className="bg-gray-900 dark:bg-gray-950 p-3 rounded text-xs font-mono text-green-400">
                      Client choisit capital = 5,000 DT<br/>
                      → Système trouve la règle avec minCapital = 5,000<br/>
                      → Prime = 21 DT ✓
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">💡 Résumé</h4>
                    <ul className="text-xs text-yellow-800 dark:text-yellow-300 space-y-1 list-disc list-inside">
                      <li>Les champs Capital et Prime fixe <strong>existent</strong> — faites défiler vers le bas</li>
                      <li>Créez <strong>une règle par palier</strong> (5k, 10k, 20k...)</li>
                      <li>Laissez les sections VV/VN, Franchise, BG vides pour PTA</li>
                      <li>Le système sélectionne automatiquement le bon palier lors du devis</li>
                    </ul>
                  </div>
                </>
              ) : helpTab === 'bg' ? (
                <>
                  {/* BG - Question client answered */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                      🎯 Bris de Glaces — Comment ça fonctionne ?
                    </h4>
                    <p className="text-blue-800 dark:text-blue-300 text-xs mb-3">
                      La garantie BG est basée sur un <strong>capital choisi par le client</strong>, pas sur la valeur vénale ou la valeur à neuf du véhicule.
                      Le taux appliqué dépend de la tranche de capital sélectionnée.
                    </p>
                    <div className="bg-white dark:bg-gray-900 border-l-4 border-blue-500 p-3 rounded">
                      <div className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">📋 Votre question :</div>
                      <div className="bg-blue-100 dark:bg-blue-950 p-2 rounded mb-2">
                        <p className="text-xs italic text-blue-800 dark:text-blue-300">
                          "<strong>Pourriez-vous m'indiquer où sont enregistrées, dans le système, les limites choisies par le client lors de l'établissement du devis (1000 / 2000 DT / 3000 DT) ?</strong>"
                        </p>
                      </div>
                      <div className="bg-green-100 dark:bg-green-950 p-2 rounded">
                        <p className="text-xs font-bold text-green-800 dark:text-green-300">
                          ✅ Réponse : Ces limites sont stockées dans la table <code className="bg-green-200 dark:bg-green-900 px-1 rounded">bg_capital_limits</code> et sont entièrement configurables via le bouton "Gérer les limites BG".
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Where limits are stored */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">🗄️ Où sont stockées les limites ?</h4>
                    <div className="space-y-3">
                      <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-3 rounded">
                        <p className="text-xs font-semibold text-red-800 dark:text-red-200 mb-1">❌ AVANT (codées en dur)</p>
                        <p className="text-xs text-red-700 dark:text-red-400">Les valeurs 500, 700, 1000, 1500, 2000, 2500, 3000 DT étaient écrites directement dans le code frontend. Impossible de les modifier sans un développeur.</p>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 p-3 rounded">
                        <p className="text-xs font-semibold text-green-800 dark:text-green-200 mb-1">✅ MAINTENANT (table bg_capital_limits)</p>
                        <p className="text-xs text-green-700 dark:text-green-400 mb-2">Les limites sont stockées en base de données. Vous pouvez les ajouter, modifier ou désactiver sans toucher au code.</p>
                        <div className="bg-white dark:bg-gray-900 p-2 rounded text-xs font-mono">
                          Valeurs par défaut : 1,000 DT | 2,000 DT | 3,000 DT<br/>
                          Vous pouvez ajouter : 5,000 DT | 10,000 DT | etc.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* How BG pricing works */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">📐 Formule de calcul BG</h4>
                    <div className="bg-gray-900 dark:bg-gray-950 p-3 rounded text-xs font-mono text-green-400 mb-3">
                      Prime BG = Capital choisi × Taux × (1 - Réduction%)
                    </div>
                    <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 p-3 rounded">
                      <p className="text-xs font-semibold text-yellow-900 dark:text-yellow-200 mb-1">⚠️ Important : BG n'utilise PAS la valeur vénale (VV) ni la valeur à neuf (VN)</p>
                      <p className="text-xs text-yellow-800 dark:text-yellow-300">Le calcul est basé uniquement sur le capital que le client choisit dans le menu déroulant lors de la création du devis.</p>
                    </div>
                  </div>

                  {/* Tiered rates */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">📊 Taux par tranche de capital (paramétrable)</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">
                      Vous pouvez définir des taux différents selon la tranche de capital. Exemple configuré par défaut :
                    </p>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border border-gray-200 dark:border-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-900">
                          <tr>
                            <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-left">Compagnie</th>
                            <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-left">Capital Min</th>
                            <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-left">Capital Max</th>
                            <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">Taux</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-white dark:bg-gray-900">
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">Lloyd</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">0 DT</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">5,000 DT</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right font-bold text-blue-600 dark:text-blue-400">6.5%</td>
                          </tr>
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">Lloyd</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">&gt; 5,000 DT</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">Illimité</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right font-bold text-blue-600 dark:text-blue-400">7%</td>
                          </tr>
                          <tr className="bg-white dark:bg-gray-900">
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">Amana</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">0 DT</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">5,000 DT</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right font-bold text-green-600 dark:text-green-400">7%</td>
                          </tr>
                          <tr className="bg-gray-50 dark:bg-gray-800">
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">Amana</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">&gt; 5,000 DT</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2">Illimité</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right font-bold text-green-600 dark:text-green-400">8%</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Calculation examples */}
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">📊 Exemples de calcul</h4>
                    <div className="space-y-3">
                      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-3 rounded">
                        <p className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">Exemple 1 — Lloyd, capital 2,000 DT</p>
                        <div className="bg-white dark:bg-gray-900 p-2 rounded text-xs font-mono space-y-1">
                          <div>Capital choisi : 2,000 DT</div>
                          <div>Tranche : 0 → 5,000 DT → Taux 6.5%</div>
                          <div className="text-blue-600 dark:text-blue-400">Prime = 2,000 × 0.065 = <strong>130 DT</strong></div>
                        </div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 p-3 rounded">
                        <p className="text-xs font-semibold text-green-900 dark:text-green-200 mb-2">Exemple 2 — Lloyd, capital 6,000 DT</p>
                        <div className="bg-white dark:bg-gray-900 p-2 rounded text-xs font-mono space-y-1">
                          <div>Capital choisi : 6,000 DT</div>
                          <div>Tranche : &gt; 5,000 DT → Taux 7%</div>
                          <div className="text-green-600 dark:text-green-400">Prime = 6,000 × 0.07 = <strong>420 DT</strong></div>
                        </div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 p-3 rounded">
                        <p className="text-xs font-semibold text-purple-900 dark:text-purple-200 mb-2">Exemple 3 — Tous Risques 0% (BG gratuit)</p>
                        <div className="bg-white dark:bg-gray-900 p-2 rounded text-xs font-mono space-y-1">
                          <div>Formule : Tous Risques 0%</div>
                          <div className="text-purple-600 dark:text-purple-400">Prime BG = <strong>0 DT</strong> (inclus gratuitement)</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* How to configure */}
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">🔧 Comment configurer</h4>
                    <div className="space-y-4">
                      <div className="bg-white dark:bg-gray-900 rounded p-3">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Étape 1 — Gérer les limites disponibles pour le client</p>
                        <ol className="text-xs text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
                          <li>Cliquez sur le bouton <strong>"Gérer les limites BG"</strong> dans ce formulaire</li>
                          <li>Ajoutez les valeurs souhaitées (ex: 1,000 / 2,000 / 3,000 / 5,000 DT)</li>
                          <li>Ces valeurs apparaîtront dans le menu déroulant du client lors de la création du devis</li>
                        </ol>
                      </div>
                      <div className="bg-white dark:bg-gray-900 rounded p-3">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white mb-2">Étape 2 — Configurer les taux par tranche</p>
                        <ol className="text-xs text-gray-700 dark:text-gray-300 space-y-1 list-decimal list-inside">
                          <li>Dans ce formulaire, remplissez <strong>Capital Minimum</strong> et <strong>Capital Maximum</strong></li>
                          <li>Saisissez le <strong>Taux (%)</strong> correspondant à cette tranche</li>
                          <li>Enregistrez, puis créez une nouvelle règle pour la tranche suivante</li>
                          <li>Laissez Capital Maximum vide pour une tranche sans limite supérieure</li>
                        </ol>
                      </div>
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">💡 Résumé</h4>
                    <ul className="text-xs text-yellow-800 dark:text-yellow-300 space-y-1 list-disc list-inside">
                      <li>Les limites (1k/2k/3k DT) sont stockées en DB, <strong>pas dans le code</strong></li>
                      <li>Vous pouvez ajouter/supprimer des limites via "Gérer les limites BG"</li>
                      <li>Le taux dépend de la <strong>tranche de capital</strong>, pas de la valeur du véhicule</li>
                      <li>Plusieurs règles par compagnie = taux dégressifs selon le capital</li>
                      <li>BG est <strong>gratuit</strong> avec la formule Tous Risques 0%</li>
                    </ul>
                  </div>
                </>
              ) : helpTab === 'vv-vn' ? (
                <>
              {/* Introduction */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <h4 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
                  🎯 Qu'est-ce que la Valeur de Référence ?
                </h4>
                <p className="text-blue-800 dark:text-blue-300 mb-3">
                  La valeur de référence détermine quelle valeur du véhicule sera utilisée dans le calcul de la prime d'assurance.
                </p>
                <div className="bg-white dark:bg-gray-900 border-l-4 border-blue-500 p-3 rounded">
                  <div className="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">
                    📋 Implémenté selon votre exigence :
                  </div>
                  <div className="bg-blue-100 dark:bg-blue-950 p-2 rounded mb-2">
                    <p className="text-xs italic text-blue-800 dark:text-blue-300">
                      "<span className="font-bold">Souhaitez-vous pouvoir choisir manuellement la valeur de référence pour chaque règle de tarification, indépendamment de la garantie ?</span>"
                    </p>
                  </div>
                  <div className="bg-green-100 dark:bg-green-950 p-2 rounded">
                    <p className="text-xs font-bold text-green-800 dark:text-green-300">
                      ✅ Votre réponse : "<span className="underline">Oui pour le vol, incendie, tous risques et dommages collisions</span>"
                    </p>
                  </div>
                  <div className="mt-3 text-xs text-blue-700 dark:text-blue-400 space-y-1">
                    <p>✓ <strong>Obligatoire</strong> pour : VOL, INCENDIE, TOUS RISQUES, DOMMAGES COLLISIONS</p>
                    <p>✓ <strong>Optionnel</strong> pour : Toutes les autres garanties (CAS, ASSISTANCE, BG, PTA, etc.)</p>
                  </div>
                </div>
                <div className="mt-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 p-3 rounded">
                  <div className="flex items-start gap-2">
                    <span className="text-yellow-600 dark:text-yellow-400">💡</span>
                    <div className="text-xs text-yellow-800 dark:text-yellow-300">
                      <p className="font-semibold mb-1">Pourquoi les garanties optionnelles existent ?</p>
                      <ul className="space-y-1 list-disc list-inside">
                        <li><strong>Flexibilité future</strong> : Si vous créez de nouvelles formules personnalisées qui utilisent VV/VN</li>
                        <li><strong>Éviter la confusion</strong> : Vous pouvez toujours définir la valeur de référence sans bloquer le système</li>
                        <li><strong>Généralisation</strong> : Le système est conçu pour s'adapter à tous vos besoins futurs</li>
                        <li><strong>Pour le développeur</strong> : Interface unifiée et cohérente pour toutes les garanties</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Two Types */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">💵</span>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Valeur Vénale (VV)</h4>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">
                    Valeur actuelle du véhicule sur le marché (avec dépréciation)
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs font-mono">
                    Exemple: Véhicule acheté 50,000 DT<br/>
                    Après 3 ans → VV = 35,000 DT
                  </div>
                </div>

                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-2xl">✨</span>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Valeur à Neuf (VN)</h4>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 text-xs mb-2">
                    Valeur du véhicule neuf (prix d'achat initial)
                  </p>
                  <div className="bg-gray-100 dark:bg-gray-900 p-2 rounded text-xs font-mono">
                    Exemple: Véhicule acheté 50,000 DT<br/>
                    Après 3 ans → VN = 50,000 DT
                  </div>
                </div>
              </div>

              {/* Mandatory vs Optional */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  📊 Garanties : Obligatoire vs Optionnel
                </h4>
                
                <div className="space-y-3">
                  {/* Mandatory */}
                  <div className="border-l-4 border-red-500 bg-red-50 dark:bg-red-900/20 p-3 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200">
                        Obligatoire
                      </span>
                      <span className="text-xs text-red-800 dark:text-red-300 font-medium">
                        VOL, INCENDIE, TOUS RISQUES, DOMMAGES COLLISION
                      </span>
                    </div>
                    <p className="text-xs text-red-700 dark:text-red-400 mb-2">
                      Ces garanties UTILISENT la valeur dans leurs formules de calcul.
                    </p>
                    <div className="bg-white dark:bg-gray-900 p-2 rounded text-xs font-mono">
                      VOL = ((VV × taux) + prime fixe) × réduction<br/>
                      INCENDIE = ((VV × taux) + prime fixe) × réduction<br/>
                      TOUS RISQUES = ((VN × taux) + prime fixe) × réduction
                    </div>
                  </div>

                  {/* Optional */}
                  <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 p-3 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 text-xs font-semibold rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                        Optionnel
                      </span>
                      <span className="text-xs text-green-800 dark:text-green-300 font-medium">
                        CAS, ASSISTANCE, BG, PTA, etc.
                      </span>
                    </div>
                    <p className="text-xs text-green-700 dark:text-green-400 mb-2">
                      Ces garanties utilisent des primes fixes ou capitaux. La valeur de référence est optionnelle.
                    </p>
                    <div className="bg-white dark:bg-gray-900 p-2 rounded text-xs font-mono">
                      CAS = Prime fixe (45 DT ou 20 DT)<br/>
                      ASSISTANCE = Prime fixe (115 DT ou 90 DT)<br/>
                      PTA = Capital + Prime fixe
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagram */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  📝 Schéma de Fonctionnement
                </h4>
                <div className="bg-gray-900 dark:bg-gray-950 p-4 rounded-lg text-xs font-mono text-green-400 overflow-x-auto">
                  <pre className="whitespace-pre">{`
╔═══════════════════════════════════════════════════════════════════════╗
║                  CRÉATION D'UNE RÈGLE DE TARIFICATION                 ║
╚═══════════════════════════════════════════════════════════════════════╝
                                    │
                                    ▼
                    ┌───────────────────────────────┐
                    │   Sélection de la Garantie    │
                    │   (VOL, CAS, ASSISTANCE...)   │
                    └───────────────┬───────────────┘
                                    │
                    ┌───────────────┴───────────────┐
                    │                               │
                    ▼                               ▼
        ┌───────────────────────┐     ┌───────────────────────┐
        │   🔴 OBLIGATOIRE      │     │   🟢 OPTIONNEL        │
        ├───────────────────────┤     ├───────────────────────┤
        │ • VOL                 │     │ • CAS                 │
        │ • INCENDIE            │     │ • ASSISTANCE          │
        │ • TOUS RISQUES        │     │ • BG                  │
        │ • DOMMAGES COLLISION  │     │ • PTA                 │
        │                       │     │ • RC                  │
        └───────────┬───────────┘     └───────────┬───────────┘
                    │                             │
                    ▼                             ▼
        ┌───────────────────────┐     ┌───────────────────────┐
        │ DOIT choisir :        │     │ PEUT choisir :        │
        │                       │     │                       │
        │ ○ Valeur Vénale (VV)  │     │ ○ Valeur Vénale (VV)  │
        │ ○ Valeur à Neuf (VN)  │     │ ○ Valeur à Neuf (VN)  │
        │                       │     │ ○ Laisser vide        │
        │ ❌ Erreur si vide     │     │ ✅ Pas d'erreur       │
        └───────────┬───────────┘     └───────────┬───────────┘
                    │                             │
                    └──────────────┬──────────────┘
                                   ▼
                    ┌──────────────────────────────┐
                    │  Valeur enregistrée dans DB  │
                    │  Utilisée dans les calculs   │
                    └──────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════╗
║                    RECOMMANDATIONS AUTOMATIQUES                       ║
╠═══════════════════════════════════════════════════════════════════════╣
║  VOL                    →  VV (Valeur Vénale)      [Recommandé]      ║
║  INCENDIE               →  VV (Valeur Vénale)      [Recommandé]      ║
║  DOMMAGES COLLISION     →  VV (Valeur Vénale)      [Recommandé]      ║
║  TOUS RISQUES           →  VN (Valeur à Neuf)      [Recommandé]      ║
║  Autres garanties       →  VV par défaut           [Modifiable]      ║
╚═══════════════════════════════════════════════════════════════════════╝

╔═══════════════════════════════════════════════════════════════════════╗
║                      POURQUOI CES RECOMMANDATIONS ?                   ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  VOL / INCENDIE → VV                                                  ║
║  ┌─────────────────────────────────────────────────────────────────┐ ║
║  │ En cas de sinistre, l'assurance rembourse la valeur ACTUELLE   │ ║
║  │ du véhicule (avec dépréciation), pas le prix d'achat neuf.     │ ║
║  │                                                                 │ ║
║  │ Exemple : Véhicule acheté 50,000 DT il y a 3 ans              │ ║
║  │           Valeur actuelle (VV) = 35,000 DT                     │ ║
║  │           → Prime calculée sur 35,000 DT                       │ ║
║  └─────────────────────────────────────────────────────────────────┘ ║
║                                                                       ║
║  TOUS RISQUES → VN                                                    ║
║  ┌─────────────────────────────────────────────────────────────────┐ ║
║  │ Cette formule couvre les véhicules NEUFS ou RÉCENTS.           │ ║
║  │ L'assurance garantit le remplacement à neuf en cas de sinistre.│ ║
║  │                                                                 │ ║
║  │ Exemple : Véhicule acheté 50,000 DT il y a 1 an               │ ║
║  │           Valeur à neuf (VN) = 50,000 DT                       │ ║
║  │           → Prime calculée sur 50,000 DT                       │ ║
║  └─────────────────────────────────────────────────────────────────┘ ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
`}</pre>
                </div>
              </div>

              {/* Examples */}
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                  📊 Exemples Concrets de Calcul
                </h4>
                
                <div className="space-y-3">
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-3 rounded">
                    <div className="font-medium text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                      <span>✅</span>
                      <span>Exemple 1 : VOL avec VV (Recommandé)</span>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-3 rounded text-xs font-mono space-y-1">
                      <div className="text-gray-600 dark:text-gray-400">Données :</div>
                      <div>  • Véhicule acheté : 50,000 DT (il y a 3 ans)</div>
                      <div>  • Valeur Vénale (VV) : 40,000 DT</div>
                      <div>  • Valeur à Neuf (VN) : 50,000 DT</div>
                      <div>  • Taux VOL : 0.00236 (0.236%)</div>
                      <div>  • Prime fixe : 30 DT</div>
                      <div>  • Réduction : 0%</div>
                      <div className="mt-2 text-gray-600 dark:text-gray-400">Calcul :</div>
                      <div className="text-blue-600 dark:text-blue-400">  Prime = ((VV × taux) + prime fixe) × réduction</div>
                      <div className="text-blue-600 dark:text-blue-400">  Prime = ((40,000 × 0.00236) + 30) × 1.0</div>
                      <div className="text-blue-600 dark:text-blue-400">  Prime = (94.4 + 30) × 1.0</div>
                      <div className="text-green-600 dark:text-green-400 font-bold">  Prime = 124.4 DT ✓</div>
                    </div>
                  </div>

                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-3 rounded">
                    <div className="font-medium text-yellow-900 dark:text-yellow-200 mb-2 flex items-center gap-2">
                      <span>⚠️</span>
                      <span>Exemple 2 : VOL avec VN (Si vous modifiez)</span>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-3 rounded text-xs font-mono space-y-1">
                      <div className="text-gray-600 dark:text-gray-400">Données (mêmes que Exemple 1) :</div>
                      <div>  • Valeur Vénale (VV) : 40,000 DT</div>
                      <div>  • Valeur à Neuf (VN) : 50,000 DT ← Utilisée</div>
                      <div>  • Taux VOL : 0.00236</div>
                      <div>  • Prime fixe : 30 DT</div>
                      <div className="mt-2 text-gray-600 dark:text-gray-400">Calcul :</div>
                      <div className="text-yellow-600 dark:text-yellow-400">  Prime = ((VN × taux) + prime fixe) × réduction</div>
                      <div className="text-yellow-600 dark:text-yellow-400">  Prime = ((50,000 × 0.00236) + 30) × 1.0</div>
                      <div className="text-yellow-600 dark:text-yellow-400">  Prime = (118 + 30) × 1.0</div>
                      <div className="text-orange-600 dark:text-orange-400 font-bold">  Prime = 148 DT (23.6 DT plus cher)</div>
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 p-3 rounded">
                    <div className="font-medium text-purple-900 dark:text-purple-200 mb-2 flex items-center gap-2">
                      <span>✨</span>
                      <span>Exemple 3 : TOUS RISQUES avec VN (Recommandé)</span>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-3 rounded text-xs font-mono space-y-1">
                      <div className="text-gray-600 dark:text-gray-400">Données :</div>
                      <div>  • Véhicule NEUF : 60,000 DT</div>
                      <div>  • Valeur à Neuf (VN) : 60,000 DT</div>
                      <div>  • Franchise : 0%</div>
                      <div>  • Taux : 0.032 (3.2%)</div>
                      <div>  • Prime fixe : 22 DT</div>
                      <div>  • Réduction : 10%</div>
                      <div className="mt-2 text-gray-600 dark:text-gray-400">Calcul :</div>
                      <div className="text-purple-600 dark:text-purple-400">  Prime = ((VN × taux) + prime fixe) × (1 - réduction)</div>
                      <div className="text-purple-600 dark:text-purple-400">  Prime = ((60,000 × 0.032) + 22) × 0.9</div>
                      <div className="text-purple-600 dark:text-purple-400">  Prime = (1,920 + 22) × 0.9</div>
                      <div className="text-green-600 dark:text-green-400 font-bold">  Prime = 1,747.8 DT ✓</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 p-3 rounded">
                    <div className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                      <span>ℹ️</span>
                      <span>Exemple 4 : ASSISTANCE (Optionnel - pas de VV/VN)</span>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-3 rounded text-xs font-mono space-y-1">
                      <div className="text-gray-600 dark:text-gray-400">Données :</div>
                      <div>  • Compagnie : LLOYD</div>
                      <div>  • Prime fixe : 115 DT</div>
                      <div className="mt-2 text-gray-600 dark:text-gray-400">Calcul :</div>
                      <div className="text-gray-600 dark:text-gray-400">  Prime = Prime fixe (pas de VV/VN utilisé)</div>
                      <div className="text-green-600 dark:text-green-400 font-bold">  Prime = 115 DT ✓</div>
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-500 italic">
                        → La valeur de référence n'est pas nécessaire ici
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Summary */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                  💡 Résumé
                </h4>
                <ul className="text-xs text-yellow-800 dark:text-yellow-300 space-y-1 list-disc list-inside">
                  <li><strong>Obligatoire</strong> : VOL, INCENDIE, TOUS RISQUES, DOMMAGES COLLISION</li>
                  <li><strong>Optionnel</strong> : Toutes les autres garanties</li>
                  <li>Le système recommande automatiquement la valeur standard</li>
                  <li>Vous pouvez toujours modifier la recommandation</li>
                  <li>Pour les garanties optionnelles, vous pouvez laisser vide</li>
                </ul>
              </div>
              </>
              ) : (
                /* FRANCHISE TAB */
                <>
                  {/* Introduction */}
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-4">
                    <h4 className="font-semibold text-purple-900 dark:text-purple-200 mb-2">
                      🎯 Qu'est-ce que la Franchise Tous Risques ?
                    </h4>
                    <p className="text-purple-800 dark:text-purple-300 mb-3">
                      La franchise est le montant (en %) qui reste à la charge de l'assuré en cas de sinistre. Plus la franchise est élevée, moins la prime d'assurance est chère.
                    </p>
                    <div className="bg-white dark:bg-gray-900 border-l-4 border-purple-500 p-3 rounded">
                      <div className="text-xs font-semibold text-purple-900 dark:text-purple-200 mb-2">
                        📋 Implémenté selon votre exigence :
                      </div>
                      <div className="bg-purple-100 dark:bg-purple-950 p-2 rounded mb-2">
                        <p className="text-xs italic text-purple-800 dark:text-purple-300">
                          "<span className="font-bold">Je n'ai pas trouvé où ajouter la franchise Tous Risques</span>"
                        </p>
                      </div>
                      <div className="bg-green-100 dark:bg-green-950 p-2 rounded">
                        <p className="text-xs font-bold text-green-800 dark:text-green-300">
                          ✅ Solution : "<span className="underline">Franchise maintenant disponible pour TOUTES les garanties</span>"
                        </p>
                      </div>
                      <div className="mt-3 text-xs text-purple-700 dark:text-purple-400 space-y-1">
                        <p>✓ <strong>Obligatoire</strong> pour : TOUS RISQUES (0%, 1%, 2%, 4%)</p>
                        <p>✓ <strong>Optionnel</strong> pour : Toutes les autres garanties</p>
                        <p>✓ <strong>Dynamique</strong> : Vous pouvez maintenant créer vos propres franchises personnalisées !</p>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Management */}
                  <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <h4 className="font-semibold text-blue-900 dark:text-blue-200">
                        🎉 Nouveau : Gestion Dynamique des Franchises
                      </h4>
                    </div>
                    <p className="text-sm text-blue-800 dark:text-blue-300 mb-3">
                      Vous avez maintenant un contrôle total sur les valeurs de franchise ! Plus besoin de modifier le code ou la base de données.
                    </p>
                    <div className="bg-white dark:bg-gray-900 rounded-lg p-3 space-y-3">
                      <div className="flex items-start gap-2">
                        <span className="text-green-600 dark:text-green-400 font-bold">✓</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Créer de nouvelles franchises</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Ajoutez 5%, 6%, 10% ou n'importe quelle valeur entre 0% et 100%</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-blue-600 dark:text-blue-400 font-bold">✓</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Modifier les franchises existantes</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Changez la valeur, le label ou la description à tout moment</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-purple-600 dark:text-purple-400 font-bold">✓</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Consulter les détails</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Visualisez toutes les informations : valeur, label, description, dates</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="text-red-600 dark:text-red-400 font-bold">✓</span>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">Supprimer les franchises inutiles</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Retirez les valeurs que vous n'utilisez plus (avec confirmation)</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 bg-blue-100 dark:bg-blue-950 p-3 rounded">
                      <p className="text-xs text-blue-900 dark:text-blue-200">
                        <strong>💡 Comment accéder ?</strong> Cliquez sur le bouton <Settings className="w-3 h-3 inline" /> "Gérer les franchises" dans le formulaire d'ajout de règle.
                      </p>
                    </div>
                  </div>

                  {/* Franchise Levels */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      📊 Les 4 Niveaux de Franchise Tous Risques
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="border-l-4 border-green-500 bg-green-50 dark:bg-green-900/20 p-3 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">0️⃣</span>
                          <div>
                            <div className="font-semibold text-green-900 dark:text-green-200">Franchise 0%</div>
                            <div className="text-xs text-green-700 dark:text-green-400">Couverture maximale</div>
                          </div>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-2 rounded text-xs font-mono">
                          Taux: 0.032 (3.2%)<br/>
                          Prime fixe: 22 DT<br/>
                          <span className="text-green-600 dark:text-green-400 font-bold">→ Prime la plus élevée</span>
                        </div>
                      </div>

                      <div className="border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-900/20 p-3 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">1️⃣</span>
                          <div>
                            <div className="font-semibold text-blue-900 dark:text-blue-200">Franchise 1%</div>
                            <div className="text-xs text-blue-700 dark:text-blue-400">Équilibre optimal</div>
                          </div>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-2 rounded text-xs font-mono">
                          Taux: 0.0265 (2.65%)<br/>
                          Prime fixe: 21.75 DT<br/>
                          <span className="text-blue-600 dark:text-blue-400 font-bold">→ Bon compromis</span>
                        </div>
                      </div>

                      <div className="border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">2️⃣</span>
                          <div>
                            <div className="font-semibold text-yellow-900 dark:text-yellow-200">Franchise 2%</div>
                            <div className="text-xs text-yellow-700 dark:text-yellow-400">Économie modérée</div>
                          </div>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-2 rounded text-xs font-mono">
                          Taux: 0.021 (2.1%)<br/>
                          Prime fixe: 19 DT<br/>
                          <span className="text-yellow-600 dark:text-yellow-400 font-bold">→ Prime réduite</span>
                        </div>
                      </div>

                      <div className="border-l-4 border-orange-500 bg-orange-50 dark:bg-orange-900/20 p-3 rounded">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-2xl">4️⃣</span>
                          <div>
                            <div className="font-semibold text-orange-900 dark:text-orange-200">Franchise 4%</div>
                            <div className="text-xs text-orange-700 dark:text-orange-400">Économie maximale</div>
                          </div>
                        </div>
                        <div className="bg-white dark:bg-gray-900 p-2 rounded text-xs font-mono">
                          Taux: 0.017 (1.7%)<br/>
                          Prime fixe: 15 DT<br/>
                          <span className="text-orange-600 dark:text-orange-400 font-bold">→ Prime la plus basse</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Diagram */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      📝 Schéma de Fonctionnement
                    </h4>
                    <div className="bg-gray-900 dark:bg-gray-950 p-4 rounded-lg text-xs font-mono text-green-400 overflow-x-auto">
                      <pre className="whitespace-pre">{`
╔═══════════════════════════════════════════════════════════════════════╗
║                    FRANCHISE TOUS RISQUES                             ║
╚═══════════════════════════════════════════════════════════════════════╝

┌─────────────────────────────────────────────────────────────────────┐
│  PRINCIPE : Plus la franchise est élevée, moins la prime est chère  │
└─────────────────────────────────────────────────────────────────────┘

        Franchise 0%          Franchise 1%          Franchise 2%          Franchise 4%
            ↓                     ↓                     ↓                     ↓
    ┌──────────────┐      ┌──────────────┐      ┌──────────────┐      ┌──────────────┐
    │ Taux: 3.2%   │      │ Taux: 2.65%  │      │ Taux: 2.1%   │      │ Taux: 1.7%   │
    │ Fixe: 22 DT  │      │ Fixe: 21.75  │      │ Fixe: 19 DT  │      │ Fixe: 15 DT  │
    └──────┬───────┘      └──────┬───────┘      └──────┬───────┘      └──────┬───────┘
           │                     │                     │                     │
           ▼                     ▼                     ▼                     ▼
    Prime MAXIMALE         Prime ÉLEVÉE          Prime MOYENNE         Prime MINIMALE
    💰💰💰💰💰              💰💰💰💰               💰💰💰                💰💰

╔═══════════════════════════════════════════════════════════════════════╗
║                    EXEMPLE CONCRET DE CALCUL                          ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  Véhicule : Valeur à Neuf (VN) = 60,000 DT                          ║
║  Réduction : 0% (aucune réduction)                                   ║
║                                                                       ║
║  ┌─────────────────────────────────────────────────────────────────┐ ║
║  │ Franchise 0% :                                                  │ ║
║  │   Prime = ((60,000 × 0.032) + 22) × 1.0                        │ ║
║  │   Prime = (1,920 + 22) × 1.0                                   │ ║
║  │   Prime = 1,942 DT ✓                                           │ ║
║  │                                                                 │ ║
║  │   En cas de sinistre : Assuré paie 0% → 0 DT                  │ ║
║  └─────────────────────────────────────────────────────────────────┘ ║
║                                                                       ║
║  ┌─────────────────────────────────────────────────────────────────┐ ║
║  │ Franchise 1% :                                                  │ ║
║  │   Prime = ((60,000 × 0.0265) + 21.75) × 1.0                    │ ║
║  │   Prime = (1,590 + 21.75) × 1.0                                │ ║
║  │   Prime = 1,611.75 DT ✓                                        │ ║
║  │                                                                 │ ║
║  │   En cas de sinistre : Assuré paie 1% → 600 DT                │ ║
║  │   Économie sur prime : 330.25 DT/an                            │ ║
║  └─────────────────────────────────────────────────────────────────┘ ║
║                                                                       ║
║  ┌─────────────────────────────────────────────────────────────────┐ ║
║  │ Franchise 2% :                                                  │ ║
║  │   Prime = ((60,000 × 0.021) + 19) × 1.0                        │ ║
║  │   Prime = (1,260 + 19) × 1.0                                   │ ║
║  │   Prime = 1,279 DT ✓                                           │ ║
║  │                                                                 │ ║
║  │   En cas de sinistre : Assuré paie 2% → 1,200 DT              │ ║
║  │   Économie sur prime : 663 DT/an                               │ ║
║  └─────────────────────────────────────────────────────────────────┘ ║
║                                                                       ║
║  ┌─────────────────────────────────────────────────────────────────┐ ║
║  │ Franchise 4% :                                                  │ ║
║  │   Prime = ((60,000 × 0.017) + 15) × 1.0                        │ ║
║  │   Prime = (1,020 + 15) × 1.0                                   │ ║
║  │   Prime = 1,035 DT ✓                                           │ ║
║  │                                                                 │ ║
║  │   En cas de sinistre : Assuré paie 4% → 2,400 DT              │ ║
║  │   Économie sur prime : 907 DT/an                               │ ║
║  └─────────────────────────────────────────────────────────────────┘ ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝
`}</pre>
                    </div>
                  </div>

                  {/* Comparison Table */}
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      📊 Tableau Comparatif (VN = 60,000 DT)
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs border border-gray-200 dark:border-gray-700">
                        <thead className="bg-gray-100 dark:bg-gray-900">
                          <tr>
                            <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-left">Franchise</th>
                            <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">Taux</th>
                            <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">Prime Fixe</th>
                            <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">Prime Totale</th>
                            <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">Reste à charge</th>
                            <th className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">Économie/an</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="bg-green-50 dark:bg-green-900/10">
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 font-semibold">0%</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">3.2%</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">22 DT</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right font-bold text-green-600">1,942 DT</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">0 DT</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">-</td>
                          </tr>
                          <tr className="bg-blue-50 dark:bg-blue-900/10">
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 font-semibold">1%</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">2.65%</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">21.75 DT</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right font-bold text-blue-600">1,611.75 DT</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">600 DT</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right text-green-600 font-bold">330.25 DT</td>
                          </tr>
                          <tr className="bg-yellow-50 dark:bg-yellow-900/10">
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 font-semibold">2%</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">2.1%</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">19 DT</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right font-bold text-yellow-600">1,279 DT</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">1,200 DT</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right text-green-600 font-bold">663 DT</td>
                          </tr>
                          <tr className="bg-orange-50 dark:bg-orange-900/10">
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 font-semibold">4%</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">1.7%</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">15 DT</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right font-bold text-orange-600">1,035 DT</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right">2,400 DT</td>
                            <td className="border border-gray-200 dark:border-gray-700 px-3 py-2 text-right text-green-600 font-bold">907 DT</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Precision Note */}
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                    <h4 className="font-semibold text-green-900 dark:text-green-200 mb-2">
                      ✅ Précision des Valeurs (21.75 DT)
                    </h4>
                    <p className="text-xs text-green-800 dark:text-green-300 mb-2">
                      Le système supporte maintenant les valeurs décimales avec 3 chiffres après la virgule.
                    </p>
                    <div className="bg-white dark:bg-gray-900 p-2 rounded text-xs font-mono">
                      Avant : 21.75 → arrondi à 22 ❌<br/>
                      Maintenant : 21.75 → conservé exactement ✅
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                    <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-2">
                      💡 Résumé
                    </h4>
                    <ul className="text-xs text-yellow-800 dark:text-yellow-300 space-y-1 list-disc list-inside">
                      <li><strong>Obligatoire</strong> pour TOUS RISQUES : Vous devez choisir 0%, 1%, 2% ou 4%</li>
                      <li><strong>Optionnel</strong> pour les autres garanties : Vous pouvez laisser vide</li>
                      <li>Chaque franchise a un <strong>taux</strong> et une <strong>prime fixe</strong> différents</li>
                      <li>Plus la franchise est élevée, <strong>moins la prime est chère</strong></li>
                      <li>Mais en cas de sinistre, <strong>l'assuré paie plus</strong></li>
                      <li>Le système supporte maintenant les valeurs comme <strong>21.75 DT</strong> sans arrondir</li>
                    </ul>
                  </div>
                </>
              )}
            </div>

            <div className="flex justify-end p-6 border-t border-gray-200 dark:border-gray-700">
              <Button onClick={() => setShowHelpModal(false)}>
                J'ai compris
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Franchise Manager Modal */}
      {showFranchiseManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Gérer les Franchises
                </h3>
              </div>
              <button 
                onClick={() => setShowFranchiseManager(false)} 
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  Ajoutez ou supprimez des valeurs de franchise. Ces valeurs seront disponibles dans le menu déroulant.
                </p>
              </div>

              {/* Add New Franchise */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ajouter une nouvelle franchise
                </label>
                <div className="space-y-2">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={newFranchise}
                    onChange={(e) => setNewFranchise(e.target.value)}
                    placeholder="Valeur (%) - Ex: 5"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Label (optionnel) - Ex: Économie moyenne"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <textarea
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                    placeholder="Description (optionnel)"
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                  />
                  <Button
                    type="button"
                    onClick={() => {
                      const value = parseFloat(newFranchise);
                      if (!isNaN(value) && value >= 0 && value <= 100) {
                        createFranchiseMutation.mutate({
                          value,
                          label: newLabel || undefined,
                          description: newDescription || undefined,
                        });
                      } else {
                        toast.error('Valeur invalide (0-100)');
                      }
                    }}
                    disabled={createFranchiseMutation.isPending}
                    className="w-full"
                  >
                    {createFranchiseMutation.isPending ? 'Ajout...' : 'Ajouter'}
                  </Button>
                </div>
              </div>

              {/* Current Franchises */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Franchises disponibles ({franchiseData?.length || 0})
                </label>
                <div className="space-y-2 max-h-64 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2">
                  {franchiseData?.sort((a: any, b: any) => parseFloat(a.value) - parseFloat(b.value)).map((franchise: any) => (
                    <div
                      key={franchise.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center gap-3 flex-1">
                        <Target className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-white">
                            {parseFloat(franchise.value)}%
                            {franchise.isStandard && (
                              <span className="ml-2 px-2 py-0.5 text-xs rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                Standard
                              </span>
                            )}
                          </div>
                          {franchise.label && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">{franchise.label}</div>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingFranchise(franchise)}
                          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                          title="Voir détails"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingFranchise(franchise)}
                          className="text-purple-600 hover:text-purple-800 dark:text-purple-400 dark:hover:text-purple-300 p-2 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeletingFranchise(franchise)}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info about standard values */}
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                <div className="flex items-start gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-800 dark:text-yellow-300">
                    <strong>Valeurs standards :</strong> 0%, 1%, 2%, 4% sont les franchises recommandées pour Tous Risques selon les pratiques du secteur.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowFranchiseManager(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Franchise Modal */}
      {editingFranchise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Modifier Franchise {parseFloat(editingFranchise.value)}%
                </h3>
              </div>
              <button onClick={() => setEditingFranchise(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Valeur (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  defaultValue={parseFloat(editingFranchise.value)}
                  onChange={(e) => setEditingFranchise({ ...editingFranchise, value: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Label
                </label>
                <input
                  type="text"
                  defaultValue={editingFranchise.label || ''}
                  onChange={(e) => setEditingFranchise({ ...editingFranchise, label: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description
                </label>
                <textarea
                  defaultValue={editingFranchise.description || ''}
                  onChange={(e) => setEditingFranchise({ ...editingFranchise, description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={() => setEditingFranchise(null)}>
                Annuler
              </Button>
              <Button
                type="button"
                onClick={() => {
                  updateFranchiseMutation.mutate({
                    id: editingFranchise.id,
                    data: {
                      value: parseFloat(editingFranchise.value),
                      label: editingFranchise.label || undefined,
                      description: editingFranchise.description || undefined,
                    },
                  });
                }}
                disabled={updateFranchiseMutation.isPending}
              >
                {updateFranchiseMutation.isPending ? 'Enregistrement...' : 'Enregistrer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Franchise Modal */}
      {viewingFranchise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Détails Franchise {parseFloat(viewingFranchise.value)}%
                </h3>
              </div>
              <button onClick={() => setViewingFranchise(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                    <Target className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-blue-900 dark:text-blue-200">
                      {parseFloat(viewingFranchise.value)}%
                    </div>
                    {viewingFranchise.isStandard && (
                      <span className="px-2 py-0.5 text-xs rounded bg-blue-200 dark:bg-blue-800 text-blue-900 dark:text-blue-100">
                        Valeur Standard
                      </span>
                    )}
                  </div>
                </div>
                {viewingFranchise.label && (
                  <div className="mb-2">
                    <div className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">Label:</div>
                    <div className="text-sm text-blue-900 dark:text-blue-200">{viewingFranchise.label}</div>
                  </div>
                )}
                {viewingFranchise.description && (
                  <div>
                    <div className="text-xs font-semibold text-blue-800 dark:text-blue-300 mb-1">Description:</div>
                    <div className="text-sm text-blue-900 dark:text-blue-200">{viewingFranchise.description}</div>
                  </div>
                )}
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-1">
                <div>Créé le: {new Date(viewingFranchise.createdAt).toLocaleDateString('fr-FR')}</div>
                <div>Modifié le: {new Date(viewingFranchise.updatedAt).toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button type="button" variant="outline" onClick={() => setViewingFranchise(null)}>
                Fermer
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setViewingFranchise(null);
                  setEditingFranchise(viewingFranchise);
                }}
              >
                Modifier
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingFranchise && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[90] p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Confirmer la suppression
                </h3>
              </div>
              <button 
                onClick={() => setDeletingFranchise(null)} 
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full flex-shrink-0">
                  <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <p className="text-gray-900 dark:text-white font-medium mb-2">
                    Êtes-vous sûr de vouloir supprimer la franchise {parseFloat(deletingFranchise.value)}% ?
                  </p>
                  {deletingFranchise.label && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                      Label : {deletingFranchise.label}
                    </p>
                  )}
                  <p className="text-sm text-red-600 dark:text-red-400">
                    Cette action est irréversible.
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setDeletingFranchise(null)}
              >
                Annuler
              </Button>
              <Button
                type="button"
                onClick={() => {
                  deleteFranchiseMutation.mutate(deletingFranchise.id);
                  setDeletingFranchise(null);
                }}
                disabled={deleteFranchiseMutation.isPending}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {deleteFranchiseMutation.isPending ? 'Suppression...' : 'Supprimer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* BG Capital Limit Manager Modal */}
      {showBgLimitManager && (
        <BgCapitalLimitModal
          limit={null}
          onClose={() => setShowBgLimitManager(false)}
          onSuccess={() => {
            setShowBgLimitManager(false);
            queryClient.invalidateQueries({ queryKey: ['bg-capital-limits'] });
          }}
        />
      )}
    </div>
  );
};
