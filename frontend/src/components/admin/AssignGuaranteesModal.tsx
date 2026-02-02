import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { X, CheckCircle } from 'lucide-react';
import { Button } from '../ui/Button';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';
import type { Convention, Guarantee } from '../../types';

interface AssignGuaranteesModalProps {
  isOpen: boolean;
  onClose: () => void;
  convention: Convention | null;
}

export const AssignGuaranteesModal = ({ isOpen, onClose, convention }: AssignGuaranteesModalProps) => {
  const [selectedGuarantees, setSelectedGuarantees] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: allGuarantees } = useQuery({
    queryKey: ['guarantees'],
    queryFn: async () => {
      const { data } = await api.get('/guarantees');
      return data as Guarantee[];
    },
    enabled: isOpen,
  });

  useEffect(() => {
    if (convention?.guarantees) {
      setSelectedGuarantees(convention.guarantees.map((cg: any) => cg.guarantee.id));
    }
  }, [convention]);

  const assignMutation = useMutation({
    mutationFn: async (guaranteeIds: string[]) => {
      await api.post(`/conventions/${convention?.id}/guarantees`, { guaranteeIds });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conventions'] });
      toast.success('Garanties assignées');
      onClose();
    },
    onError: () => toast.error('Erreur lors de l\'assignation'),
  });

  const handleToggle = (guaranteeId: string) => {
    setSelectedGuarantees(prev =>
      prev.includes(guaranteeId)
        ? prev.filter(id => id !== guaranteeId)
        : [...prev, guaranteeId]
    );
  };

  const handleSubmit = () => {
    assignMutation.mutate(selectedGuarantees);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Assigner des garanties - {convention?.name}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 mb-6">
          {allGuarantees?.map((guarantee) => (
            <div
              key={guarantee.id}
              onClick={() => handleToggle(guarantee.id)}
              className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                selectedGuarantees.includes(guarantee.id)
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{guarantee.nameFr}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{guarantee.code}</p>
                </div>
                {selectedGuarantees.includes(guarantee.id) && (
                  <CheckCircle className="w-5 h-5 text-primary-600" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <Button onClick={handleSubmit} disabled={assignMutation.isPending} className="flex-1">
            {assignMutation.isPending ? 'Assignation...' : 'Assigner'}
          </Button>
          <Button variant="outline" onClick={onClose}>
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
};
