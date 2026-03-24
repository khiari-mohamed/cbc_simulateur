import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import toast from 'react-hot-toast';

interface AddVvRangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { minVv: number; maxVv: number | null }) => void;
}

export const AddVvRangeModal = ({ isOpen, onClose, onSubmit }: AddVvRangeModalProps) => {
  const [formData, setFormData] = useState({ minVv: '', maxVv: '' });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const minNum = parseFloat(formData.minVv);
    const maxNum = formData.maxVv ? parseFloat(formData.maxVv) : null;
    
    if (isNaN(minNum) || minNum <= 0) {
      toast.error('Min VV doit être supérieur à 0');
      return;
    }
    
    if (maxNum !== null && maxNum <= minNum) {
      toast.error('Max VV doit être supérieur à Min VV');
      return;
    }
    
    onSubmit({ minVv: minNum, maxVv: maxNum });
    setFormData({ minVv: '', maxVv: '' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Ajouter une tranche VV
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Min VV (DT)"
            type="number"
            value={formData.minVv}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, minVv: e.target.value })}
            required
          />
          <Input
            label="Max VV (DT) - Optionnel"
            type="number"
            value={formData.maxVv}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, maxVv: e.target.value })}
            placeholder="Laisser vide pour illimité"
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

interface AddCapitalColumnModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { amount: number; order: number }) => void;
  nextOrder: number;
}

export const AddCapitalColumnModal = ({ isOpen, onClose, onSubmit, nextOrder }: AddCapitalColumnModalProps) => {
  const [amount, setAmount] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = parseFloat(amount);
    
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Capital doit être supérieur à 0');
      return;
    }
    
    onSubmit({ amount: amountNum, order: nextOrder });
    setAmount('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Ajouter une colonne de capital
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Montant Capital (DT)"
            type="number"
            value={amount}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmount(e.target.value)}
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
