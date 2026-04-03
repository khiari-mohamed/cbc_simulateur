import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { Car, User } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import type { VehicleData } from '../../pages/simulations/NewSimulationPage';
import api from '../../lib/api/client';

const combinedSchema = z.object({
  registration: z.string().optional(),
  fiscalHorsepower: z.coerce.number().int().min(1, 'Minimum 1 CV').max(50, 'Maximum 50 CV'),
  numberOfSeats: z.coerce.number().int().min(2, 'Minimum 2 places').max(50, 'Maximum 50 places'),
  newValue: z.coerce.number().min(0, 'Valeur requise'),
  marketValue: z.coerce.number().min(0, 'Valeur requise'),
  firstCirculationDate: z.string().min(1, 'Date requise'),
  bonusMalus: z.coerce.number().int().min(1, 'Classe minimale 1').max(8, 'Classe maximale 8'),
  usageId: z.string().min(1, 'Usage requis'),
}).refine(data => data.newValue >= data.marketValue, {
  message: 'La valeur à neuf doit être supérieure ou égale à la valeur vénale',
  path: ['newValue'],
}).refine(data => new Date(data.firstCirculationDate) <= new Date(), {
  message: 'La date ne peut pas être dans le futur',
  path: ['firstCirculationDate'],
});

interface VehicleInfoStepProps {
  data?: VehicleData;
  driverData?: { bonusMalus?: number; usageId?: string };
  onUpdate: (data: VehicleData, driverData: { bonusMalus: number; usageId: string }) => void;
  onNext: () => void;
}

export const VehicleInfoStep = ({ data, driverData, onUpdate, onNext }: VehicleInfoStepProps) => {
  const { t } = useLanguage();
  const { data: usageTypes } = useQuery({
    queryKey: ['public-usage-types-for-simulation'],
    queryFn: async () => {
      const { data } = await api.get('/usage-types');
      return data as Array<{ id: string; code: string; nameFr: string; isActive: boolean }>;
    },
  });

  const usageOptions = [
    { value: '', label: 'Sélectionner un usage' },
    ...((usageTypes ?? [])
      .filter((usage) => usage.isActive)
      .map((usage) => ({
        value: usage.id,
        label: usage.nameFr,
      }))),
  ];

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: zodResolver(combinedSchema) as any,
    defaultValues: { ...data, ...driverData },
    mode: 'onChange',
  });

  const watchedData = watch();

  useEffect(() => {
    const { bonusMalus, usageId, ...vehicleData } = watchedData;
    if (vehicleData.firstCirculationDate && vehicleData.fiscalHorsepower && vehicleData.numberOfSeats && vehicleData.newValue && vehicleData.marketValue && bonusMalus && usageId) {
      onUpdate(vehicleData as VehicleData, { bonusMalus: Number(bonusMalus), usageId });
    }
  }, [watchedData.firstCirculationDate]);

  const onSubmit = (formData: any) => {
    const { bonusMalus, usageId, ...vehicleData } = formData;
    onUpdate(vehicleData as VehicleData, { bonusMalus, usageId });
    onNext();
  };

  const newValue = watch('newValue');
  const marketValue = watch('marketValue');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Vehicle Section */}
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

      {/* Driver Section */}
      <div className="flex items-center gap-3 mb-6 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
          <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Profil du conducteur
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Informations sur l'utilisation et le bonus/malus
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Select
            label="Classe Bonus/Malus"
            {...register('bonusMalus')}
            error={errors.bonusMalus?.message}
            required
            options={[
              { value: '', label: 'Sélectionner une classe (1 à 8)' },
              { value: '1', label: 'Classe 1' },
              { value: '2', label: 'Classe 2' },
              { value: '3', label: 'Classe 3' },
              { value: '4', label: 'Classe 4' },
              { value: '5', label: 'Classe 5' },
              { value: '6', label: 'Classe 6' },
              { value: '7', label: 'Classe 7' },
              { value: '8', label: 'Classe 8' },
            ]}
          />
        </div>

        <Select
          label="Type d'usage"
          {...register('usageId')}
          error={errors.usageId?.message}
          required
          options={usageOptions}
        />
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
