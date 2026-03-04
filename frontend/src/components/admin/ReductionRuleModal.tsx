import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';

const ruleSchema = z.object({
  guaranteeId: z.string().min(1, 'Garantie requise'),
  companyId: z.string().optional(),
  formulaType: z.enum(['STANDARD', 'TOUS_RISQUES_0', 'DOMMAGES_COLLISIONS', '']).optional(),
  usageType: z.enum(['PRIVATE_BUSINESS', 'COMMERCIAL', 'TAXI', 'RENTAL', '']).optional(),
  metric: z.enum(['NEW_VALUE', 'MARKET_VALUE', 'DC_CAPITAL', 'CAPITAL_OVER_VV_PERCENT']),
  minValue: z.string().optional(),
  maxValue: z.string().optional(),
  minInclusive: z.boolean().default(true),
  maxInclusive: z.boolean().default(false),
  discountPercent: z.string().min(1, 'Taux requis'),
  priority: z.string().default('0'),
  validFrom: z.string().optional(),
  validTo: z.string().optional(),
}).refine((data) => {
  const discount = parseFloat(data.discountPercent);
  return !isNaN(discount) && discount >= 0 && discount <= 100;
}, {
  message: 'Le taux doit être entre 0 et 100',
  path: ['discountPercent'],
});

type RuleForm = z.infer<typeof ruleSchema>;

interface ReductionRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  conventionId: string;
  convention: any;
  rule: any | null;
}

export const ReductionRuleModal = ({ isOpen, onClose, conventionId, convention, rule }: ReductionRuleModalProps) => {
  const queryClient = useQueryClient();
  const { register, handleSubmit, formState: { errors }, reset, watch } = useForm<RuleForm>({
    resolver: zodResolver(ruleSchema) as any,
  });

  const { data: guarantees } = useQuery({
    queryKey: ['guarantees'],
    queryFn: async () => {
      const { data } = await api.get('/guarantees');
      return data;
    },
    enabled: isOpen,
  });

  const companies = convention?.companies?.map((cc: any) => cc.company) || [];

  useEffect(() => {
    if (rule) {
      reset({
        guaranteeId: rule.guaranteeId,
        companyId: rule.companyId || '',
        formulaType: rule.formulaType || '',
        usageType: rule.usageType || '',
        metric: rule.metric,
        minValue: rule.minValue?.toString() || '',
        maxValue: rule.maxValue?.toString() || '',
        minInclusive: rule.minInclusive ?? true,
        maxInclusive: rule.maxInclusive ?? false,
        discountPercent: rule.discountPercent?.toString() || '',
        priority: rule.priority?.toString() || '0',
        validFrom: rule.validFrom ? new Date(rule.validFrom).toISOString().split('T')[0] : '',
        validTo: rule.validTo ? new Date(rule.validTo).toISOString().split('T')[0] : '',
      });
    } else {
      reset({
        guaranteeId: '',
        companyId: '',
        formulaType: '',
        usageType: '',
        metric: 'NEW_VALUE',
        minValue: '',
        maxValue: '',
        minInclusive: true,
        maxInclusive: false,
        discountPercent: '',
        priority: '0',
        validFrom: new Date().toISOString().split('T')[0],
        validTo: '',
      });
    }
  }, [rule, reset]);

  const createMutation = useMutation({
    mutationFn: (data: any) => api.post('/convention-reduction-rules', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convention-reduction-rules', conventionId] });
      toast.success('Règle créée avec succès');
      onClose();
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la création');
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => api.put(`/convention-reduction-rules/${rule?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['convention-reduction-rules', conventionId] });
      toast.success('Règle modifiée avec succès');
      onClose();
      reset();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Erreur lors de la modification');
    },
  });

  const onSubmit = (data: RuleForm) => {
    const payload = {
      conventionId,
      guaranteeId: data.guaranteeId,
      companyId: data.companyId || undefined,
      formulaType: data.formulaType || undefined,
      usageType: data.usageType || undefined,
      metric: data.metric,
      minValue: data.minValue ? parseFloat(data.minValue) : undefined,
      maxValue: data.maxValue ? parseFloat(data.maxValue) : undefined,
      minInclusive: data.minInclusive,
      maxInclusive: data.maxInclusive,
      discountPercent: parseFloat(data.discountPercent),
      priority: parseInt(data.priority),
      validFrom: data.validFrom ? new Date(data.validFrom) : undefined,
      validTo: data.validTo ? new Date(data.validTo) : undefined,
    };

    if (rule) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  if (!isOpen) return null;

  const minInclusive = watch('minInclusive');
  const maxInclusive = watch('maxInclusive');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            {rule ? 'Modifier le palier' : 'Nouveau palier de réduction'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Garantie *
              </label>
              <select
                {...register('guaranteeId')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Sélectionner</option>
                {guarantees?.map((g: any) => (
                  <option key={g.id} value={g.id}>{g.nameFr}</option>
                ))}
              </select>
              {errors.guaranteeId && (
                <p className="text-red-500 text-xs mt-1">{errors.guaranteeId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Compagnie (optionnel)
              </label>
              <select
                {...register('companyId')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Toutes les compagnies</option>
                {companies?.map((c: any) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Formule (optionnel)
              </label>
              <select
                {...register('formulaType')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Toutes</option>
                <option value="STANDARD">Standard</option>
                <option value="TOUS_RISQUES_0">Tous Risques 0%</option>
                <option value="DOMMAGES_COLLISIONS">Dommages Collision</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Usage (optionnel)
              </label>
              <select
                {...register('usageType')}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              >
                <option value="">Tous</option>
                <option value="PRIVATE_BUSINESS">Privé/Affaires</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="TAXI">Taxi</option>
                <option value="RENTAL">Location</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Métrique *
            </label>
            <select
              {...register('metric')}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="NEW_VALUE">Valeur à neuf</option>
              <option value="MARKET_VALUE">Valeur vénale</option>
              <option value="DC_CAPITAL">Capital DC</option>
              <option value="CAPITAL_OVER_VV_PERCENT">Capital/VV %</option>
            </select>
            {errors.metric && (
              <p className="text-red-500 text-xs mt-1">{errors.metric.message}</p>
            )}
          </div>

          <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Plage de valeurs</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    label="Valeur min"
                    type="number"
                    step="0.01"
                    {...register('minValue')}
                    placeholder="Laisser vide pour ∞"
                  />
                  <label className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 mt-6">
                    <input type="checkbox" {...register('minInclusive')} className="rounded" />
                    Inclusif ({minInclusive ? '≥' : '>'})
                  </label>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Input
                    label="Valeur max"
                    type="number"
                    step="0.01"
                    {...register('maxValue')}
                    placeholder="Laisser vide pour ∞"
                  />
                  <label className="flex items-center gap-1 text-xs text-gray-700 dark:text-gray-300 mt-6">
                    <input type="checkbox" {...register('maxInclusive')} className="rounded" />
                    Inclusif ({maxInclusive ? '≤' : '<'})
                  </label>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Taux de réduction (%) *"
              type="number"
              step="0.01"
              min="0"
              max="100"
              {...register('discountPercent')}
              error={errors.discountPercent?.message}
              placeholder="Ex: 35 pour 35%"
            />
            <Input
              label="Priorité"
              type="number"
              {...register('priority')}
              error={errors.priority?.message}
              placeholder="0 = basse, 100 = haute"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Valide à partir de"
              type="date"
              {...register('validFrom')}
              error={errors.validFrom?.message}
            />
            <Input
              label="Valide jusqu'à (optionnel)"
              type="date"
              {...register('validTo')}
              error={errors.validTo?.message}
            />
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
              {rule ? 'Modifier' : 'Créer'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
