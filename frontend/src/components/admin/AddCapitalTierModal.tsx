import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface AddCapitalTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { minAmount: number; maxAmount: number | null; step: number }) => void;
}

export const AddCapitalTierModal = ({ isOpen, onClose, onSubmit }: AddCapitalTierModalProps) => {
  const [formData, setFormData] = useState({ minAmount: '', maxAmount: '', step: '' });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const minNum = parseFloat(formData.minAmount);
    const maxNum = formData.maxAmount ? parseFloat(formData.maxAmount) : null;
    const stepNum = parseFloat(formData.step);
    
    if (!isNaN(minNum) && !isNaN(stepNum) && (maxNum === null || !isNaN(maxNum))) {
      onSubmit({ minAmount: minNum, maxAmount: maxNum, step: stepNum });
      setFormData({ minAmount: '', maxAmount: '', step: '' });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Ajouter un palier de capital
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Min Amount (DT)"
            type="number"
            value={formData.minAmount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, minAmount: e.target.value })}
            required
          />
          <Input
            label="Max Amount (DT) - Optionnel"
            type="number"
            value={formData.maxAmount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, maxAmount: e.target.value })}
            placeholder="Laisser vide pour illimité"
          />
          <Input
            label="Step (DT)"
            type="number"
            value={formData.step}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, step: e.target.value })}
            required
          />

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              Créer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
