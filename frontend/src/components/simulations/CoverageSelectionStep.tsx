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
  acCapitals?: Record<string, number>;
  fractionnement?: FractionnementType;
  firstCirculationDate: Date;
  usageId?: string;
  companyIds?: string[];
  marketValue?: number;
  onUpdate: (data: { 
    formulaType: FormulaType; 
    selectedGuarantees: string[]; 
    conventionId?: string;
    franchiseRate?: number;
    bgLimit?: number;
    dcCapitals?: Record<string, number>;
    acCapitals?: Record<string, number>;
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
  acCapitals,
  fractionnement,
  firstCirculationDate,
  usageId,
  companyIds,
  marketValue,
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
  const [localAssuranceConducteurCapitals, setLocalAssuranceConducteurCapitals] = useState<Record<string, number>>(acCapitals || {});
  const [localFractionnement, setLocalFractionnement] = useState<FractionnementType>(fractionnement || FractionnementType.ANNUEL);
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>(companyIds || []);
  const [showDcModal, setShowDcModal] = useState(false);
  const [dcModalCompanyId, setDcModalCompanyId] = useState<string | null>(null);
  const [tempDcCapital, setTempDcCapital] = useState<number>(1000);
  const [showBgModal, setShowBgModal] = useState(false);
  const [tempBgLimit, setTempBgLimit] = useState<number>(1000);
  const [showFranchiseModal, setShowFranchiseModal] = useState(false);
  const [tempFranchiseRate, setTempFranchiseRate] = useState<number>(0);
  const [showAssuranceConducteurModal, setShowAssuranceConducteurModal] = useState(false);
  const [assuranceConducteurModalCompanyId, setAssuranceConducteurModalCompanyId] = useState<string | null>(null);
  const [tempAssuranceConducteurCapital, setTempAssuranceConducteurCapital] = useState<number>(10000);

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
          acCapitals: localAssuranceConducteurCapitals,
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

  // Fetch bundled guarantees dynamically from API
  const { data: bundlingRules } = useQuery({
    queryKey: ['bundled-guarantees', selectedCompanies, localFormula],
    queryFn: async () => {
      if (selectedCompanies.length === 0) return { includedGuarantees: new Set<string>(), parentGuarantees: new Set<string>() };
      
      const includedGuarantees = new Set<string>();
      const parentGuarantees = new Set<string>();
      
      for (const companyId of selectedCompanies) {
        try {
          const { data } = await api.get(`/guarantee-bundlings/company/${companyId}`);
          
          data.forEach((bundling: any) => {
            const appliesToFormula = !bundling.formulaType || bundling.formulaType === localFormula;
            
            if (appliesToFormula && bundling.isActive) {
              // Mark included guarantees to hide
              includedGuarantees.add(bundling.includedGuarantee.code);
              // Mark parent guarantees (these should be shown)
              parentGuarantees.add(bundling.parentGuarantee.code);
            }
          });
        } catch (error) {
          console.error(`Error fetching bundlings for company ${companyId}:`, error);
        }
      }
      
      return { includedGuarantees, parentGuarantees };
    },
    enabled: selectedCompanies.length > 0,
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

  // Fetch Assurance Conducteur capital options from pricing rules
  const { data: assuranceConducteurCapitals, isLoading: isLoadingAssuranceConducteurCapitals } = useQuery({
    queryKey: ['assurance-conducteur-capitals', assuranceConducteurModalCompanyId],
    queryFn: async () => {
      if (!assuranceConducteurModalCompanyId) {
        return [];
      }
      
      try {
        const url = `/pricing-rules/company/${assuranceConducteurModalCompanyId}/guarantee/OPTIONAL_ASSURANCE_CONDUCTEUR`;
        const { data } = await api.get(url);
        
        const capitalMap = new Map();
        data
          .filter((rule: any) => rule.minCapital && rule.isActive)
          .forEach((rule: any) => {
            const value = Number(rule.minCapital);
            if (!capitalMap.has(value)) {
              capitalMap.set(value, {
                value,
                label: `${value.toLocaleString('fr-FR')} DT`
              });
            }
          });
        
        const capitals = Array.from(capitalMap.values()).sort((a, b) => a.value - b.value);
        return capitals;
      } catch (error: any) {
        console.error('Error fetching Assurance Conducteur capitals:', error);
        return [];
      }
    },
    enabled: !!assuranceConducteurModalCompanyId,
    staleTime: 0,
    gcTime: 0,
  });

  // Fetch franchise values from API (admin-configurable)
  const { data: franchiseValues } = useQuery({
    queryKey: ['franchise-values'],
    queryFn: async () => {
      const { data } = await api.get('/franchise-values');
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

  // Fetch DC Config for the modal company to get maxCapitalPercent and plafondAbsolu
  const { data: dcConfig } = useQuery({
    queryKey: ['dc-config', dcModalCompanyId, usageId],
    queryFn: async () => {
      if (!dcModalCompanyId || !usageId) return null;
      const { data } = await api.get('/dc-config', {
        params: { companyId: dcModalCompanyId, usageId }
      });
      // Returns array, get first active config
      return data && data.length > 0 ? data[0] : null;
    },
    enabled: !!dcModalCompanyId && !!usageId,
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
  
  // Fetch eligible formulas dynamically from backend
  const { data: eligibilityData, isLoading: isLoadingEligibility, isError: isEligibilityError } = useQuery({
    queryKey: ['formula-eligibility', selectedCompanies, usageId, vehicleAge],
    queryFn: async () => {
      if (!selectedCompanies.length || !usageId) return null;
      
      // Check eligibility for each formula and each company
      const results: Record<string, { eligible: boolean; maxAge?: number; reason?: string }> = {};
      const errors: string[] = [];
      
      for (const companyId of selectedCompanies) {
        for (const formula of ['STANDARD', 'TOUS_RISQUES_0', 'DOMMAGES_COLLISIONS']) {
          try {
            const { data } = await api.get(
              `/formula-eligibility/check?companyId=${companyId}&usageId=${usageId}&formulaType=${formula}&vehicleAge=${vehicleAge}`
            );
            const key = `${companyId}_${formula}`;
            results[key] = data;
          } catch (error) {
            console.error(`Error checking eligibility for ${formula}:`, error);
            errors.push(`${formula}`);
            // Mark as not eligible if API fails (fail-safe)
            const key = `${companyId}_${formula}`;
            results[key] = { 
              eligible: false, 
              reason: 'Erreur lors de la vérification de l\'éligibilité' 
            };
          }
        }
      }
      
      // If there were errors, log them
      if (errors.length > 0) {
        console.warn('Eligibility check failed for:', errors);
      }
      
      return results;
    },
    enabled: selectedCompanies.length > 0 && !!usageId,
    staleTime: 30000, // Cache for 30 seconds to reduce API calls
    retry: 2, // Retry failed requests twice
  });
  
  // Check if a formula is eligible for ALL selected companies
  const isFormulaEligible = (formulaType: string): { eligible: boolean; reason?: string; loading?: boolean } => {
    // If no usage or companies selected, disable all formulas
    if (!usageId || selectedCompanies.length === 0) {
      return { eligible: false, reason: 'Veuillez sélectionner un usage et une compagnie' };
    }
    
    // If still loading, show loading state
    if (isLoadingEligibility) {
      return { eligible: false, loading: true };
    }
    
    // If error occurred, allow all formulas (fail open, not closed)
    if (isEligibilityError || !eligibilityData) {
      return { 
        eligible: true,
        reason: undefined
      };
    }
    
    // Check that ALL selected companies have eligibility data
    for (const companyId of selectedCompanies) {
      const key = `${companyId}_${formulaType}`;
      const result = eligibilityData[key];
      
      // If data is missing for this company, fail-safe to not eligible
      if (!result) {
        return { 
          eligible: false, 
          reason: 'Données d\'éligibilité manquantes. Veuillez réessayer.' 
        };
      }
      
      // If any company rejects, formula is not eligible
      if (!result.eligible) {
        return { 
          eligible: false, 
          reason: result.reason || `Non disponible pour cette compagnie` 
        };
      }
    }
    
    return { eligible: true };
  };
  
  const tousRisquesEligibility = isFormulaEligible('TOUS_RISQUES_0');
  const dommagesCollisionEligibility = isFormulaEligible('DOMMAGES_COLLISIONS');
  const standardEligibility = isFormulaEligible('STANDARD');
  
  const canSelectTousRisques = tousRisquesEligibility.eligible;
  const canSelectDommagesCollision = dommagesCollisionEligibility.eligible;
  const canSelectStandard = standardEligibility.eligible;

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
        acCapitals: localAssuranceConducteurCapitals,
        fractionnement: localFractionnement,
      });
      return;
    }

    // TR formula - open franchise modal
    if (formula === FormulaType.TOUS_RISQUES_0) {
      setLocalFormula(formula as FormulaType);
      setTempFranchiseRate(localFranchiseRate || 0);
      setShowFranchiseModal(true);
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
      acCapitals: localAssuranceConducteurCapitals,
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

  const confirmAssuranceConducteurCapital = () => {
    if (!assuranceConducteurModalCompanyId) return;

    const updated = { ...localAssuranceConducteurCapitals, [assuranceConducteurModalCompanyId]: tempAssuranceConducteurCapital };
    setLocalAssuranceConducteurCapitals(updated);

    // Find next company without a capital
    const nextCompany = selectedCompanies.find(cid => cid !== assuranceConducteurModalCompanyId && !updated[cid]);
    
    if (nextCompany) {
      // Open modal for next company
      setAssuranceConducteurModalCompanyId(nextCompany);
      setTempAssuranceConducteurCapital(updated[nextCompany] || 10000);
      // modal stays open
      return;
    }

    // All companies have capitals — add guarantee
    const assuranceConducteurGuarantee = optionalGuarantees.find(g => g.code === 'ASSURANCE_CONDUCTEUR');
    if (!assuranceConducteurGuarantee) return;

    const updatedGuarantees = localGuarantees.includes(assuranceConducteurGuarantee.id)
      ? localGuarantees
      : [...localGuarantees, assuranceConducteurGuarantee.id];
    setLocalGuarantees(updatedGuarantees);

    if (localFormula) {
      onUpdate({
        formulaType: localFormula as FormulaType,
        selectedGuarantees: updatedGuarantees,
        conventionId: localConvention || undefined,
        franchiseRate: localFranchiseRate,
        bgLimit: localBgLimit,
        dcCapitals: localDcCapitals,
        acCapitals: updated,
        fractionnement: localFractionnement,
        companyIds: selectedCompanies,
      });
    }

    setShowAssuranceConducteurModal(false);
    setAssuranceConducteurModalCompanyId(null);
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
      acCapitals: localAssuranceConducteurCapitals,
      fractionnement: localFractionnement,
      companyIds: selectedCompanies,
    });

    setShowDcModal(false);
    setDcModalCompanyId(null);
  };

  const handleGuaranteeToggle = (guaranteeId: string) => {
    const bgGuarantee = optionalGuarantees.find(g => g.code === 'BG');
    const assuranceConducteurGuarantee = optionalGuarantees.find(g => g.code === 'ASSURANCE_CONDUCTEUR');
    const isTogglingBg = bgGuarantee && guaranteeId === bgGuarantee.id;
    const isTogglingAssuranceConducteur = assuranceConducteurGuarantee && guaranteeId === assuranceConducteurGuarantee.id;
    const willBeSelected = !localGuarantees.includes(guaranteeId);
    
    // Check if we need to show BG modal (now for ALL formulas including TR 0%)
    const needsBgModal = isTogglingBg && willBeSelected;
    
    if (needsBgModal) {
      // Open modal instead of directly toggling
      setTempBgLimit(localBgLimit || 1000);
      setShowBgModal(true);
      return;
    }
    
    // Check if we need to show Assurance Conducteur modal
    const needsAssuranceConducteurModal = isTogglingAssuranceConducteur && willBeSelected;
    
    if (needsAssuranceConducteurModal) {
      // Open modal for EACH selected company, like DC
      if (selectedCompanies.length > 0) {
        // Open modal for first company that doesn't have a capital set
        const companyWithoutCapital = selectedCompanies.find(cid => !localAssuranceConducteurCapitals[cid]);
        if (companyWithoutCapital) {
          setAssuranceConducteurModalCompanyId(companyWithoutCapital);
          setTempAssuranceConducteurCapital(localAssuranceConducteurCapitals[companyWithoutCapital] || 10000);
          setShowAssuranceConducteurModal(true);
        }
      }
      return;
    }
    
    // Normal toggle for other guarantees or when unchecking
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
        acCapitals: localAssuranceConducteurCapitals,
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
        acCapitals: localAssuranceConducteurCapitals,
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

  // Helper: Performance safeguard for tier generation
  const MAX_OPTIONS_PER_TIER = 200;

  // Helper: Generate DC capital options from all tiers with deduplication
  const generateAllDcOptions = (tiers: any[]) => {
    const allOptions: Array<{ value: number; label: string }> = [];
    const seen = new Set<number>();

    // Sort tiers by minAmount
    const sorted = [...tiers].sort((a, b) => Number(a.minAmount) - Number(b.minAmount));

    for (const tier of sorted) {
      const step = Number(tier.step);
      const max = tier.maxAmount ? Number(tier.maxAmount) : null;
      const min = Number(tier.minAmount);
      
      if (!max || step <= 0) continue;

      // Check if this would create too many options
      const numberOfOptions = Math.floor((max - min) / step) + 1;
      if (numberOfOptions > MAX_OPTIONS_PER_TIER) {
        console.warn(
          `Tier [${tier.company?.name} / ${tier.usage?.nameFr}] has ${numberOfOptions} options (min=${min}, max=${max}, step=${step}). ` +
          `Skipping to avoid performance issues. Please adjust the step or range in admin panel.`
        );
        continue;
      }

      // Round min to nearest step boundary (handles overlapping tiers like 10001)
      // e.g., min=10001, step=5000 → start=10000
      const start = Math.round(min / step) * step;
      const end = Math.floor(max / step) * step;

      for (let value = start; value <= end; value += step) {
        if (!seen.has(value) && value >= min && value <= max) {
          seen.add(value);
          allOptions.push({ value, label: `${value.toLocaleString('fr-FR')} DT` });
        }
      }
    }

    return allOptions.sort((a, b) => a.value - b.value);
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
                    acCapitals: localAssuranceConducteurCapitals,
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
                    acCapitals: localAssuranceConducteurCapitals,
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
        
        {/* Error Banner */}
        {isEligibilityError && (
          <div className="mb-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
            <p className="text-sm text-red-800 dark:text-red-300">
              ⚠️ Erreur lors de la vérification de l'éligibilité. Veuillez réessayer ou contacter le support.
            </p>
          </div>
        )}
        
        {/* Loading Skeleton */}
        {isLoadingEligibility && (
          <div className="mb-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
            <p className="text-sm text-blue-800 dark:text-blue-300 flex items-center gap-2">
              <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Vérification de l'éligibilité des formules...
            </p>
          </div>
        )}
        
        <div className="space-y-3">
          <label
            className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
              localFormula === FormulaType.STANDARD
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                : canSelectStandard
                ? 'border-gray-200 dark:border-gray-700 hover:border-blue-300'
                : 'border-gray-200 dark:border-gray-700 opacity-50 cursor-not-allowed'
            }`}
          >
            <input
              type="radio"
              value={FormulaType.STANDARD}
              checked={localFormula === FormulaType.STANDARD}
              onChange={(e) => handleFormulaChange(e.target.value)}
              disabled={!canSelectStandard || isLoadingEligibility}
              className="mt-1"
            />
            <div className="ml-3 flex-1">
              <div className="font-semibold text-gray-900 dark:text-white">Standard</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Responsabilité civile + garanties de base
              </p>
              {!canSelectStandard && standardEligibility.reason && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                  ⚠ {standardEligibility.reason}
                </p>
              )}
            </div>
          </label>

          <label
            className={`flex items-start p-4 border-2 rounded-lg transition-all ${
              !canSelectDommagesCollision || isLoadingEligibility
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
              disabled={!canSelectDommagesCollision || isLoadingEligibility}
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
                  ⚠ {dommagesCollisionEligibility.reason || 'Non disponible pour ce véhicule'}
                </p>
              )}
            </div>
          </label>

          <label
            className={`flex items-start p-4 border-2 rounded-lg transition-all ${
              !canSelectTousRisques || isLoadingEligibility
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
              disabled={!canSelectTousRisques || isLoadingEligibility}
              className="mt-1"
            />
            <div className="ml-3 flex-1">
              <div className="font-semibold text-gray-900 dark:text-white">
                Tous Risques
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Couverture maximale
              </p>
              {localFormula === FormulaType.TOUS_RISQUES_0 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  Franchise: {localFranchiseRate === 0 ? 'Sans franchise (0%)' : `${localFranchiseRate}%`}
                </p>
              )}
              {isBrisDeGlacesFree && localFranchiseRate === 0 && localFormula === FormulaType.TOUS_RISQUES_0 && (
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
                              acCapitals: localAssuranceConducteurCapitals,
                              fractionnement: localFractionnement,
                              companyIds: next,
                            });
                          }
                        }
                      } else {
                        const next = selectedCompanies.filter(id => id !== c.id);
                        setSelectedCompanies(next);
                        
                        const { [c.id]: _dc, ...restDc } = localDcCapitals;
                        const { [c.id]: _ac, ...restAc } = localAssuranceConducteurCapitals;
                        setLocalDcCapitals(restDc);
                        setLocalAssuranceConducteurCapitals(restAc);
                        
                        if (localFormula) {
                          onUpdate({
                            formulaType: localFormula,
                            selectedGuarantees: localGuarantees,
                            conventionId: localConvention || undefined,
                            franchiseRate: localFranchiseRate,
                            bgLimit: localBgLimit,
                            dcCapitals: restDc,
                            acCapitals: restAc,
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
                // Case 1: Formula = Dommages Collision
                // Hide: Tous Risques (any variation) AND Dommages Collision itself
                if (localFormula === FormulaType.DOMMAGES_COLLISIONS) {
                  // Hide Tous Risques variations
                  if (guarantee.code === 'TOUS_RISQUES_ZERO') return false;
                  if (guarantee.code === 'TOUS_RISQUES') return false;
                  if (guarantee.code === 'TOUS_RISQUES_0') return false;
                  
                  // Hide Dommages Collision itself
                  if (guarantee.code === 'DOMMAGES_COLLISIONS') return false;
                  if (guarantee.code === 'DOMMAGES_COLLISION') return false;
                  
                  // Also check by name (case-insensitive)
                  const nameLower = guarantee.nameFr?.toLowerCase() || '';
                  if (nameLower.includes('tous risques') && !nameLower.includes('bris')) return false;
                  if (nameLower.includes('dommages collision')) return false;
                }
                
                // Case 2: Formula = Tous Risques
                // Hide: Tous Risques itself AND Dommages Collision
                if (localFormula === FormulaType.TOUS_RISQUES_0) {
                  // Hide Tous Risques variations (the formula itself)
                  if (guarantee.code === 'TOUS_RISQUES_ZERO') return false;
                  if (guarantee.code === 'TOUS_RISQUES') return false;
                  if (guarantee.code === 'TOUS_RISQUES_0') return false;
                  
                  // Hide Dommages Collision
                  if (guarantee.code === 'DOMMAGES_COLLISIONS') return false;
                  if (guarantee.code === 'DOMMAGES_COLLISION') return false;
                  
                  // Also check by name (case-insensitive)
                  const nameLower = guarantee.nameFr?.toLowerCase() || '';
                  if (nameLower.includes('tous risques') && !nameLower.includes('bris')) return false;
                  if (nameLower.includes('dommages collision')) return false;
                }
                
                // Case 3: Formula = Standard
                // Hide: Tous Risques AND Dommages Collision (they are not available for Standard)
                if (localFormula === FormulaType.STANDARD) {
                  // Hide Tous Risques variations
                  if (guarantee.code === 'TOUS_RISQUES_ZERO') return false;
                  if (guarantee.code === 'TOUS_RISQUES') return false;
                  if (guarantee.code === 'TOUS_RISQUES_0') return false;
                  
                  // Hide Dommages Collision
                  if (guarantee.code === 'DOMMAGES_COLLISIONS') return false;
                  if (guarantee.code === 'DOMMAGES_COLLISION') return false;
                  
                  // Also check by name (case-insensitive)
                  const nameLower = guarantee.nameFr?.toLowerCase() || '';
                  if (nameLower.includes('tous risques') && !nameLower.includes('bris')) return false;
                  if (nameLower.includes('dommages collision')) return false;
                }
                
                // ALWAYS filter these - they are not guarantees
                if (guarantee.code === 'DEFENSE_RECOURS') return false;
                
                // ✅ Check availability from backend
                if (!isGuaranteeAvailable(guarantee.code)) {
                  return false;
                }
                
                // ✅ Check if guarantee is an INCLUDED guarantee in a bundle (hide it)
                // Do NOT hide parent guarantees - they act as the combined option
                if (bundlingRules && bundlingRules.includedGuarantees.has(guarantee.code)) {
                  return false; // Hide included guarantees only
                }
                
                return true;
              })
              .map((guarantee) => {
                const isDisabled = false;
                const isFree = isGuaranteeFree(guarantee.code);
                const isBgWithLimit = guarantee.code === 'BG' && localGuarantees.includes(guarantee.id) && localBgLimit;
                const isAssuranceConducteur = guarantee.code === 'ASSURANCE_CONDUCTEUR';
                const hasAllACCapitals = isAssuranceConducteur && selectedCompanies.every(cid => localAssuranceConducteurCapitals[cid] !== undefined && localAssuranceConducteurCapitals[cid] > 0);

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
                          <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">
                            {localBgLimit.toLocaleString('fr-FR')} DT
                          </span>
                        )}
                        {isAssuranceConducteur && hasAllACCapitals && (
                          <span className="ml-2 text-sm font-normal text-blue-600 dark:text-blue-400">
                            {selectedCompanies.map(cid => {
                              const company = companies?.find((c: any) => c.id === cid);
                              const capital = localAssuranceConducteurCapitals[cid];
                              return company && capital ? `${company.name}: ${capital.toLocaleString('fr-FR')} DT` : null;
                            }).filter(Boolean).join(' | ')}
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

                if (!filteredTiers || filteredTiers.length === 0) {
                  return (
                    <option value="" disabled>
                      Aucun palier configuré
                    </option>
                  );
                }

                // Generate all options from tiers (handles overlapping boundaries)
                let allOptions = generateAllDcOptions(filteredTiers);
                
                // Apply DC Config limits: maxCapitalPercent and plafondAbsolu
                if (dcConfig && marketValue) {
                  const maxCapitalPercent = Number(dcConfig.maxCapitalPercent || 100);
                  const plafondAbsolu = Number(dcConfig.maxCapitalAbsolute || Infinity);
                  const effectiveCeiling = Math.min(
                    marketValue * (maxCapitalPercent / 100),
                    plafondAbsolu
                  );
                  
                  allOptions = allOptions.filter(opt => opt.value <= effectiveCeiling);
                }
                
                if (allOptions.length === 0) {
                  return (
                    <option value="" disabled>
                      Aucune option disponible pour ce véhicule
                    </option>
                  );
                }

                return allOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ));
              })()}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Sélectionnez le capital assuré pour cette compagnie
            </p>
            {(() => {
              // Calculate effective ceiling from DC Config
              let effectiveCeiling = marketValue ? marketValue * 0.8 : 0;
              
              if (dcConfig && marketValue) {
                const maxCapitalPercent = Number(dcConfig.maxCapitalPercent || 100);
                const plafondAbsolu = Number(dcConfig.maxCapitalAbsolute || Infinity);
                effectiveCeiling = Math.min(
                  marketValue * (maxCapitalPercent / 100),
                  plafondAbsolu
                );
              }
              
              if (tempDcCapital > effectiveCeiling && marketValue && marketValue > 0) {
                const maxCapitalPercent = dcConfig ? Number(dcConfig.maxCapitalPercent || 80) : 80;
                return (
                  <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                    <p className="text-xs text-yellow-800 dark:text-yellow-200">
                      ⚠️ <strong>Attention:</strong> Le capital sélectionné ({tempDcCapital.toLocaleString('fr-FR')} DT) dépasse {maxCapitalPercent}% de la valeur vénale ({effectiveCeiling.toFixed(0)} DT max). Cela pourrait être rejeté lors de la génération du devis.
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
                {bgCapitalLimits && bgCapitalLimits.length > 0 ? (
                  bgCapitalLimits
                    .filter(limit => limit.isActive)
                    .map(limit => (
                      <option key={limit.id} value={limit.value.toString()}>
                        {limit.label || `${limit.value.toLocaleString('fr-FR')} DT`}
                      </option>
                    ))
                ) : (
                  <option value="" disabled>
                    Aucune limite configurée
                  </option>
                )}
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

      {/* Assurance Conducteur Capital Modal */}
      {showAssuranceConducteurModal && assuranceConducteurModalCompanyId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Configuration Assurance Conducteur
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {companies?.find((c: any) => c.id === assuranceConducteurModalCompanyId)?.name}
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Capital assuré (DT)
              </label>
              {isLoadingAssuranceConducteurCapitals ? (
                <div className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center justify-center">
                  <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Chargement...</span>
                </div>
              ) : (
                <select
                  value={tempAssuranceConducteurCapital.toString()}
                  onChange={(e) => setTempAssuranceConducteurCapital(Number(e.target.value))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  {(assuranceConducteurCapitals as any) && (assuranceConducteurCapitals as any).length > 0 ? (
                    (assuranceConducteurCapitals as any).map((capital: any) => (
                      <option key={capital.value} value={capital.value.toString()}>
                        {capital.label}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>
                      Aucun capital configuré
                    </option>
                  )}
                </select>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Ce capital détermine le montant maximum de couverture pour le conducteur
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => {
                  setShowAssuranceConducteurModal(false);
                  setAssuranceConducteurModalCompanyId(null);
                }}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={confirmAssuranceConducteurCapital}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Franchise Modal */}
      {showFranchiseModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Sélection de la Franchise
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Choisissez le taux de franchise pour la garantie Tous Risques
            </p>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Taux de franchise
              </label>
              <select
                value={tempFranchiseRate.toString()}
                onChange={(e) => setTempFranchiseRate(Number(e.target.value))}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
              >
                {franchiseValues && franchiseValues.length > 0 ? (
                  franchiseValues
                    .filter(fv => fv.isActive)
                    .map(fv => (
                      <option key={fv.id} value={fv.value.toString()}>
                        {fv.value === 0 ? 'Sans franchise (0%)' : `${fv.value}%`}
                      </option>
                    ))
                ) : (
                  <option value="" disabled>
                    Aucune franchise configurée
                  </option>
                )}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                La franchise est le pourcentage des dommages qui reste à votre charge
              </p>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowFranchiseModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={() => {
                  setLocalFranchiseRate(tempFranchiseRate);
                  onUpdate({
                    formulaType: FormulaType.TOUS_RISQUES_0,
                    selectedGuarantees: localGuarantees,
                    conventionId: localConvention || undefined,
                    franchiseRate: tempFranchiseRate,
                    bgLimit: localBgLimit,
                    dcCapitals: localDcCapitals,
                    acCapitals: localAssuranceConducteurCapitals,
                    fractionnement: localFractionnement,
                    companyIds: selectedCompanies,
                  });
                  setShowFranchiseModal(false);
                }}
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
