import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, CheckCircle } from 'lucide-react';
import { Select } from '../ui/Select';
import api from '../../lib/api/client';
import { FormulaType, FractionnementType, type Guarantee } from '../../types';
import { useGuaranteeAvailability } from '../../hooks/useGuaranteeAvailability';
import { useAuth } from '../../contexts/AuthContext';

interface CoverageSelectionStepProps {
  vehicleAge: number;
  formulaType?: FormulaType;
  selectedGuarantees: string[];
  conventionId?: string;
  franchiseRate?: number;
  bgLimit?: number;
  dcCapitals?: Record<string, number>;
  fractionnement?: FractionnementType;
  firstCirculationDate: Date;
  usageId?: string;
  companyIds?: string[];
  onUpdate: (data: { 
    formulaType: FormulaType; 
    selectedGuarantees: string[]; 
    conventionId?: string;
    franchiseRate?: number;
    bgLimit?: number;
    dcCapitals?: Record<string, number>;
    fractionnement?: FractionnementType;
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
  dcCapitals,
  fractionnement,
  firstCirculationDate,
  usageId,
  companyIds,
  onUpdate,
  onNext,
  onBack,
}: CoverageSelectionStepProps) => {
  const { user, refreshUser } = useAuth();
  const [localFormula, setLocalFormula] = useState<FormulaType | ''>(formulaType || '');
  const [localGuarantees, setLocalGuarantees] = useState<string[]>(selectedGuarantees);
  const [localConvention, setLocalConvention] = useState<string>(conventionId || '');
  const [localFranchiseRate, setLocalFranchiseRate] = useState<number>(franchiseRate || 0);
  const [localBgLimit, setLocalBgLimit] = useState<number>(bgLimit || 1000);
  const [localDcCapitals, setLocalDcCapitals] = useState<Record<string, number>>(dcCapitals || {});
  const [localFractionnement, setLocalFractionnement] = useState<FractionnementType>(fractionnement || FractionnementType.ANNUEL);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(companyIds || []);
  const [showDcModal, setShowDcModal] = useState(false);
  const [dcModalCompanyId, setDcModalCompanyId] = useState<string | null>(null);
  const [tempDcCapital, setTempDcCapital] = useState<number>(1000);
  const [showBgModal, setShowBgModal] = useState(false);
  const [tempBgLimit, setTempBgLimit] = useState<number>(1000);

  // Refresh user data on mount to get latest conventions
  useEffect(() => {
    refreshUser();
  }, []);

  // Sync selectedCompanies with companyIds prop
  useEffect(() => {
    if (companyIds && companyIds.length > 0) {
      setSelectedCompanies(companyIds);
    }
  }, [companyIds]);

  useEffect(() => {
    setLocalFormula(formulaType || '');
    setLocalGuarantees(selectedGuarantees);
    setLocalConvention(conventionId || '');
    setLocalFranchiseRate(franchiseRate || 0);
    setLocalBgLimit(bgLimit || 1000);
    setLocalDcCapitals(dcCapitals || {});
    setLocalFractionnement(fractionnement || FractionnementType.ANNUEL);
  }, [formulaType, selectedGuarantees, conventionId, franchiseRate, bgLimit, dcCapitals, fractionnement]);

  // Get user's organization conventions (primary conventions owned by the organization)
  const userOrgConventions = user?.organization?.conventions?.filter(c => c.status === 'ACTIVE') || [];
  
  // Debug logging
  console.log('🔍 Convention Debug - FULL DATA:', {
    userExists: !!user,
    userEmail: user?.email,
    hasOrganization: !!user?.organization,
    organizationId: user?.organization?.id,
    organizationName: user?.organization?.name,
    organizationCode: user?.organization?.code,
    allConventions: user?.organization?.conventions,
    activeConventions: userOrgConventions,
    conventionsCount: userOrgConventions.length,
  });
  
  // Auto-select organization's first convention if user has exactly 1 convention and no convention is selected yet
  useEffect(() => {
    if (userOrgConventions.length === 1 && !localConvention) {
      const primaryConvention = userOrgConventions[0];
      setLocalConvention(primaryConvention.id);
      if (localFormula) {
        onUpdate({
          formulaType: localFormula as FormulaType,
          selectedGuarantees: localGuarantees,
          conventionId: primaryConvention.id,
          franchiseRate: localFranchiseRate,
          bgLimit: localBgLimit,
          dcCapitals: localDcCapitals,
          fractionnement: localFractionnement,
        });
      }
    }
  }, [userOrgConventions, localConvention, localFormula]);

  const { data: guarantees } = useQuery({
    queryKey: ['guarantees'],
    queryFn: async () => {
      const { data } = await api.get('/guarantees');
      return data as Guarantee[];
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

  // Get first selected company for availability check
  const firstSelectedCompanyId = selectedCompanies.length > 0 ? selectedCompanies[0] : undefined;
  
  // Fetch availability for all optional guarantees
  const allOptionalCodes = optionalGuarantees.map(g => g.code);
  const { data: availabilityMap } = useGuaranteeAvailability(
    firstSelectedCompanyId,
    allOptionalCodes,
    localFormula as FormulaType | undefined,
    localFranchiseRate,
  );

  // Fetch BG capital limits from API (admin-configurable)
  const { data: bgCapitalLimits } = useQuery({
    queryKey: ['bg-capital-limits'],
    queryFn: async () => {
      const { data } = await api.get('/bg-capital-limits');
      return data as Array<{ id: string; value: number; label: string; isActive: boolean }>;
    },
  });

  // Fetch DC capital tiers from API (admin-configurable)
  const { data: dcCapitalTiers } = useQuery({
    queryKey: ['dc-capital-tiers'],
    queryFn: async () => {
      const { data } = await api.get('/dc-capital-tiers');
      return data as Array<{ 
        id: string; 
        minAmount: number; 
        maxAmount: number | null; 
        step: number; 
        isActive: boolean;
        company: { id: string; name: string; code: string };
        usage: { id: string; code: string; nameFr: string };
      }>;
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

  const handleFormulaChange = (formula: string) => {
    // DC formula - just mark selected, modal opens on company selection
    if (formula === FormulaType.DOMMAGES_COLLISIONS) {
      setLocalFormula(formula as FormulaType);
      onUpdate({
        formulaType: formula as FormulaType,
        selectedGuarantees: localGuarantees,
        conventionId: localConvention || undefined,
        franchiseRate: localFranchiseRate,
        bgLimit: localBgLimit,
        dcCapitals: localDcCapitals,
        fractionnement: localFractionnement,
      });
      return;
    }

    // TR formula
    if (formula === FormulaType.TOUS_RISQUES_0) {
      setLocalFormula(formula as FormulaType);
      setLocalFranchiseRate(0);
      onUpdate({
        formulaType: formula as FormulaType,
        selectedGuarantees: localGuarantees,
        conventionId: localConvention || undefined,
        franchiseRate: 0,
        bgLimit: localBgLimit,
        dcCapitals: localDcCapitals,
        fractionnement: localFractionnement,
      });
      return;
    }

    // Standard formula
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
      dcCapitals: localDcCapitals,
      fractionnement: localFractionnement,
    });
  };

  const confirmBgLimit = () => {
    const bgGuarantee = optionalGuarantees.find(g => g.code === 'BG');
    if (!bgGuarantee) return;
    
    const updatedGuarantees = [...localGuarantees, bgGuarantee.id];
    setLocalGuarantees(updatedGuarantees);
    setLocalBgLimit(tempBgLimit);
    
    if (localFormula) {
      onUpdate({
        formulaType: localFormula as FormulaType,
        selectedGuarantees: updatedGuarantees,
        conventionId: localConvention || undefined,
        franchiseRate: localFranchiseRate,
        bgLimit: tempBgLimit,
        dcCapitals: localDcCapitals,
        fractionnement: localFractionnement,
        companyIds: selectedCompanies,
      });
    }
    
    setShowBgModal(false);
  };

  const confirmDcCapital = () => {
    if (!dcModalCompanyId) return;

    const updated = { ...localDcCapitals, [dcModalCompanyId]: tempDcCapital };
    setLocalDcCapitals(updated);
    
    onUpdate({
      formulaType: localFormula as FormulaType,
      selectedGuarantees: localGuarantees,
      conventionId: localConvention || undefined,
      franchiseRate: localFranchiseRate,
      bgLimit: localBgLimit,
      dcCapitals: updated,
      fractionnement: localFractionnement,
      companyIds: selectedCompanies,
    });

    setShowDcModal(false);
    setDcModalCompanyId(null);
  };

  const handleGuaranteeToggle = (guaranteeId: string) => {
    const bgGuarantee = optionalGuarantees.find(g => g.code === 'BG');
    const isTogglingBg = bgGuarantee && guaranteeId === bgGuarantee.id;
    const willBeSelected = !localGuarantees.includes(guaranteeId);
    
    // Check if we need to show BG modal
    const needsBgModal = isTogglingBg && 
                        willBeSelected && 
                        (localFormula === FormulaType.STANDARD || localFormula === FormulaType.DOMMAGES_COLLISIONS);
    
    if (needsBgModal) {
      // Open modal instead of directly toggling
      setTempBgLimit(localBgLimit || 1000);
      setShowBgModal(true);
      return;
    }
    
    // Normal toggle for other guarantees or when unchecking BG
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
        dcCapitals: localDcCapitals,
        fractionnement: localFractionnement,
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
        dcCapitals: localDcCapitals,
        fractionnement: localFractionnement,
        companyIds: selectedCompanies,
      });
      onNext();
    }
  };

  // Validation: Check if all selected companies have DC capitals when DC formula is selected
  const allDcCapitalsSet = localFormula !== FormulaType.DOMMAGES_COLLISIONS ||
    selectedCompanies.every(cid => localDcCapitals[cid] !== undefined && localDcCapitals[cid] > 0);

  // Helper: Check if guarantee is available (uses new system with fallback)
  const isGuaranteeAvailable = (code: string): boolean => {
    if (!availabilityMap) return true; // Fallback: available
    const availability = availabilityMap[code];
    if (!availability) return true; // Fallback: available
    return availability.isAvailable;
  };

  // Helper: Check if guarantee is free (uses new system with fallback)
  const isGuaranteeFree = (code: string): boolean => {
    if (!availabilityMap) {
      return false;
    }
    const availability = availabilityMap[code];
    if (!availability) {
      return false;
    }
    return availability.isFree;
  };

  const isBrisDeGlacesFree = isGuaranteeFree('BG');

  // Helper: Generate DC capital options from tier with performance safeguard
  const MAX_OPTIONS_PER_TIER = 200;
  
  const generateOptionsFromTier = (tier: any) => {
    const options: Array<{ value: number; label: string }> = [];
    const min = Number(tier.minAmount);
    const max = tier.maxAmount ? Number(tier.maxAmount) : null;
    const step = Number(tier.step);

    if (max && step > 0) {
      // Calculate number of options
      const numberOfOptions = Math.floor((max - min) / step) + 1;
      
      if (numberOfOptions > MAX_OPTIONS_PER_TIER) {
        console.warn(
          `Tier [${tier.company?.name} / ${tier.usage?.nameFr}] has ${numberOfOptions} options (min=${min}, max=${max}, step=${step}). ` +
          `Skipping to avoid performance issues. Please adjust the step or range in admin panel.`
        );
        return options; // empty array → tier is ignored
      }

      for (let value = min; value <= max; value += step) {
        const label = `${value.toLocaleString('fr-FR')} DT`;
        options.push({ value, label });
      }
    } else if (!max) {
      // No maximum → single option
      const label = `${min.toLocaleString('fr-FR')} DT (minimum)`;
      options.push({ value: min, label });
    }
    return options;
  };

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

      {/* Convention Display/Selection */}
      {userOrgConventions.length === 1 ? (
        /* Single convention - Show as badge (read-only) */
        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Convention appliquée
              </p>
              <p className="text-lg font-bold text-blue-900 dark:text-blue-200">
                {userOrgConventions[0].name}
              </p>
            </div>
          </div>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
            Les réductions de votre convention seront automatiquement appliquées à ce devis.
          </p>
        </div>
      ) : userOrgConventions.length > 1 ? (
        /* Multiple conventions - Show dropdown */
        <div>
          <Select
            label="Convention"
            value={localConvention}
            onChange={(e) => setLocalConvention(e.target.value)}
            options={[
              { value: '', label: 'Aucune convention' },
              ...userOrgConventions.map((c: any) => ({ value: c.id, label: c.name })),
            ]}
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Vous avez accès à plusieurs conventions. Sélectionnez celle à utiliser pour ce devis.
          </p>
        </div>
      ) : (
        /* No conventions - Show info message */
        <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Aucune convention disponible. Le devis sera généré sans réduction conventionnelle.
          </p>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Fractionnement
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label
            className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
              localFractionnement === FractionnementType.ANNUEL
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
            }`}
          >
            <input
              type="radio"
              value={FractionnementType.ANNUEL}
              checked={localFractionnement === FractionnementType.ANNUEL}
              onChange={() => {
                setLocalFractionnement(FractionnementType.ANNUEL);
                if (localFormula) {
                  onUpdate({
                    formulaType: localFormula as FormulaType,
                    selectedGuarantees: localGuarantees,
                    conventionId: localConvention || undefined,
                    franchiseRate: localFranchiseRate,
                    bgLimit: localBgLimit,
                    fractionnement: FractionnementType.ANNUEL,
                    dcCapitals: localDcCapitals,
                    companyIds: selectedCompanies,
                  });
                }
              }}
              className="mt-1"
            />
            <div className="ml-3 flex-1">
              <div className="font-semibold text-gray-900 dark:text-white">Annuel</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Prime annuelle complète
              </p>
            </div>
          </label>

          <label
            className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
              localFractionnement === FractionnementType.SEMESTRIEL
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
            }`}
          >
            <input
              type="radio"
              value={FractionnementType.SEMESTRIEL}
              checked={localFractionnement === FractionnementType.SEMESTRIEL}
              onChange={() => {
                setLocalFractionnement(FractionnementType.SEMESTRIEL);
                if (localFormula) {
                  onUpdate({
                    formulaType: localFormula as FormulaType,
                    selectedGuarantees: localGuarantees,
                    conventionId: localConvention || undefined,
                    franchiseRate: localFranchiseRate,
                    bgLimit: localBgLimit,
                    fractionnement: FractionnementType.SEMESTRIEL,
                    dcCapitals: localDcCapitals,
                    companyIds: selectedCompanies,
                  });
                }
              }}
              className="mt-1"
            />
            <div className="ml-3 flex-1">
              <div className="font-semibold text-gray-900 dark:text-white">Semestriel</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Prime nette divisée par 2, frais et taxes recalculés sur la base semestrielle
              </p>
            </div>
          </label>
        </div>
      </div>

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
              {isBrisDeGlacesFree && localFranchiseRate === 0 && (
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
              const hasDcCapital = localDcCapitals[c.id] !== undefined && localDcCapitals[c.id] > 0;
              const needsDcCapital = localFormula === FormulaType.DOMMAGES_COLLISIONS && checked && !hasDcCapital;
              
              return (
                <label key={c.id} className={`flex items-center p-3 border rounded-lg ${
                  checked ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'
                } ${
                  needsDcCapital ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''
                }`}>
                  <input
                    type="checkbox"
                    className="mr-3"
                    checked={checked}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const next = [...selectedCompanies, c.id];
                        if (next.length <= 2) {
                          setSelectedCompanies(next);
                          
                          if (localFormula === FormulaType.DOMMAGES_COLLISIONS) {
                            setDcModalCompanyId(c.id);
                            setTempDcCapital(localDcCapitals[c.id] || 1000);
                            setShowDcModal(true);
                          } else if (localFormula) {
                            onUpdate({
                              formulaType: localFormula,
                              selectedGuarantees: localGuarantees,
                              conventionId: localConvention || undefined,
                              franchiseRate: localFranchiseRate,
                              bgLimit: localBgLimit,
                              dcCapitals: localDcCapitals,
                              fractionnement: localFractionnement,
                              companyIds: next,
                            });
                          }
                        }
                      } else {
                        const next = selectedCompanies.filter(id => id !== c.id);
                        setSelectedCompanies(next);
                        
                        const { [c.id]: _, ...rest } = localDcCapitals;
                        setLocalDcCapitals(rest);
                        
                        if (localFormula) {
                          onUpdate({
                            formulaType: localFormula,
                            selectedGuarantees: localGuarantees,
                            conventionId: localConvention || undefined,
                            franchiseRate: localFranchiseRate,
                            bgLimit: localBgLimit,
                            dcCapitals: rest,
                            fractionnement: localFractionnement,
                            companyIds: next,
                          });
                        }
                      }
                    }}
                  />
                  <div className="flex-1">
                    <span className="text-sm text-gray-900 dark:text-white">{c.name}</span>
                    {localFormula === FormulaType.DOMMAGES_COLLISIONS && checked && hasDcCapital && (
                      <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                        ✓ {localDcCapitals[c.id].toLocaleString('fr-FR')} DT
                      </span>
                    )}
                    {needsDcCapital && (
                      <span className="ml-2 text-xs text-red-600 dark:text-red-400">
                        ⚠ Capital requis
                      </span>
                    )}
                  </div>
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
                // Filter out formula-type guarantees ONLY when Standard is selected
                if (localFormula === FormulaType.STANDARD) {
                  if (guarantee.code === 'DOMMAGES_COLLISIONS') return false;
                  if (guarantee.code === 'TOUS_RISQUES_ZERO') return false;
                  if (guarantee.code === 'TOUS_RISQUES') return false;
                  if (guarantee.code === 'DOMMAGES_COLLISION') return false;
                  
                  // Also filter by name (case-insensitive) for manually entered guarantees
                  const nameLower = guarantee.nameFr?.toLowerCase() || '';
                  if (nameLower.includes('tous risques') && !nameLower.includes('bris')) return false;
                  if (nameLower.includes('dommages collision')) return false;
                  if (nameLower === 'tous risques') return false;
                  if (nameLower === 'dommages collisions') return false;
                }
                
                // ALWAYS filter these - they are not guarantees
                if (guarantee.code === 'DEFENSE_RECOURS') return false;
                
                // ✅ NEW: Check availability from backend (with fallback to old logic)
                if (!isGuaranteeAvailable(guarantee.code)) {
                  return false; // Hide if not available
                }
                
                // OLD LOGIC (kept as fallback for Lloyd bundling UI)
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
                const isFree = isGuaranteeFree(guarantee.code);
                const isBgWithLimit = guarantee.code === 'BG' && localGuarantees.includes(guarantee.id) && localBgLimit;

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
                        {isBgWithLimit && (
                          <span className="ml-2 text-sm font-normal text-green-600 dark:text-green-400">
                            {localBgLimit.toLocaleString('fr-FR')} DT
                          </span>
                        )}
                      </div>
                      {isFree && (
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
                            dcCapitals: localDcCapitals,
                            fractionnement: localFractionnement,
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
                            dcCapitals: localDcCapitals,
                            fractionnement: localFractionnement,
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
      {/* REMOVED - Now handled by modal */}

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

      <div className="flex gap-3 mt-6">
        <button
          type="button"
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Retour
        </button>
        <div className="flex-1">
          <button
            type="submit"
            disabled={!localFormula || selectedCompanies.length === 0 || !allDcCapitalsSet}
            className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Suivant
          </button>
          {localFormula === FormulaType.DOMMAGES_COLLISIONS && selectedCompanies.length > 0 && !allDcCapitalsSet && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">
              ⚠ Veuillez configurer le capital DC pour toutes les compagnies sélectionnées
            </p>
          )}
        </div>
      </div>
    </form>

    {/* DC Capital Modal */}
    {showDcModal && dcModalCompanyId && (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Configuration Dommages Collision
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {companies?.find((c: any) => c.id === dcModalCompanyId)?.name}
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Capital assuré (DT)
            </label>
            <select
              value={tempDcCapital.toString()}
              onChange={(e) => setTempDcCapital(Number(e.target.value))}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            >
              {(() => {
                const filteredTiers = dcCapitalTiers?.filter(
                  tier => tier.isActive 
                    && tier.company.id === dcModalCompanyId
                    && tier.usage.id === usageId
                );

                if (filteredTiers && filteredTiers.length > 0) {
                  const allOptions = filteredTiers.flatMap(tier => generateOptionsFromTier(tier));
                  
                  if (allOptions.length > 0) {
                    return allOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ));
                  }
                }
                
                return (
                  <option value="" disabled>
                    Aucun palier configuré
                  </option>
                );
              })()}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Sélectionnez le capital assuré pour cette compagnie
            </p>
            {(() => {
              const simulationData = JSON.parse(localStorage.getItem('simulationData') || '{}');
              const marketValue = simulationData.vehicle?.marketValue || 0;
              const maxAllowed = marketValue * 0.8;
              if (tempDcCapital > maxAllowed && marketValue > 0) {
                return (
                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      ⚠️ <strong>Attention:</strong> Le capital sélectionné ({tempDcCapital.toLocaleString('fr-FR')} DT) dépasse 80% de la valeur vénale ({maxAllowed.toFixed(0)} DT max). Cela pourrait être rejeté lors de la génération du devis.
                    </p>
                  </div>
                );
              }
              return null;
            })()}
          </div>

          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={() => {
                setShowDcModal(false);
                setDcModalCompanyId(null);
                setSelectedCompanies(prev => prev.filter(id => id !== dcModalCompanyId));
              }}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={confirmDcCapital}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Confirmer
            </button>
          </div>
        </div>
      </div>
    )}
      {/* BG Limit Modal */}
      {showBgModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Configuration Bris de Glaces
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Sélectionnez la limite de capital pour la garantie Bris de Glaces
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Limite Bris de Glaces (DT)
              </label>
              <select
                value={tempBgLimit.toString()}
                onChange={(e) => setTempBgLimit(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                {bgCapitalLimits && bgCapitalLimits.length > 0
                  ? bgCapitalLimits
                      .filter(limit => limit.isActive)
                      .map(limit => (
                        <option key={limit.id} value={limit.value.toString()}>
                          {limit.label || `${limit.value.toLocaleString('fr-FR')} DT`}
                        </option>
                      ))
                  : [
                      { value: '1000', label: '1 000 DT' },
                      { value: '2000', label: '2 000 DT' },
                      { value: '3000', label: '3 000 DT' },
                    ].map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))
                }
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Cette limite détermine le montant maximum de remboursement
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowBgModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmBgLimit}
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
