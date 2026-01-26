import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useEffect } from 'react';
import { Select } from '../ui/Select';
import { User } from 'lucide-react';

const driverSchema = z.object({
  // CDC: Bonus/Malus class 1..8
  bonusMalus: z.coerce.number().int().min(1, 'Classe minimale 1').max(8, 'Classe maximale 8'),
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
          {...register('usage')}
          error={errors.usage?.message}
          required
          options={[
            { value: '', label: 'Sélectionner un usage' },
            { value: 'PRIVATE_BUSINESS', label: 'Promenade et Affaires' },
            { value: 'COMMERCIAL', label: 'Affaire' },
          ]}
        />
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          📋 Classe Bonus/Malus
        </h3>
        <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
          <li>• Classes <strong>1 à 8</strong> conformes au tableau RC</li>
          <li>• La classe sélectionnée sera appliquée au tableau RC côté serveur</li>
        </ul>
      </div>
    </form>
  );
};
