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
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleClose = () => {
    setTierRate('');
    setError('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rateNum = parseFloat(tierRate);
    
    // Validation
    if (isNaN(rateNum)) {
      setError('Valeur invalide');
      return;
    }
    if (rateNum < 0) {
      setError('Le taux ne peut pas être négatif');
      return;
    }
    if (rateNum > 1) {
      setError('Le taux ne peut pas dépasser 1 (100%)');
      return;
    }
    
    onSubmit({ tierNumber: nextTierNumber, tierRate: rateNum });
    setTierRate('');
    setError('');
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="progressive-tier-modal-title"
    >
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 id="progressive-tier-modal-title" className="text-xl font-bold text-gray-900 dark:text-white">
            Ajouter Tranche {nextTierNumber}
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
              label={`Taux pour tranche ${nextTierNumber} (ex: 0.067 pour 6.7%)`}
              type="number"
              step="0.001"
              min="0"
              max="1"
              value={tierRate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setTierRate(e.target.value);
                setError('');
              }}
              required
            />
            {error && (
              <p className="text-xs text-red-600 dark:text-red-400 mt-1">{error}</p>
            )}
          </div>
          {tierRate && !isNaN(parseFloat(tierRate)) && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Aperçu: {(parseFloat(tierRate) * 100).toFixed(2)}%
            </div>
          )}

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
