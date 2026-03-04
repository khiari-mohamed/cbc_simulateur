import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, Calendar } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';

const conventionSchema = z.object({
  name: z.string().min(2, 'Nom minimum 2 caractères').max(100),
  organizationId: z.string().min(1, 'Organisation requise'),
  companyIds: z.array(z.string()).min(1, 'Au moins une compagnie requise'),
  startDate: z.string().optional().or(z.literal('')),
  endDate: z.string().optional().or(z.literal('')),
  status: z.enum(['ACTIVE', 'INACTIVE', 'EXPIRED']).optional(),
}).refine((data) => {
  if (data.startDate && data.endDate && data.startDate !== '' && data.endDate !== '') {
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
  convention: any | null;
}

export const ConventionModal = ({ isOpen, onClose, convention }: ConventionModalProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, reset, watch, setValue } = useForm<ConventionForm>({
    resolver: zodResolver(conventionSchema) as any,
  });

  const { data: organizations } = useQuery({
    queryKey: ['client-organizations'],
    queryFn: async () => {
      const { data } = await api.get('/client-organizations');
      return data;
    },
    enabled: isOpen,
  });

  const { data: companies } = useQuery({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data } = await api.get('/companies');
      return data;
    },
    enabled: isOpen,
  });

  const selectedCompanyIds = watch('companyIds') || [];

  useEffect(() => {
    if (convention) {
      reset({ 
        name: convention.name, 
        organizationId: convention.organizationId,
        companyIds: convention.companies?.map((c: any) => c.companyId) || [],
        startDate: convention.startDate ? new Date(convention.startDate).toISOString().split('T')[0] : '',
        endDate: convention.endDate ? new Date(convention.endDate).toISOString().split('T')[0] : '',
        status: convention.status || 'ACTIVE',
      });
    } else {
      reset({ 
        name: '', 
        organizationId: '',
        companyIds: [],
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
    const payload = {
      ...data,
      startDate: data.startDate || undefined,
      endDate: data.endDate || undefined,
    };
    if (convention) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (!isOpen) return null;

  const toggleCompany = (companyId: string) => {
    const current = selectedCompanyIds;
    if (current.includes(companyId)) {
      setValue('companyIds', current.filter((id: string) => id !== companyId));
    } else {
      setValue('companyIds', [...current, companyId]);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {convention ? 'Modifier la convention' : 'Nouvelle convention'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <Input
            label="Nom de la convention"
            {...register('name')}
            error={errors.name?.message}
            placeholder="Ex: Convention ATB Bank 2024"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Organisation cliente *
            </label>
            <select
              {...register('organizationId')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              disabled={!!convention}
            >
              <option value="">Sélectionner une organisation</option>
              {organizations?.map((org: any) => (
                <option key={org.id} value={org.id}>{org.name}</option>
              ))}
            </select>
            {errors.organizationId && (
              <p className="text-red-500 text-xs mt-1">{errors.organizationId.message}</p>
            )}
            {convention && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                L'organisation ne peut pas être modifiée après création
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Compagnies * (sélection multiple)
            </label>
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-3 max-h-48 overflow-y-auto">
              {companies?.map((company: any) => (
                <label key={company.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedCompanyIds.includes(company.id)}
                    onChange={() => toggleCompany(company.id)}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span className="text-sm text-gray-900 dark:text-white">{company.name}</span>
                </label>
              ))}
            </div>
            {errors.companyIds && (
              <p className="text-red-500 text-xs mt-1">{errors.companyIds.message}</p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {selectedCompanyIds.length} compagnie(s) sélectionnée(s)
            </p>
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

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Statut
            </label>
            <select
              {...register('status')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="EXPIRED">Expirée</option>
            </select>
          </div>

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
