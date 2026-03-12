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
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleClose = () => {
    setFormData({ minAmount: '', maxAmount: '', step: '' });
    setErrors({});
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const minNum = parseFloat(formData.minAmount);
    const maxNum = formData.maxAmount ? parseFloat(formData.maxAmount) : null;
    const stepNum = parseFloat(formData.step);
    
    const newErrors: Record<string, string> = {};

    // Validation
    if (isNaN(minNum)) {
      newErrors.minAmount = 'Valeur invalide';
    } else if (minNum <= 0) {
      newErrors.minAmount = 'Doit être supérieur à 0';
    }

    if (formData.maxAmount && isNaN(maxNum!)) {
      newErrors.maxAmount = 'Valeur invalide';
    } else if (maxNum !== null && maxNum <= minNum) {
      newErrors.maxAmount = 'Max doit être supérieur à Min';
    }

    if (isNaN(stepNum)) {
      newErrors.step = 'Valeur invalide';
    } else if (stepNum <= 0) {
      newErrors.step = 'Doit être supérieur à 0';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    onSubmit({ minAmount: minNum, maxAmount: maxNum, step: stepNum });
    setFormData({ minAmount: '', maxAmount: '', step: '' });
    setErrors({});
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="capital-tier-modal-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 id="capital-tier-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">
            Ajouter un palier de capital
          </h2>
          <button 
            onClick={handleClose} 
            className="text-gray-500 hover:text-gray-700"
            aria-label="Fermer la fenêtre"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Input
              label="Min Amount (DT)"
              type="number"
              min="1"
              step="1"
              value={formData.minAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setFormData({ ...formData, minAmount: e.target.value });
                setErrors({ ...errors, minAmount: '' });
              }}
              required
            />
            {errors.minAmount && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.minAmount}</p>
            )}
          </div>
          <div>
            <Input
              label="Max Amount (DT) - Optionnel"
              type="number"
              min="1"
              step="1"
              value={formData.maxAmount}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setFormData({ ...formData, maxAmount: e.target.value });
                setErrors({ ...errors, maxAmount: '' });
              }}
              placeholder="Laisser vide pour illimité"
            />
            {errors.maxAmount && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.maxAmount}</p>
            )}
          </div>
          <div>
            <Input
              label="Step (DT)"
              type="number"
              min="1"
              step="1"
              value={formData.step}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setFormData({ ...formData, step: e.target.value });
                setErrors({ ...errors, step: '' });
              }}
              required
            />
            {errors.step && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.step}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
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
