import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import { User } from 'lucide-react';

const driverSchema = z.object({
  bonusMalus: z.coerce.number().min(0.5, 'Minimum 0.5').max(3.5, 'Maximum 3.5'),
  usage: z.string().min(1, 'Usage requis'),
});

type DriverForm = z.infer<typeof driverSchema>;

interface DriverProfileStepProps {
  data?: { bonusMalus?: number; usage?: string };
  onUpdate: (data: { bonusMalus: number; usage: string }) => void;
  onNext: () => void;
  onBack: () => void;
}

export const DriverProfileStep = ({ data, onUpdate, onNext }: DriverProfileStepProps) => {
  const { register, handleSubmit, formState: { errors, isValid }, watch } = useForm({
    resolver: zodResolver(driverSchema) as any,
    defaultValues: data,
    mode: 'onChange',
  });

  const formData = watch();

  useEffect(() => {
    if (isValid && formData.bonusMalus && formData.usage) {
      onUpdate(formData as { bonusMalus: number; usage: string });
    }
  }, [formData, isValid, onUpdate]);

  const onSubmit = (formData: any) => {
    onUpdate(formData as DriverForm);
    onNext();
  };

  const bonusMalus = watch('bonusMalus');

  const getReduction = (bonus: number) => {
    if (bonus < 1) return Math.round((1 - bonus) * 100);
    return 0;
  };

  const getMajoration = (malus: number) => {
    if (malus > 1) return Math.round((malus - 1) * 100);
    return 0;
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
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
          <Input
            label="Coefficient Bonus/Malus"
            type="number"
            step="0.01"
            placeholder="Ex: 0.5 à 3.5"
            {...register('bonusMalus')}
            error={errors.bonusMalus?.message}
            required
          />
          {bonusMalus && (
            <div className="mt-2">
              {bonusMalus < 1 && (
                <p className="text-sm text-green-600 dark:text-green-400">
                  ✓ Bonus de {getReduction(bonusMalus)}% (réduction)
                </p>
              )}
              {bonusMalus === 1 && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  = Coefficient neutre
                </p>
              )}
              {bonusMalus > 1 && (
                <p className="text-sm text-orange-600 dark:text-orange-400">
                  ⚠ Malus de {getMajoration(bonusMalus)}% (majoration)
                </p>
              )}
            </div>
          )}
        </div>

        <Select
          label="Type d'usage"
          {...register('usage')}
          error={errors.usage?.message}
          required
          options={[
            { value: '', label: 'Sélectionner un usage' },
            { value: 'PRIVATE_BUSINESS', label: 'Privé et Affaires' },
          ]}
        />
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          📋 Coefficient Bonus/Malus
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• <strong>0.5</strong> : Bonus maximal (50% de réduction)</li>
          <li>• <strong>1.0</strong> : Coefficient neutre (aucun sinistre)</li>
          <li>• <strong>&gt; 1.0</strong> : Malus (majoration selon sinistres)</li>
          <li>• <strong>3.5</strong> : Malus maximal</li>
        </ul>
      </div>
    </form>
  );
};
