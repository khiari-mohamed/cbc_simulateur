import { useState, useEffect } from 'react';
import { VehicleInfoStep } from '../../components/simulations/VehicleInfoStep';
import { CoverageSelectionStep } from '../../components/simulations/CoverageSelectionStep';
import { QuoteGenerationStep } from '../../components/simulations/QuoteGenerationStep';
import { ConfirmationStep } from '../../components/simulations/ConfirmationStep';
import { useLanguage } from '../../contexts/LanguageContext';
import type { FormulaType, FractionnementType } from '../../types';

export type VehicleData = {
  registration?: string;
  fiscalHorsepower: number;
  numberOfSeats: number;
  newValue: number;
  marketValue: number;
  firstCirculationDate: string;
};

export type SimulationData = {
  vehicle: VehicleData;
  bonusMalus: number;
  usageId: string;
  formulaType: FormulaType;
  fractionnement?: FractionnementType;
  conventionId?: string;
  selectedGuarantees: string[];
  franchiseRate?: number;
  bgLimit?: number;
  dcCapitals?: Record<string, number>;
  companyIds?: string[];
};

export const NewSimulationPage = () => {
  const { t } = useLanguage();

  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('simulationStep');
    return saved ? parseInt(saved, 10) : 1;
  });

  const [simulationData, setSimulationData] = useState<Partial<SimulationData>>(() => {
    const saved = localStorage.getItem('simulationData');

    if (!saved) {
      return { selectedGuarantees: [], fractionnement: 'ANNUEL', dcCapitals: {} };
    }

    const parsed = JSON.parse(saved);
    return {
      ...parsed,
      usageId: parsed.usageId ?? parsed.usage,
      dcCapitals: parsed.dcCapitals || {},
    };
  });

  const [simulationId, setSimulationId] = useState<string | null>(() => {
    return localStorage.getItem('simulationId');
  });

  const STEPS = [
    { id: 1, name: t('simulation.vehicle') },
    { id: 2, name: t('simulation.coverage') },
    { id: 3, name: t('simulation.quote') },
    { id: 4, name: t('simulation.confirmation') },
  ];

  const updateData = (data: Partial<SimulationData>) => {
    const updated = { ...simulationData, ...data };
    setSimulationData(updated);
    localStorage.setItem('simulationData', JSON.stringify(updated));
  };

  const goToStep = (step: number) => {
    setCurrentStep(step);
    localStorage.setItem('simulationStep', String(step));
  };

  useEffect(() => {
    if (simulationData.vehicle?.firstCirculationDate && simulationData.formulaType) {
      const vehicleAge = Math.floor(
        (new Date().getTime() - new Date(simulationData.vehicle.firstCirculationDate).getTime()) /
          (365.25 * 24 * 60 * 60 * 1000),
      );
      const isTousRisques = simulationData.formulaType.startsWith('TOUS_RISQUES');
      const isDommagesCollision = simulationData.formulaType === 'DOMMAGES_COLLISIONS';

      if ((isTousRisques && vehicleAge >= 2) || (isDommagesCollision && vehicleAge >= 10)) {
        updateData({ formulaType: undefined, franchiseRate: undefined, dcCapitals: {} });
      }
    }
  }, [simulationData.vehicle?.firstCirculationDate]);

  const canShowStep2 = () => {
    return (
      simulationData.vehicle?.fiscalHorsepower &&
      simulationData.vehicle?.numberOfSeats &&
      simulationData.vehicle?.newValue &&
      simulationData.vehicle?.marketValue &&
      simulationData.vehicle?.firstCirculationDate &&
      simulationData.bonusMalus &&
      simulationData.usageId
    );
  };

  const canShowStep3 = () => {
    return canShowStep2() && simulationData.formulaType;
  };

  const canShowStep4 = () => {
    return canShowStep3() && simulationId;
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between">
          {STEPS.map((step, index) => (
            <div key={step.id} className="flex items-center flex-1">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center text-sm sm:text-base font-semibold transition-colors ${
                    currentStep >= step.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                  }`}
                >
                  {step.id}
                </div>
                <span className="text-xs mt-2 font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                  {step.name}
                </span>
              </div>
              {index < STEPS.length - 1 && (
                <div
                  className={`h-1 flex-1 mx-2 transition-colors ${
                    currentStep > step.id ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-700'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-6">
        {currentStep >= 1 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
            <VehicleInfoStep
              data={simulationData.vehicle}
              driverData={{ bonusMalus: simulationData.bonusMalus, usageId: simulationData.usageId }}
              onUpdate={(vehicle, driverData) =>
                updateData({
                  vehicle,
                  bonusMalus: driverData.bonusMalus,
                  usageId: driverData.usageId,
                })
              }
              onNext={() => goToStep(2)}
            />
          </div>
        )}

        {currentStep >= 2 && canShowStep2() && simulationData.vehicle?.firstCirculationDate && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
            <CoverageSelectionStep
              vehicleAge={Math.floor(
                (new Date().getTime() - new Date(simulationData.vehicle.firstCirculationDate).getTime()) /
                  (365.25 * 24 * 60 * 60 * 1000),
              )}
              formulaType={simulationData.formulaType}
              selectedGuarantees={simulationData.selectedGuarantees || []}
              conventionId={simulationData.conventionId}
              franchiseRate={simulationData.franchiseRate}
              bgLimit={simulationData.bgLimit}
              dcCapitals={simulationData.dcCapitals}
              fractionnement={simulationData.fractionnement}
              firstCirculationDate={new Date(simulationData.vehicle.firstCirculationDate)}
              usageId={simulationData.usageId}
              companyIds={simulationData.companyIds}
              onUpdate={(data) => updateData(data)}
              onNext={() => goToStep(3)}
              onBack={() => goToStep(1)}
            />
          </div>
        )}

        {currentStep >= 3 && canShowStep3() && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
            <QuoteGenerationStep
              simulationData={simulationData as SimulationData}
              onSimulationCreated={(id) => {
                setSimulationId(id);
                localStorage.setItem('simulationId', id);
                goToStep(4);
              }}
              onBack={() => {
                setSimulationId(null);
                localStorage.removeItem('simulationId');
                goToStep(2);
              }}
            />
          </div>
        )}

        {currentStep >= 4 && canShowStep4() && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
            <ConfirmationStep
              simulationId={simulationId!}
              onBack={() => goToStep(3)}
            />
          </div>
        )}
      </div>
    </div>
  );
};
