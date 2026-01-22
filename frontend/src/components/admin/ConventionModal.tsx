import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Select } from '../ui/Select';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';
import type { Convention, Company } from '../../types';

const conventionSchema = z.object({
  name: z.string().min(2, 'Nom minimum 2 caractères').max(100),
  companyId: z.string().min(1, 'Compagnie requise'),
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
    resolver: zodResolver(conventionSchema),
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
      reset({ name: convention.name, companyId: convention.company.id });
    } else {
      reset({ name: '', companyId: '' });
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
    mutationFn: (data: ConventionForm) => api.patch(`/conventions/${convention?.id}`, { name: data.name }),
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
