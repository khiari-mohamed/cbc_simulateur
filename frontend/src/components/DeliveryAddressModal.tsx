import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './ui/Button';

interface DeliveryAddress {
  firstName: string;
  lastName: string;
  country: string;
  governorate: string;
  delegation: string;
  locality: string;
  postalCode: string;
  phone: string;
  email: string;
  notes: string;
}

interface DeliveryAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (address: DeliveryAddress) => void;
  userEmail?: string;
  userPhone?: string;
}

interface LocationData {
  Name: string;
  NameAr: string;
  Value: string;
  Delegations: Array<{
    Name: string;
    NameAr: string;
    Value: string;
    PostalCode: string;
  }>;
}

export const DeliveryAddressModal = ({ isOpen, onClose, onSubmit, userEmail, userPhone }: DeliveryAddressModalProps) => {
  const [formData, setFormData] = useState<DeliveryAddress>({
    firstName: '',
    lastName: '',
    country: 'Tunisie',
    governorate: '',
    delegation: '',
    locality: '',
    postalCode: '',
    phone: userPhone || '',
    email: userEmail || '',
    notes: '',
  });

  const [locationData, setLocationData] = useState<LocationData[]>([]);
  const [governorates, setGovernorates] = useState<string[]>([]);
  const [delegations, setDelegations] = useState<string[]>([]);
  const [localities, setLocalities] = useState<string[]>([]);

  // Update form when user data changes
  useEffect(() => {
    if (userEmail || userPhone) {
      setFormData(prev => ({
        ...prev,
        email: userEmail || prev.email,
        phone: userPhone || prev.phone,
      }));
    }
  }, [userEmail, userPhone]);

  // Load location data
  useEffect(() => {
    fetch('/state-municipality.json')
      .then(res => res.json())
      .then((data: LocationData[]) => {
        setLocationData(data);
        setGovernorates(data.map(g => g.Name));
      })
      .catch(err => console.error('Error loading location data:', err));
  }, []);

  // Update delegations when governorate changes
  useEffect(() => {
    if (formData.governorate && locationData.length > 0) {
      const gov = locationData.find(g => g.Name === formData.governorate);
      if (gov) {
        setDelegations(gov.Delegations.map(d => d.Name));
      }
      setFormData(prev => ({ ...prev, delegation: '', locality: '' }));
    }
  }, [formData.governorate, locationData]);

  // Update localities when delegation changes (use postal code as locality)
  useEffect(() => {
    if (formData.delegation && locationData.length > 0) {
      const gov = locationData.find(g => g.Name === formData.governorate);
      const del = gov?.Delegations.find(d => d.Name === formData.delegation);
      if (del) {
        setLocalities([del.Name]); // Use delegation name as locality
        setFormData(prev => ({ ...prev, locality: del.Name }));
      }
    }
  }, [formData.delegation, locationData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Adresse de livraison
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Pays/région <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.country}
              disabled
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white"
            />
          </div>

          {/* Governorate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Gouvernorat <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.governorate}
              onChange={(e) => setFormData({ ...formData, governorate: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionnez un gouvernorat</option>
              {governorates.map(gov => (
                <option key={gov} value={gov}>{gov}</option>
              ))}
            </select>
          </div>

          {/* Delegation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Délégation <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.delegation}
              onChange={(e) => setFormData({ ...formData, delegation: e.target.value })}
              disabled={!formData.governorate}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600"
            >
              <option value="">Sélectionnez une délégation</option>
              {delegations.map(del => (
                <option key={del} value={del}>{del}</option>
              ))}
            </select>
          </div>

          {/* Locality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Localité <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.locality}
              onChange={(e) => setFormData({ ...formData, locality: e.target.value })}
              disabled={!formData.delegation}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600"
            >
              <option value="">Sélectionnez une localité</option>
              {localities.map(loc => (
                <option key={loc} value={loc}>{loc}</option>
              ))}
            </select>
          </div>

          {/* Postal Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Code Postal <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.postalCode}
              onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Téléphone  <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              E-mail <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes de commande (facultatif)
            </label>
            <textarea
              rows={4}
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              placeholder="Informations supplémentaires pour la livraison..."
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" className="flex-1">
              Confirmer l'adresse
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
