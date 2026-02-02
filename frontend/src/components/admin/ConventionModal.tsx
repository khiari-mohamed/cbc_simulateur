import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, DollarSign, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';
import type { Convention, Company } from '../../types';

const conventionSchema = z.object({
  name: z.string().min(2, 'Nom minimum 2 caractères').max(100),
  companyId: z.string().min(1, 'Compagnie requise'),
  reductionTousRisques: z.number().min(0, 'Minimum 0').max(1, 'Maximum 1').optional(),
  reductionDommagesCollision: z.number().min(0, 'Minimum 0').max(1, 'Maximum 1').optional(),
  reductionVol: z.number().min(0, 'Minimum 0').max(1, 'Maximum 1').optional(),
  reductionIncendie: z.number().min(0, 'Minimum 0').max(1, 'Maximum 1').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  status: z.string().optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.endDate) >= new Date(data.startDate);
  }
  return true;
}, {
  message: 'La date de fin doit être après la date de début',
  path: ['endDate'],
});

type ConventionForm = z.infer<typeof conventionSchema>;

interface ConventionModalProps {
  isOpen: boolean;
  onClose: () => void;
  convention: Convention | null;
}

export const ConventionModal = ({ isOpen, onClose, convention }: ConventionModalProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ConventionForm>({
    resolver: zodResolver(conventionSchema) as any,
  });

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data } = await api.get('/companies');
      return data as Company[];
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (convention) {
      reset({ 
        name: convention.name, 
        companyId: convention.company.id,
        reductionTousRisques: convention.reductionTousRisques || 1.0,
        reductionDommagesCollision: convention.reductionDommagesCollision || 1.0,
        reductionVol: convention.reductionVol || 1.0,
        reductionIncendie: convention.reductionIncendie || 1.0,
        startDate: convention.startDate ? new Date(convention.startDate).toISOString().split('T')[0] : '',
        endDate: convention.endDate ? new Date(convention.endDate).toISOString().split('T')[0] : '',
        status: convention.status || 'ACTIVE',
      });
    } else {
      reset({ 
        name: '', 
        companyId: '',
        reductionTousRisques: 1.0,
        reductionDommagesCollision: 1.0,
        reductionVol: 1.0,
        reductionIncendie: 1.0,
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        status: 'ACTIVE',
      });
    }
  }, [convention, reset]);

  const createMutation = useMutation({
    mutationFn: (data: ConventionForm) => api.post('/conventions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conventions'] });
      toast.success('Convention créée avec succès');
      onClose();
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ConventionForm) => api.put(`/conventions/${convention?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conventions'] });
      toast.success('Convention modifiée avec succès');
      onClose();
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    },
  });

  const onSubmit = (data: ConventionForm) => {
    if (convention) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (!isOpen) return null;

  const companyOptions = [
    { value: '', label: 'Sélectionner une compagnie' },
    ...(companies?.map((c: Company) => ({ value: c.id, label: c.name })) || []),
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {convention ? 'Modifier la convention' : 'Nouvelle convention'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nom de la convention"
            {...register('name')}
            error={errors.name?.message}
            placeholder="Ex: Convention Entreprise 2024"
          />

          <Select
            label="Compagnie"
            {...register('companyId')}
            error={errors.companyId?.message}
            options={companyOptions}
            disabled={!!convention}
            className={convention ? 'bg-gray-100 dark:bg-gray-900' : ''}
          />

          {convention && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              La compagnie ne peut pas être modifiée après création
            </p>
          )}

          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Taux de réduction par garantie</h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">1.0 = pas de réduction | 0.85 = 15% de réduction</p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Tous Risques"
                type="number"
                step="0.01"
                min="0"
                max="1"
                {...register('reductionTousRisques', { valueAsNumber: true })}
                placeholder="1.0"
                error={errors.reductionTousRisques?.message}
              />
              <Input
                label="Dommages Collision"
                type="number"
                step="0.01"
                min="0"
                max="1"
                {...register('reductionDommagesCollision', { valueAsNumber: true })}
                placeholder="1.0"
                error={errors.reductionDommagesCollision?.message}
              />
              <Input
                label="Vol"
                type="number"
                step="0.01"
                min="0"
                max="1"
                {...register('reductionVol', { valueAsNumber: true })}
                placeholder="1.0"
                error={errors.reductionVol?.message}
              />
              <Input
                label="Incendie"
                type="number"
                step="0.01"
                min="0"
                max="1"
                {...register('reductionIncendie', { valueAsNumber: true })}
                placeholder="1.0"
                error={errors.reductionIncendie?.message}
              />
            </div>
          </div>

          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Période de validité</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Date de début"
                type="date"
                {...register('startDate')}
                error={errors.startDate?.message}
              />
              <Input
                label="Date de fin (optionnel)"
                type="date"
                {...register('endDate')}
                error={errors.endDate?.message}
              />
            </div>
          </div>

          <Select
            label="Statut"
            {...register('status')}
            options={[
              { value: 'ACTIVE', label: 'Active' },
              { value: 'SUSPENDED', label: 'Suspendue' },
              { value: 'EXPIRED', label: 'Expirée' },
            ]}
          />

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Annuler
            </Button>
            <Button
              type="submit"
              loading={createMutation.isPending || updateMutation.isPending}
              className="flex-1"
            >
              {convention ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
