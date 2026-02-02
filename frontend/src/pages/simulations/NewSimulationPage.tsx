import { useState } from 'react';
import { VehicleInfoStep } from '../../components/simulations/VehicleInfoStep';
import { DriverProfileStep } from '../../components/simulations/DriverProfileStep';
import { CoverageSelectionStep } from '../../components/simulations/CoverageSelectionStep';
import { QuoteGenerationStep } from '../../components/simulations/QuoteGenerationStep';
import { ConfirmationStep } from '../../components/simulations/ConfirmationStep';
import { Button } from '../../components/ui/Button';
import { useLanguage } from '../../contexts/LanguageContext';
import type { FormulaType, UsageType } from '../../types';

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
  usage: UsageType;
  formulaType: FormulaType;
  conventionId?: string;
  selectedGuarantees: string[];
  franchiseRate?: number;
  bgLimit?: number;
  dcCapital?: number;
};

export const NewSimulationPage = () => {
  const { t } = useLanguage();
  
  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem('simulationStep');
    return saved ? parseInt(saved) : 1;
  });
  
  const [simulationData, setSimulationData] = useState<Partial<SimulationData>>(() => {
    const saved = localStorage.getItem('simulationData');
    return saved ? JSON.parse(saved) : { selectedGuarantees: [] };
  });
  
  const [simulationId, setSimulationId] = useState<string | null>(() => {
    return localStorage.getItem('simulationId');
  });

  const STEPS = [
    { id: 1, name: t('simulation.vehicle') },
    { id: 2, name: t('simulation.driver') },
    { id: 3, name: t('simulation.coverage') },
    { id: 4, name: t('simulation.quote') },
    { id: 5, name: t('simulation.confirmation') },
  ];

  const updateData = (data: Partial<SimulationData>) => {
    const updated = { ...simulationData, ...data };
    setSimulationData(updated);
    localStorage.setItem('simulationData', JSON.stringify(updated));
  };

  const clearSimulation = () => {
    localStorage.removeItem('simulationStep');
    localStorage.removeItem('simulationData');
    localStorage.removeItem('simulationId');
    setCurrentStep(1);
    setSimulationData({ selectedGuarantees: [] });
    setSimulationId(null);
  };

  const canShowStep2 = () => {
    return simulationData.vehicle?.fiscalHorsepower && 
           simulationData.vehicle?.numberOfSeats &&
           simulationData.vehicle?.newValue &&
           simulationData.vehicle?.marketValue &&
           simulationData.vehicle?.firstCirculationDate;
  };

  const canShowStep3 = () => {
    return canShowStep2() && simulationData.bonusMalus && simulationData.usage;
  };

  const canShowStep4 = () => {
    return canShowStep3() && simulationData.formulaType;
  };

  const canShowStep5 = () => {
    return canShowStep4() && simulationId;
  };

  return (
    <div className="max-w-5xl mx-auto">
        {/* Progress Steps */}
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

        {/* All Steps Vertically */}
        <div className="space-y-6">
          {/* Step 1: Vehicle Info */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
            <VehicleInfoStep
              data={simulationData.vehicle}
              onUpdate={(vehicle) => updateData({ vehicle })}
              onNext={() => setCurrentStep(2)}
            />
          </div>

          {/* Step 2: Driver Profile */}
          {canShowStep2() && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
              <DriverProfileStep
                data={{ bonusMalus: simulationData.bonusMalus, usage: simulationData.usage }}
                onUpdate={(data) => updateData({ bonusMalus: data.bonusMalus, usage: data.usage as UsageType })}
                onNext={() => setCurrentStep(3)}
                onBack={() => setCurrentStep(1)}
              />
            </div>
          )}

          {/* Step 3: Coverage Selection */}
          {canShowStep3() && simulationData.vehicle?.firstCirculationDate && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
              <CoverageSelectionStep
                vehicleAge={Math.floor((new Date().getTime() - new Date(simulationData.vehicle.firstCirculationDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))}
                formulaType={simulationData.formulaType}
                selectedGuarantees={simulationData.selectedGuarantees || []}
                conventionId={simulationData.conventionId}
                franchiseRate={simulationData.franchiseRate}
                bgLimit={simulationData.bgLimit}
                dcCapital={simulationData.dcCapital}
                firstCirculationDate={new Date(simulationData.vehicle.firstCirculationDate)}
                onUpdate={(data) => updateData(data)}
                onNext={() => setCurrentStep(4)}
                onBack={() => setCurrentStep(2)}
              />
            </div>
          )}

          {/* Step 4: Quote Generation */}
          {canShowStep4() && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
              <QuoteGenerationStep
                simulationData={simulationData as SimulationData}
                onSimulationCreated={(id) => {
                  setSimulationId(id);
                  setCurrentStep(5);
                }}
                onBack={() => setCurrentStep(3)}
              />
            </div>
          )}

          {/* Step 5: Confirmation */}
          {canShowStep5() && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6">
              <ConfirmationStep
                simulationId={simulationId!}
                onBack={() => setCurrentStep(4)}
              />
            </div>
          )}
        </div>

        {/* Blue Nouvelle Simulation Button - Always visible at bottom */}
        <div className="mt-6 flex justify-center">
          <Button
            onClick={clearSimulation}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Nouvelle simulation
          </Button>
        </div>
    </div>
  );
};
