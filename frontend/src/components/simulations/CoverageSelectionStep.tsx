import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, } from 'lucide-react';
import { Select } from '../ui/Select';
import api from '../../lib/api/client';
import { FormulaType, type Guarantee } from '../../types';

interface CoverageSelectionStepProps {
  vehicleAge: number;
  formulaType?: FormulaType;
  selectedGuarantees: string[];
  conventionId?: string;
  franchiseRate?: number;
  bgLimit?: number;
  dcCapital?: number;
  firstCirculationDate: Date;
  onUpdate: (data: { 
    formulaType: FormulaType; 
    selectedGuarantees: string[]; 
    conventionId?: string;
    franchiseRate?: number;
    bgLimit?: number;
    dcCapital?: number;
    companyIds?: string[];
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

export const CoverageSelectionStep = ({
  formulaType,
  selectedGuarantees,
  conventionId,
  franchiseRate,
  bgLimit,
  dcCapital,
  firstCirculationDate,
  onUpdate,
  onNext,
}: CoverageSelectionStepProps) => {
  const [localFormula, setLocalFormula] = useState<FormulaType | ''>(formulaType || '');
  const [localGuarantees, setLocalGuarantees] = useState<string[]>(selectedGuarantees);
  const [localConvention, setLocalConvention] = useState<string>(conventionId || '');
  const [localFranchiseRate, setLocalFranchiseRate] = useState<number>(franchiseRate || 0);
  const [localBgLimit, setLocalBgLimit] = useState<number>(bgLimit || 1000);
  const [localDcCapital, setLocalDcCapital] = useState<number>(dcCapital || 1000);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
  const [showFormulaModal, setShowFormulaModal] = useState(false);
  const [pendingFormula, setPendingFormula] = useState<FormulaType | null>(null);

  const { data: guarantees } = useQuery({
    queryKey: ['guarantees'],
    queryFn: async () => {
      const { data } = await api.get('/guarantees');
      return data as Guarantee[];
    },
  });

  const { data: conventions } = useQuery({
    queryKey: ['conventions', 'my'],
    queryFn: async () => {
      const { data } = await api.get('/conventions/my');
      return data;
    },
  });

  const mandatoryGuarantees = guarantees?.filter(g => !g.isOptional && g.isActive) || [];
  const optionalGuarantees = guarantees?.filter(g => g.isOptional && g.isActive) || [];

  const { data: companies } = useQuery({
    queryKey: ['companies', 'active'],
    queryFn: async () => {
      const { data } = await api.get('/companies');
      return data.filter((c: any) => c.isActive);
    },
  });

  // Fetch BG capital limits from API (admin-configurable)
  const { data: bgCapitalLimits } = useQuery({
    queryKey: ['bg-capital-limits'],
    queryFn: async () => {
      const { data } = await api.get('/bg-capital-limits');
      return data as Array<{ id: string; value: number; label: string; isActive: boolean }>;
    },
  });

  // Calculate vehicle age
  const calculateAge = (date: Date): number => {
    const now = new Date();
    const circulation = new Date(date);
    const age = now.getFullYear() - circulation.getFullYear();
    const hasNotReachedBirthday = now < new Date(now.getFullYear(), circulation.getMonth(), circulation.getDate());
    return hasNotReachedBirthday ? age - 1 : age;
  };

  const vehicleAge = calculateAge(firstCirculationDate);
  console.log('🚗 Vehicle age calculation:', { firstCirculationDate, vehicleAge, canSelectTousRisques: vehicleAge < 2 });
  
  const canSelectTousRisques = vehicleAge < 2;
  const canSelectDommagesCollision = vehicleAge < 10;

  useEffect(() => {
    if (localFormula === FormulaType.TOUS_RISQUES_0) {
      const brisDeGlacesGuarantee = optionalGuarantees.find(g => g.code === 'BG');
      if (brisDeGlacesGuarantee && !localGuarantees.includes(brisDeGlacesGuarantee.id)) {
        setLocalGuarantees([...localGuarantees, brisDeGlacesGuarantee.id]);
      }
    }
  }, [localFormula, optionalGuarantees, localGuarantees]);

  const handleFormulaChange = (formula: string) => {
    // If selecting DC or TR, show modal first
    if (formula === FormulaType.DOMMAGES_COLLISIONS || formula === FormulaType.TOUS_RISQUES_0) {
      setPendingFormula(formula as FormulaType);
      setShowFormulaModal(true);
      return;
    }

    // Standard formula - apply directly
    setLocalFormula(formula as FormulaType);
    
    let updatedGuarantees = localGuarantees;
    if (formula === FormulaType.STANDARD) {
      updatedGuarantees = localGuarantees.filter(gId => {
        const g = optionalGuarantees.find(og => og.id === gId);
        return g?.code !== 'TOUS_RISQUES' && g?.code !== 'DOMMAGES_COLLISION';
      });
      setLocalGuarantees(updatedGuarantees);
    }
    
    onUpdate({
      formulaType: formula as FormulaType,
      selectedGuarantees: updatedGuarantees,
      conventionId: localConvention || undefined,
      franchiseRate: localFranchiseRate,
      bgLimit: localBgLimit,
      dcCapital: localDcCapital,
    });
  };

  const confirmFormulaSelection = () => {
    if (!pendingFormula) return;

    setLocalFormula(pendingFormula);
    
    let updatedGuarantees = localGuarantees;
    if (pendingFormula === FormulaType.TOUS_RISQUES_0) {
      const brisDeGlacesGuarantee = optionalGuarantees.find(g => g.code === 'BG');
      if (brisDeGlacesGuarantee && !localGuarantees.includes(brisDeGlacesGuarantee.id)) {
        updatedGuarantees = [...localGuarantees, brisDeGlacesGuarantee.id];
        setLocalGuarantees(updatedGuarantees);
      }
      setLocalBgLimit(1000);
    }
    
    onUpdate({
      formulaType: pendingFormula,
      selectedGuarantees: updatedGuarantees,
      conventionId: localConvention || undefined,
      franchiseRate: localFranchiseRate,
      bgLimit: localBgLimit,
      dcCapital: localDcCapital,
    });

    setShowFormulaModal(false);
    setPendingFormula(null);
  };

  const handleGuaranteeToggle = (guaranteeId: string) => {
    const updatedGuarantees = localGuarantees.includes(guaranteeId)
      ? localGuarantees.filter(id => id !== guaranteeId)
      : [...localGuarantees, guaranteeId];
    
    setLocalGuarantees(updatedGuarantees);
    
    if (localFormula) {
      onUpdate({
        formulaType: localFormula as FormulaType,
        selectedGuarantees: updatedGuarantees,
        conventionId: localConvention || undefined,
        franchiseRate: localFranchiseRate,
        bgLimit: localBgLimit,
        dcCapital: localDcCapital,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (localFormula) {
      onUpdate({
        formulaType: localFormula as FormulaType,
        selectedGuarantees: localGuarantees,
        conventionId: localConvention || undefined,
        franchiseRate: localFranchiseRate,
        bgLimit: localBgLimit,
        dcCapital: localDcCapital,
        companyIds: selectedCompanies,
      });
      onNext();
    }
  };

  const isBrisDeGlacesFree = localFormula === FormulaType.TOUS_RISQUES_0;

  return (
    <>
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <Shield className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Sélection de la couverture
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choisissez votre formule et garanties optionnelles
          </p>
        </div>
      </div>

      {conventions && conventions.length > 0 && (
        <Select
          label="Convention (optionnel)"
          value={localConvention}
          onChange={(e) => setLocalConvention(e.target.value)}
          options={[
            { value: '', label: 'Aucune convention' },
            ...conventions.map((c: any) => ({ value: c.id, label: c.name })),
          ]}
        />
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Formule d'assurance <span className="text-red-500">*</span>
        </label>
        <div className="space-y-3">
          <label
            className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
              localFormula === FormulaType.STANDARD
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
            }`}
          >
            <input
              type="radio"
              value={FormulaType.STANDARD}
              checked={localFormula === FormulaType.STANDARD}
              onChange={(e) => handleFormulaChange(e.target.value)}
              className="mt-1"
            />
            <div className="ml-3 flex-1">
              <div className="font-semibold text-gray-900 dark:text-white">Standard</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Responsabilité civile + garanties de base
              </p>
            </div>
          </label>

          <label
            className={`flex items-start p-4 border-2 rounded-lg transition-all ${
              !canSelectDommagesCollision
                ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900'
                : localFormula === FormulaType.DOMMAGES_COLLISIONS
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 cursor-pointer'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 cursor-pointer'
            }`}
          >
            <input
              type="radio"
              value={FormulaType.DOMMAGES_COLLISIONS}
              checked={localFormula === FormulaType.DOMMAGES_COLLISIONS}
              onChange={(e) => handleFormulaChange(e.target.value)}
              disabled={!canSelectDommagesCollision}
              className="mt-1"
            />
            <div className="ml-3 flex-1">
              <div className="font-semibold text-gray-900 dark:text-white">
                Dommages Collision
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Couverture des dommages en cas de collision avec un autre véhicule terrestre
              </p>
              {!canSelectDommagesCollision && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  ⚠ Disponible uniquement pour véhicules &lt; 10 ans
                </p>
              )}
            </div>
          </label>

          <label
            className={`flex items-start p-4 border-2 rounded-lg transition-all ${
              !canSelectTousRisques
                ? 'opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900'
                : localFormula === FormulaType.TOUS_RISQUES_0
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 cursor-pointer'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 cursor-pointer'
            }`}
          >
            <input
              type="radio"
              value={FormulaType.TOUS_RISQUES_0}
              checked={localFormula === FormulaType.TOUS_RISQUES_0}
              onChange={(e) => handleFormulaChange(e.target.value)}
              disabled={!canSelectTousRisques}
              className="mt-1"
            />
            <div className="ml-3 flex-1">
              <div className="font-semibold text-gray-900 dark:text-white">
                Tous Risques
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Couverture maximale sans franchise
              </p>
              {isBrisDeGlacesFree && (
                <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                  ✓ Bris de Glaces GRATUIT avec cette formule
                </p>
              )}
            </div>
          </label>
        </div>
      </div>

      {companies && companies.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Compagnies (choisir 1 ou 2)
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {companies.map((c: any) => {
              const checked = selectedCompanies.includes(c.id);
              return (
                <label key={c.id} className={`flex items-center p-3 border rounded-lg ${checked ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
                  <input
                    type="checkbox"
                    className="mr-3"
                    checked={checked}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...selectedCompanies, c.id]
                        : selectedCompanies.filter(id => id !== c.id);
                      if (next.length <= 2) {
                        setSelectedCompanies(next);
                        if (localFormula) {
                          onUpdate({
                            formulaType: localFormula,
                            selectedGuarantees: localGuarantees,
                            conventionId: localConvention || undefined,
                            franchiseRate: localFranchiseRate,
                            bgLimit: localBgLimit,
                            dcCapital: localDcCapital,
                            companyIds: next,
                          });
                        }
                      }
                    }}
                  />
                  <span className="text-sm text-gray-900 dark:text-white">{c.name}</span>
                </label>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Vous pouvez comparer jusqu'à 2 compagnies.</p>
        </div>
      )}



      {optionalGuarantees.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Garanties optionnelles
          </label>
          <div className="space-y-2">
            {optionalGuarantees
              .filter((guarantee) => {
                // NEVER show these - they are formulas, not optional guarantees
                if (guarantee.code === 'DOMMAGES_COLLISIONS') return false;
                if (guarantee.code === 'TOUS_RISQUES_ZERO') return false;
                if (guarantee.code === 'DEFENSE_RECOURS') return false;
                
                // Only hide CAT NAT and DOMMAGES_EMEUTES if Lloyd is the ONLY company selected
                const hasLloyd = companies?.some((c: any) => c.code === 'LLOYD' && selectedCompanies.includes(c.id));
                const hasOnlyLloyd = hasLloyd && selectedCompanies.length === 1;
                
                if (hasOnlyLloyd && (guarantee.code === 'CATASTROPHES_NATURELLES' || guarantee.code === 'DOMMAGES_EMEUTES')) {
                  return false;
                }
                
                return true;
              })
              .map((guarantee) => {
                const isDisabled = guarantee.code === 'BG' && isBrisDeGlacesFree;

                return (
                  <label
                    key={guarantee.id}
                    className={`flex items-center p-3 border rounded-lg transition-all ${
                      isDisabled
                        ? 'bg-gray-50 dark:bg-gray-900 opacity-60'
                        : 'hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer'
                    } ${
                      localGuarantees.includes(guarantee.id)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={localGuarantees.includes(guarantee.id)}
                      onChange={() => handleGuaranteeToggle(guarantee.id)}
                      disabled={isDisabled}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-gray-900 dark:text-white">
                        {guarantee.nameFr}
                      </div>
                      {guarantee.code === 'BG' && isBrisDeGlacesFree && (
                        <span className="text-xs text-green-600 dark:text-green-400">
                          Inclus gratuitement
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            
            {/* Lloyd Combined Option: Only show when Lloyd is the ONLY company selected */}
            {(() => {
              const hasLloyd = companies?.some((c: any) => c.code === 'LLOYD' && selectedCompanies.includes(c.id));
              const hasOnlyLloyd = hasLloyd && selectedCompanies.length === 1;
              
              if (!hasOnlyLloyd) return null;
              
              const catNatGuarantee = optionalGuarantees.find(g => g.code === 'CATASTROPHES_NATURELLES');
              const dommagesEmeutesGuarantee = optionalGuarantees.find(g => g.code === 'DOMMAGES_EMEUTES');
              
              if (!catNatGuarantee || !dommagesEmeutesGuarantee) return null;
              
              const isBothSelected = localGuarantees.includes(catNatGuarantee.id) && localGuarantees.includes(dommagesEmeutesGuarantee.id);
              
              return (
                <label
                  className={`flex items-center p-3 border rounded-lg transition-all hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer ${
                    isBothSelected
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isBothSelected}
                    onChange={() => {
                      if (isBothSelected) {
                        const updated = localGuarantees.filter(id => id !== catNatGuarantee.id && id !== dommagesEmeutesGuarantee.id);
                        setLocalGuarantees(updated);
                        if (localFormula) {
                          onUpdate({
                            formulaType: localFormula,
                            selectedGuarantees: updated,
                            conventionId: localConvention || undefined,
                            franchiseRate: localFranchiseRate,
                            bgLimit: localBgLimit,
                            dcCapital: localDcCapital,
                          });
                        }
                      } else {
                        const updated = [...localGuarantees, catNatGuarantee.id, dommagesEmeutesGuarantee.id];
                        setLocalGuarantees(updated);
                        if (localFormula) {
                          onUpdate({
                            formulaType: localFormula,
                            selectedGuarantees: updated,
                            conventionId: localConvention || undefined,
                            franchiseRate: localFranchiseRate,
                            bgLimit: localBgLimit,
                            dcCapital: localDcCapital,
                          });
                        }
                      }
                    }}
                    className="mr-3"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 dark:text-white">
                      Catastrophes Naturelles / Dommages suite émeutes
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      Extension combinée (Lloyd Tunisien)
                    </span>
                  </div>
                </label>
              );
            })()}
            
            {/* Info message when both companies selected */}
            {(() => {
              const hasLloyd = companies?.some((c: any) => c.code === 'LLOYD' && selectedCompanies.includes(c.id));
              const hasAmana = companies?.some((c: any) => c.code === 'AMANA' && selectedCompanies.includes(c.id));
              const hasBothCompanies = hasLloyd && hasAmana;
              
              if (!hasBothCompanies) return null;
              
              const catNatGuarantee = optionalGuarantees.find(g => g.code === 'CATASTROPHES_NATURELLES');
              const dommagesEmeutesGuarantee = optionalGuarantees.find(g => g.code === 'DOMMAGES_EMEUTES');
              
              if (!catNatGuarantee || !dommagesEmeutesGuarantee) return null;
              
              const hasEither = localGuarantees.includes(catNatGuarantee.id) || localGuarantees.includes(dommagesEmeutesGuarantee.id);
              
              if (!hasEither) return null;
              
              return (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    ℹ️ <strong>Note:</strong> Lloyd Tunisien regroupe ces garanties en une seule extension. Les deux devis seront générés correctement selon les règles de chaque compagnie.
                  </p>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* BG limit for DC formula when BG is selected */}
      {localFormula === FormulaType.DOMMAGES_COLLISIONS && (() => {
        const bgGuarantee = optionalGuarantees.find(g => g.code === 'BG');
        const isBgSelected = bgGuarantee && localGuarantees.includes(bgGuarantee.id);
        return isBgSelected ? (
          <Select
            label="Limite Bris de Glaces (DT) - Optionnel"
            value={localBgLimit.toString()}
            onChange={(e) => {
              const limit = Number(e.target.value);
              setLocalBgLimit(limit);
              onUpdate({
                formulaType: localFormula,
                selectedGuarantees: localGuarantees,
                conventionId: localConvention || undefined,
                franchiseRate: localFranchiseRate,
                bgLimit: limit,
                dcCapital: localDcCapital,
              });
            }}
            options={
              bgCapitalLimits && bgCapitalLimits.length > 0
                ? bgCapitalLimits
                    .filter(limit => limit.isActive)
                    .map(limit => ({
                      value: limit.value.toString(),
                      label: limit.label || `${limit.value.toLocaleString('fr-FR')} DT`,
                    }))
                : [
                    { value: '1000', label: '1 000 DT' },
                    { value: '2000', label: '2 000 DT' },
                    { value: '3000', label: '3 000 DT' },
                  ]
            }
          />
        ) : null;
      })()}

      {localFormula === FormulaType.STANDARD && (() => {
        const bgGuarantee = optionalGuarantees.find(g => g.code === 'BG');
        const isBgSelected = bgGuarantee && localGuarantees.includes(bgGuarantee.id);
        return isBgSelected ? (
          <Select
            label="Limite Bris de Glaces (DT)"
            value={localBgLimit.toString()}
            onChange={(e) => {
              const limit = Number(e.target.value);
              setLocalBgLimit(limit);
              onUpdate({
                formulaType: localFormula,
                selectedGuarantees: localGuarantees,
                conventionId: localConvention || undefined,
                franchiseRate: localFranchiseRate,
                bgLimit: limit,
                dcCapital: localDcCapital,
              });
            }}
            options={
              bgCapitalLimits && bgCapitalLimits.length > 0
                ? bgCapitalLimits
                    .filter(limit => limit.isActive)
                    .map(limit => ({
                      value: limit.value.toString(),
                      label: limit.label || `${limit.value.toLocaleString('fr-FR')} DT`,
                    }))
                : [
                    { value: '1000', label: '1 000 DT' },
                    { value: '2000', label: '2 000 DT' },
                    { value: '3000', label: '3 000 DT' },
                  ]
            }
          />
        ) : null;
      })()}

      {mandatoryGuarantees.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Garanties incluses systématiquement
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Ces garanties sont automatiquement incluses dans toutes les formules
          </p>
          <div className="space-y-2">
            {mandatoryGuarantees.map((guarantee) => (
              <div
                key={guarantee.id}
                className="flex items-center p-3 border rounded-lg bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              >
                <input
                  type="checkbox"
                  checked={true}
                  disabled={true}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-900 dark:text-white">
                    {guarantee.nameFr}
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    Obligatoire
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </form>

    {/* Formula Configuration Modal */}
    {showFormulaModal && pendingFormula && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            {pendingFormula === FormulaType.DOMMAGES_COLLISIONS ? 'Configuration Dommages Collision' : 'Configuration Tous Risques'}
          </h3>

          {pendingFormula === FormulaType.DOMMAGES_COLLISIONS && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Capital assuré (DT)
              </label>
              <select
                value={localDcCapital.toString()}
                onChange={(e) => setLocalDcCapital(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="1000">1000 DT (1K-10K)</option>
                <option value="5000">5000 DT (10K-20K)</option>
                <option value="10000">10000 DT (20K-50K)</option>
                <option value="25000">25000 DT (50K-100K)</option>
              </select>
            </div>
          )}

          {pendingFormula === FormulaType.TOUS_RISQUES_0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Taux de franchise
              </label>
              <select
                value={localFranchiseRate.toString()}
                onChange={(e) => setLocalFranchiseRate(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                <option value="0">0% (Bris de Glaces gratuit et sans limite)</option>
                <option value="1">1%</option>
                <option value="2">2%</option>
                <option value="4">4%</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setShowFormulaModal(false);
                setPendingFormula(null);
              }}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmFormulaSelection}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
};
