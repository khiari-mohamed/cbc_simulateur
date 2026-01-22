import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Shield, AlertTriangle } from 'lucide-react';
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
  onUpdate: (data: { 
    formulaType: FormulaType; 
    selectedGuarantees: string[]; 
    conventionId?: string;
    franchiseRate?: number;
    bgLimit?: number;
    dcCapital?: number;
  }) => void;
  onNext: () => void;
  onBack: () => void;
}

export const CoverageSelectionStep = ({
  vehicleAge,
  formulaType,
  selectedGuarantees,
  conventionId,
  franchiseRate,
  bgLimit,
  dcCapital,
  onUpdate,
  onNext,
  onBack,
}: CoverageSelectionStepProps) => {
  const [localFormula, setLocalFormula] = useState<FormulaType | ''>(formulaType || '');
  const [localGuarantees, setLocalGuarantees] = useState<string[]>(selectedGuarantees);
  const [localConvention, setLocalConvention] = useState<string>(conventionId || '');
  const [localFranchiseRate, setLocalFranchiseRate] = useState<number>(franchiseRate || 0);
  const [localBgLimit, setLocalBgLimit] = useState<number>(bgLimit || 1000);
  const [localDcCapital, setLocalDcCapital] = useState<number>(dcCapital || 1000);

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

  const optionalGuarantees = guarantees?.filter(g => g.isOptional && g.isActive) || [];

  // Age restrictions removed - not required per specifications
  const canSelectTousRisques = true;
  const canSelectDommagesCollision = true;

  useEffect(() => {
    if (localFormula === FormulaType.TOUS_RISQUES_0) {
      const brisDeGlaces = optionalGuarantees.find(g => g.code === 'BG');
      if (brisDeGlaces && !localGuarantees.includes(brisDeGlaces.id)) {
        setLocalGuarantees([...localGuarantees, brisDeGlaces.id]);
      }
    }
  }, [localFormula, optionalGuarantees]);

  const handleFormulaChange = (formula: string) => {
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
      });
      onNext();
    }
  };

  const isBrisDeGlacesFree = localFormula === FormulaType.TOUS_RISQUES_0;
  const brisDeGlaces = optionalGuarantees.find(g => g.code === 'BG');

  return (
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
                Couverture des dommages en cas de collision
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
                Tous Risques 0%
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

      {localFormula && localFormula !== FormulaType.STANDARD && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex gap-2">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Incompatibilité :</strong> Les formules Dommages Collision et Tous Risques ne peuvent pas être combinées.
            </p>
          </div>
        </div>
      )}

      {localFormula === FormulaType.TOUS_RISQUES_0 && (
        <div className="space-y-4">
          <Select
            label="Taux de franchise"
            value={localFranchiseRate.toString()}
            onChange={(e) => {
              const rate = Number(e.target.value);
              setLocalFranchiseRate(rate);
              onUpdate({
                formulaType: localFormula,
                selectedGuarantees: localGuarantees,
                conventionId: localConvention || undefined,
                franchiseRate: rate,
                bgLimit: localBgLimit,
                dcCapital: localDcCapital,
              });
            }}
            options={[
              { value: '0', label: '0% (Bris de Glaces gratuit et sans limite)' },
              { value: '1', label: '1%' },
              { value: '2', label: '2%' },
              { value: '4', label: '4%' },
            ]}
          />
          {localFranchiseRate > 0 && (
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
              options={[
                { value: '500', label: '500 DT' },
                { value: '1000', label: '1 000 DT' },
                { value: '1500', label: '1 500 DT' },
                { value: '2000', label: '2 000 DT' },
                { value: '2500', label: '2 500 DT' },
                { value: '3000', label: '3 000 DT' },
              ]}
            />
          )}
        </div>
      )}

      {localFormula === FormulaType.DOMMAGES_COLLISIONS && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Capital assuré (DT)
            </label>
            <input
              type="number"
              min="1000"
              step="1000"
              value={localDcCapital}
              onChange={(e) => {
                const capital = Number(e.target.value);
                setLocalDcCapital(capital);
                onUpdate({
                  formulaType: localFormula,
                  selectedGuarantees: localGuarantees,
                  conventionId: localConvention || undefined,
                  franchiseRate: localFranchiseRate,
                  bgLimit: localBgLimit,
                  dcCapital: capital,
                });
              }}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-white"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tranches: 1000 DT (1K-10K), 5000 DT (10K-20K), 10000 DT (20K-50K), 25000 DT (50K-100K)
            </p>
          </div>
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
            options={[
              { value: '500', label: '500 DT' },
              { value: '1000', label: '1 000 DT' },
              { value: '1500', label: '1 500 DT' },
              { value: '2000', label: '2 000 DT' },
              { value: '2500', label: '2 500 DT' },
              { value: '3000', label: '3 000 DT' },
            ]}
          />
        </div>
      )}

      {localFormula === FormulaType.STANDARD && (
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
          options={[
            { value: '500', label: '500 DT' },
            { value: '1000', label: '1 000 DT' },
            { value: '1500', label: '1 500 DT' },
            { value: '2000', label: '2 000 DT' },
            { value: '2500', label: '2 500 DT' },
            { value: '3000', label: '3 000 DT' },
          ]}
        />
      )}

      {optionalGuarantees.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Garanties optionnelles
          </label>
          <div className="space-y-2">
            {optionalGuarantees.map((guarantee) => {
              const isDisabled = 
                (guarantee.code === 'BG' && isBrisDeGlacesFree) ||
                (localFormula === FormulaType.STANDARD && 
                  (guarantee.code === 'TOUS_RISQUES' || guarantee.code === 'DOMMAGES_COLLISION'));

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
          </div>
        </div>
      )}
    </form>
  );
};
