import { useEffect, useState } from 'react';
import { Button } from './../ui/Button';
import { Card } from './../ui/Card';
import toast from 'react-hot-toast';

interface UsageTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: any) => void;
  onUpdate: (id: string, payload: any) => void;
  editing: any;
  isLoading?: boolean;
}

const UsageTypeModal = ({ isOpen, onClose, onCreate, onUpdate, editing, isLoading }: UsageTypeModalProps) => {
  const [code, setCode] = useState('');
  const [nameFr, setNameFr] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editing) {
      setCode(editing.code || '');
      setNameFr(editing.nameFr || '');
      setNameAr(editing.nameAr || '');
      setNameEn(editing.nameEn || '');
      setIsActive(editing.isActive ?? true);
    } else {
      setCode('');
      setNameFr('');
      setNameAr('');
      setNameEn('');
      setIsActive(true);
    }
    setErrors({});
  }, [editing, isOpen]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!code.trim()) newErrors.code = 'Le code est requis';
    else if (!/^[A-Z0-9_]+$/.test(code)) newErrors.code = 'Majuscules, chiffres et _ uniquement';
    if (!nameFr.trim()) newErrors.nameFr = 'Le nom français est requis';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Veuillez corriger les erreurs');
      return;
    }
    const payload = { 
      code: code.toUpperCase().trim(), 
      nameFr: nameFr.trim(), 
      nameAr: nameAr?.trim() || undefined, 
      nameEn: nameEn?.trim() || undefined, 
      isActive 
    };
    if (editing) {
      onUpdate(editing.id, payload);
    } else {
      onCreate(payload);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <Card className="p-6 w-full max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{editing ? 'Modifier Usage' : 'Créer Usage'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" type="button">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-sm">Code *</label>
            <input 
              value={code} 
              onChange={(e) => setCode(e.target.value.toUpperCase())} 
              className={`w-full px-3 py-2 border rounded ${errors.code ? 'border-red-500' : ''}`} 
              disabled={!!editing} 
            />
            {errors.code && <p className="text-red-500 text-xs mt-1">{errors.code}</p>}
            {editing && <p className="text-gray-500 text-xs mt-1">Le code ne peut pas être modifié</p>}
          </div>
          <div>
            <label className="block text-sm">Nom (FR) *</label>
            <input 
              value={nameFr} 
              onChange={(e) => setNameFr(e.target.value)} 
              className={`w-full px-3 py-2 border rounded ${errors.nameFr ? 'border-red-500' : ''}`} 
            />
            {errors.nameFr && <p className="text-red-500 text-xs mt-1">{errors.nameFr}</p>}
          </div>
          <div>
            <label className="block text-sm">Nom (AR)</label>
            <input 
              value={nameAr} 
              onChange={(e) => setNameAr(e.target.value)} 
              className="w-full px-3 py-2 border rounded" 
              dir="rtl" 
            />
          </div>
          <div>
            <label className="block text-sm">Nom (EN)</label>
            <input 
              value={nameEn} 
              onChange={(e) => setNameEn(e.target.value)} 
              className="w-full px-3 py-2 border rounded" 
            />
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <label>Actif</label>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose} type="button" disabled={isLoading}>Annuler</Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  {editing ? 'Modification...' : 'Création...'}
                </span>
              ) : (
                editing ? 'Modifier' : 'Créer'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default UsageTypeModal;
