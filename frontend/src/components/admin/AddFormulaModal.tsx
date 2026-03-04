import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface AddFormulaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  type: 'VOL' | 'INCENDIE' | 'BG' | 'TOUS_RISQUES' | 'ASSISTANCE' | 'CAS' | 'PTA' | 'INCENDIE_EMEUTES' | 'DOMMAGES_EMEUTES' | 'CAT_NAT';
}

export const AddFormulaModal = ({ isOpen, onClose, onSubmit, type }: AddFormulaModalProps) => {
  const [formData, setFormData] = useState<any>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
    setFormData({});
    onClose();
  };

  const renderFields = () => {
    switch (type) {
      case 'VOL':
      case 'INCENDIE':
        return (
          <>
            <Input
              label="Taux (coefficient décimal, ex: 0.00236)"
              type="number"
              step="0.00001"
              value={formData.ratePercentage || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, ratePercentage: parseFloat(e.target.value) })}
              required
            />
            <Input
              label="Prime Fixe (DT)"
              type="number"
              step="0.01"
              value={formData.fixedPremium || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, fixedPremium: parseFloat(e.target.value) })}
              required
            />
            <Input
              label="Réduction (%, ex: 10 pour 10%)"
              type="number"
              step="0.01"
              value={formData.reductionRate || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, reductionRate: parseFloat(e.target.value) })}
            />
          </>
        );
      case 'BG':
        return (
          <>
            <Input
              label="Taux (coefficient décimal, ex: 0.065 pour 6.5%)"
              type="number"
              step="0.001"
              value={formData.ratePercentage || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, ratePercentage: parseFloat(e.target.value) })}
              required
            />
            <Input
              label="Réduction (%, ex: 10 pour 10%)"
              type="number"
              step="0.01"
              value={formData.reductionRate || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, reductionRate: parseFloat(e.target.value) })}
            />
          </>
        );
      case 'TOUS_RISQUES':
        return (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Franchise (0, 1, 2, ou 4) *
              </label>
              <select
                value={formData.franchiseRate || ''}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({ ...formData, franchiseRate: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                required
              >
                <option value="">Sélectionner</option>
                <option value="0">0%</option>
                <option value="1">1%</option>
                <option value="2">2%</option>
                <option value="4">4%</option>
              </select>
            </div>
            <Input
              label="Taux (coefficient décimal)"
              type="number"
              step="0.0001"
              value={formData.ratePercentage || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, ratePercentage: parseFloat(e.target.value) })}
              required
            />
            <Input
              label="Prime Fixe (DT)"
              type="number"
              step="0.01"
              value={formData.fixedPremium || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, fixedPremium: parseFloat(e.target.value) })}
              required
            />
            <Input
              label="Réduction (%, ex: 10 pour 10%)"
              type="number"
              step="0.01"
              value={formData.reductionRate || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, reductionRate: parseFloat(e.target.value) })}
            />
          </>
        );
      case 'PTA':
        return (
          <>
            <Input
              label="Capital (DT)"
              type="number"
              value={formData.minCapital || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, minCapital: parseFloat(e.target.value) })}
              required
            />
            <Input
              label="Prime (DT)"
              type="number"
              step="0.01"
              value={formData.fixedPremium || ''}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, fixedPremium: parseFloat(e.target.value) })}
              required
            />
          </>
        );
      default:
        return (
          <Input
            label="Prime Fixe (DT)"
            type="number"
            step="0.01"
            value={formData.fixedPremium || ''}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, fixedPremium: parseFloat(e.target.value) })}
            required
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md">
        <div className="flex justify-between items-center p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Ajouter une règle
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {renderFields()}

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
