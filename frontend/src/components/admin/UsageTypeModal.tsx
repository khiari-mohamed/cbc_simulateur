import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from './../ui/Button';
import { Card } from './../ui/Card';
import api from '../../lib/api/client';
import toast from 'react-hot-toast';

interface FeeConfigRow {
  companyId: string;
  contractFees: number | '';
  fpac: number | '';
  fssr: number | '';
  fg: number | '';
}

interface Company {
  id: string;
  name: string;
  code: string;
}

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
  const [feeConfigs, setFeeConfigs] = useState<FeeConfigRow[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Fetch all companies for dropdown
  const { data: companies } = useQuery<Company[]>({
    queryKey: ['companies'],
    queryFn: async () => {
      const { data } = await api.get('/companies?includeInactive=false');
      return data;
    },
  });

  useEffect(() => {
    if (editing) {
      setCode(editing.code || '');
      setNameFr(editing.nameFr || '');
      setNameAr(editing.nameAr || '');
      setNameEn(editing.nameEn || '');
      setIsActive(editing.isActive ?? true);
      
      // Pre-populate fee configs from editing data
      if (editing.usageFeeConfigs && editing.usageFeeConfigs.length > 0) {
        setFeeConfigs(
          editing.usageFeeConfigs.map((config: any) => ({
            companyId: config.company.id,
            contractFees: Number(config.contractFees),
            fpac: Number(config.fpac),
            fssr: Number(config.fssr),
            fg: Number(config.fg),
          }))
        );
      } else {
        setFeeConfigs([]);
      }
    } else {
      setCode('');
      setNameFr('');
      setNameAr('');
      setNameEn('');
      setIsActive(true);
      setFeeConfigs([]);
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

  const handleFeeConfigChange = (index: number, field: keyof FeeConfigRow, value: any) => {
    const updated = [...feeConfigs];
    updated[index] = { ...updated[index], [field]: value };
    setFeeConfigs(updated);
  };

  const handleSubmit = (e: any) => {
    e.preventDefault();
    if (!validate()) {
      toast.error('Veuillez corriger les erreurs');
      return;
    }

    // Filter and format fee configs (only complete rows)
    const validFeeConfigs = feeConfigs
      .filter(
        (row) =>
          row.companyId &&
          row.contractFees !== '' &&
          row.fpac !== '' &&
          row.fssr !== '' &&
          row.fg !== ''
      )
      .map((row) => ({
        companyId: row.companyId,
        contractFees: Number(row.contractFees),
        fpac: Number(row.fpac),
        fssr: Number(row.fssr),
        fg: Number(row.fg),
      }));

    const payload = {
      code: code.toUpperCase().trim(),
      nameFr: nameFr.trim(),
      nameAr: nameAr?.trim() || undefined,
      nameEn: nameEn?.trim() || undefined,
      isActive,
      feeConfigs: validFeeConfigs.length > 0 ? validFeeConfigs : undefined,
    };

    if (editing) {
      onUpdate(editing.id, payload);
    } else {
      onCreate(payload);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <Card className="p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">{editing ? 'Modifier Usage' : 'Créer Usage'}</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700" type="button">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Basic fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Code *</label>
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
              <label className="block text-sm font-medium mb-1">Nom (FR) *</label>
              <input
                value={nameFr}
                onChange={(e) => setNameFr(e.target.value)}
                className={`w-full px-3 py-2 border rounded ${errors.nameFr ? 'border-red-500' : ''}`}
              />
              {errors.nameFr && <p className="text-red-500 text-xs mt-1">{errors.nameFr}</p>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Nom (AR)</label>
              <input
                value={nameAr}
                onChange={(e) => setNameAr(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                dir="rtl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nom (EN)</label>
              <input
                value={nameEn}
                onChange={(e) => setNameEn(e.target.value)}
                className="w-full px-3 py-2 border rounded"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
            <label className="text-sm">Actif</label>
          </div>

          {/* Fee configuration section */}
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-semibold">Frais par compagnie</h4>
            </div>
            
            {/* Company selector with checkboxes */}
            <div className="mb-4 p-3 bg-gray-50 rounded border">
              <p className="text-xs text-gray-600 mb-2">Sélectionnez les compagnies à configurer:</p>
              <div className="space-y-2">
                {companies?.map((company) => {
                  const isSelected = feeConfigs.some((c) => c.companyId === company.id);
                  return (
                    <label key={company.id} className="flex items-center gap-2 cursor-pointer hover:bg-gray-100 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            // Add company with empty fees
                            setFeeConfigs([
                              ...feeConfigs,
                              {
                                companyId: company.id,
                                contractFees: '',
                                fpac: '',
                                fssr: '',
                                fg: '',
                              },
                            ]);
                          } else {
                            // Remove company
                            setFeeConfigs(feeConfigs.filter((c) => c.companyId !== company.id));
                          }
                        }}
                        className="rounded"
                      />
                      <span className="text-sm font-medium">{company.name}</span>
                      <span className="text-xs text-gray-500">({company.code})</span>
                    </label>
                  );
                })}
              </div>
            </div>

            {feeConfigs.length === 0 ? (
              <p className="text-sm text-gray-500 italic">
                Aucune compagnie sélectionnée. Les frais par défaut de chaque compagnie seront utilisés.
              </p>
            ) : (
              <div className="space-y-3">
                {feeConfigs.map((config, index) => {
                  const company = companies?.find((c) => c.id === config.companyId);
                  return (
                    <div key={config.companyId} className="p-3 bg-white rounded border">
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="text-sm font-semibold text-gray-700">{company?.name}</h5>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        <div>
                          <label className="block text-xs mb-1">Frais contrat (DT)</label>
                          <input
                            type="number"
                            value={config.contractFees}
                            onChange={(e) => handleFeeConfigChange(index, 'contractFees', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-sm"
                            min="0"
                            step="1"
                            placeholder="30"
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1">FPAC (%)</label>
                          <input
                            type="number"
                            value={config.fpac}
                            onChange={(e) => handleFeeConfigChange(index, 'fpac', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-sm"
                            min="0"
                            step="0.01"
                            placeholder="0.5"
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1">FSSR (%)</label>
                          <input
                            type="number"
                            value={config.fssr}
                            onChange={(e) => handleFeeConfigChange(index, 'fssr', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-sm"
                            min="0"
                            step="0.01"
                            placeholder="0.3"
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1">FG (DT)</label>
                          <input
                            type="number"
                            value={config.fg}
                            onChange={(e) => handleFeeConfigChange(index, 'fg', e.target.value)}
                            className="w-full px-2 py-1 border rounded text-sm"
                            min="0"
                            step="0.01"
                            placeholder="3"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button variant="outline" onClick={onClose} type="button" disabled={isLoading}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
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
