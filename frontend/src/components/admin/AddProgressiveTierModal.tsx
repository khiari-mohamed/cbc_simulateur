import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface AddProgressiveTierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { tierNumber: number; tierRate: number }) => void;
  nextTierNumber: number;
}

export const AddProgressiveTierModal = ({ isOpen, onClose, onSubmit, nextTierNumber }: AddProgressiveTierModalProps) => {
  const [tierRate, setTierRate] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = parseFloat(tierRate);
    
    if (!isNaN(rateNum)) {
      onSubmit({ tierNumber: nextTierNumber, tierRate: rateNum });
      setTierRate('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Ajouter Tranche {nextTierNumber}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label={`Taux pour tranche ${nextTierNumber} (ex: 0.067 pour 6.7%)`}
            type="number"
            step="0.001"
            value={tierRate}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTierRate(e.target.value)}
            required
          />
          {tierRate && !isNaN(parseFloat(tierRate)) && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Aperçu: {(parseFloat(tierRate) * 100).toFixed(2)}%
            </div>
          )}

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
