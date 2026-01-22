import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';
import type { Company } from '../../types';

const companySchema = z.object({
  name: z.string().min(2, 'Nom minimum 2 caractères').max(100),
  code: z.string()
    .min(2, 'Code minimum 2 caractères')
    .max(20)
    .regex(/^[A-Z0-9_]+$/, 'Code doit être en majuscules avec underscores'),
});

type CompanyForm = z.infer<typeof companySchema>;

interface CompanyModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
}

export const CompanyModal = ({ isOpen, onClose, company }: CompanyModalProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, reset } = useForm<CompanyForm>({
    resolver: zodResolver(companySchema),
  });

  useEffect(() => {
    if (company) {
      reset({ name: company.name, code: company.code });
    } else {
      reset({ name: '', code: '' });
    }
  }, [company, reset]);

  const createMutation = useMutation({
    mutationFn: (data: CompanyForm) => api.post('/companies', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Compagnie créée avec succès');
      onClose();
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: CompanyForm) => api.patch(`/companies/${company?.id}`, { name: data.name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['companies'] });
      toast.success('Compagnie modifiée avec succès');
      onClose();
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    },
  });

  const onSubmit = (data: CompanyForm) => {
    if (company) {
      updateMutation.mutate(data);
    } else {
      createMutation.mutate(data);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {company ? 'Modifier la compagnie' : 'Nouvelle compagnie'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Nom de la compagnie"
            {...register('name')}
            error={errors.name?.message}
            placeholder="Ex: Assurance Générale"
          />

          <Input
            label="Code"
            {...register('code')}
            error={errors.code?.message}
            placeholder="Ex: AG_2024"
            disabled={!!company}
            className={company ? 'bg-gray-100 dark:bg-gray-900' : ''}
          />

          {company && (
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Le code ne peut pas être modifié après création
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
              {company ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
