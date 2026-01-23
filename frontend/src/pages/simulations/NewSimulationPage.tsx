import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { VehicleInfoStep } from '../../components/simulations/VehicleInfoStep';
import { DriverProfileStep } from '../../components/simulations/DriverProfileStep';
import { CoverageSelectionStep } from '../../components/simulations/CoverageSelectionStep';
import { QuoteGenerationStep } from '../../components/simulations/QuoteGenerationStep';
import { ConfirmationStep } from '../../components/simulations/ConfirmationStep';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
  const navigate = useNavigate();
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

  const nextStep = () => {
    if (currentStep < 5) {
      const next = currentStep + 1;
      setCurrentStep(next);
      localStorage.setItem('simulationStep', next.toString());
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      localStorage.setItem('simulationStep', prev.toString());
    }
  };

  const clearSimulation = () => {
    localStorage.removeItem('simulationStep');
    localStorage.removeItem('simulationData');
    localStorage.removeItem('simulationId');
    setCurrentStep(1);
    setSimulationData({ selectedGuarantees: [] });
    setSimulationId(null);
  };

  const canGoNext = () => {
    switch (currentStep) {
      case 1:
        return simulationData.vehicle?.fiscalHorsepower && 
               simulationData.vehicle?.numberOfSeats &&
               simulationData.vehicle?.newValue &&
               simulationData.vehicle?.marketValue &&
               simulationData.vehicle?.firstCirculationDate;
      case 2:
        return simulationData.bonusMalus && simulationData.usage;
      case 3:
        return simulationData.formulaType;
      case 4:
        return simulationId;
      default:
        return true;
    }
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
                      currentStep === step.id
                        ? 'bg-blue-600 text-white'
                        : currentStep > step.id
                        ? 'bg-green-500 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-500'
                    }`}
                  >
                    {currentStep > step.id ? '✓' : step.id}
                  </div>
                  <span className="text-xs mt-2 font-medium text-gray-700 dark:text-gray-300 hidden sm:block">
                    {step.name}
                  </span>
                </div>
                {index < STEPS.length - 1 && (
                  <div
                    className={`h-1 flex-1 mx-2 transition-colors ${
                      currentStep > step.id ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 sm:p-6 mb-6">
          {currentStep === 1 && (
            <VehicleInfoStep
              data={simulationData.vehicle}
              onUpdate={(vehicle) => updateData({ vehicle })}
              onNext={nextStep}
            />
          )}
          {currentStep === 2 && (
            <DriverProfileStep
              data={{ bonusMalus: simulationData.bonusMalus, usage: simulationData.usage }}
              onUpdate={(data) => updateData({ bonusMalus: data.bonusMalus, usage: data.usage as UsageType })}
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 3 && simulationData.vehicle?.firstCirculationDate && (
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
              onNext={nextStep}
              onBack={prevStep}
            />
          )}
          {currentStep === 4 && (
            <QuoteGenerationStep
              simulationData={simulationData as SimulationData}
              onSimulationCreated={(id) => {
                setSimulationId(id);
                nextStep();
              }}
              onBack={prevStep}
            />
          )}
          {currentStep === 5 && simulationId && (
            <ConfirmationStep
              simulationId={simulationId}
              onBack={prevStep}
            />
          )}
        </div>

        {/* Navigation Buttons */}
        {currentStep !== 4 && currentStep !== 5 && (
          <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-0">
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={currentStep === 1 ? () => navigate('/dashboard') : prevStep}
                className="flex items-center gap-2 w-full sm:w-auto"
              >
                <ChevronLeft className="w-4 h-4" />
                {currentStep === 1 ? t('common.cancel') : t('common.previous')}
              </Button>
              {currentStep === 1 && simulationData.vehicle && (
                <Button
                  variant="outline"
                  onClick={clearSimulation}
                  className="text-red-600 hover:text-red-700"
                >
                  Nouvelle simulation
                </Button>
              )}
            </div>
            <Button
              onClick={nextStep}
              disabled={!canGoNext()}
              className="flex items-center gap-2 w-full sm:w-auto"
            >
              {t('common.next')}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
    </div>
  );
};
