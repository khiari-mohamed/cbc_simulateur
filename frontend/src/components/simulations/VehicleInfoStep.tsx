import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from '../ui/Input';
import { Car } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { VehicleData } from '../../pages/simulations/NewSimulationPage';

const vehicleSchema = z.object({
  registration: z.string().optional(),
  fiscalHorsepower: z.coerce.number().int().min(1, 'Minimum 1 CV').max(50, 'Maximum 50 CV'),
  numberOfSeats: z.coerce.number().int().min(2, 'Minimum 2 places').max(50, 'Maximum 50 places'),
  newValue: z.coerce.number().min(0, 'Valeur requise'),
  marketValue: z.coerce.number().min(0, 'Valeur requise'),
  firstCirculationDate: z.string().min(1, 'Date requise'),
}).refine(data => data.newValue >= data.marketValue, {
  message: 'La valeur à neuf doit être supérieure ou égale à la valeur vénale',
  path: ['newValue'],
}).refine(data => new Date(data.firstCirculationDate) <= new Date(), {
  message: 'La date ne peut pas être dans le futur',
  path: ['firstCirculationDate'],
});

interface VehicleInfoStepProps {
  data?: VehicleData;
  onUpdate: (data: VehicleData) => void;
  onNext: () => void;
}

export const VehicleInfoStep = ({ data, onUpdate, onNext }: VehicleInfoStepProps) => {
  const { t } = useLanguage();
  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(vehicleSchema) as any,
    defaultValues: data,
    mode: 'onChange',
  });

  const onSubmit = (formData: any) => {
    onUpdate(formData as VehicleData);
    onNext();
  };

  const newValue = watch('newValue');
  const marketValue = watch('marketValue');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <Car className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('vehicle.title')}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t('vehicle.subtitle')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('vehicle.registration')}
          placeholder={t('vehicle.registrationPlaceholder')}
          {...register('registration')}
          error={errors.registration?.message}
        />

        <Input
          label={t('vehicle.fiscalHorsepower')}
          type="number"
          placeholder={t('vehicle.horsepowerPlaceholder')}
          {...register('fiscalHorsepower')}
          error={errors.fiscalHorsepower?.message}
          required
        />

        <Input
          label={t('vehicle.numberOfSeats')}
          type="number"
          placeholder={t('vehicle.seatsPlaceholder')}
          {...register('numberOfSeats')}
          error={errors.numberOfSeats?.message}
          required
        />

        <Input
          label={t('vehicle.firstCirculationDate')}
          type="date"
          max={new Date().toISOString().split('T')[0]}
          {...register('firstCirculationDate')}
          error={errors.firstCirculationDate?.message}
          required
        />

        <Input
          label={t('vehicle.newValue')}
          type="number"
          step="0.01"
          placeholder={t('vehicle.newValuePlaceholder')}
          {...register('newValue')}
          error={errors.newValue?.message}
          required
        />

        <Input
          label={t('vehicle.marketValue')}
          type="number"
          step="0.01"
          placeholder={t('vehicle.marketValuePlaceholder')}
          {...register('marketValue')}
          error={errors.marketValue?.message}
          required
        />
      </div>

      {newValue && marketValue && newValue < marketValue && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-sm text-red-800 dark:text-red-200">
            ⚠️ La valeur à neuf doit être supérieure ou égale à la valeur vénale
          </p>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 {t('vehicle.tip')}
        </p>
      </div>

      <button
        type="submit"
        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Continuer
      </button>
    </form>
  );
};
